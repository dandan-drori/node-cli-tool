#!/usr/bin/env node

import inquirer from 'inquirer';
import {createSpinner} from 'nanospinner';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import {readFile, writeFile, appendFile, access} from 'fs/promises';
dotenv.config();

function transformOutput(stocksData) {
  return stocksData.reduce((acc, stockArr) => {
    const [stock, price] = stockArr;
    acc[stock] = price;
    return acc;
  }, {});
}

async function getSymbols() {
  const answers = await inquirer.prompt({
    name: 'symbols',
    type: 'input',
    message: 'Choose stock symbols:',
    default() {
      return 'TSLA,AAPL,MSFT,GOOGL,AMZN,S&P 500,U';
    }
  });
  return answers.symbols.toUpperCase();
}

async function getMode() {
  const answers = await inquirer.prompt({ 
    name: 'mode',
    type: 'list', 
    message: 'Choose fetch mode:\n',
    choices: [ 
      'Offline (cache only)',
      'Normal (prefer cache)',
      'Override (no cache)'
    ]
  });
  const modes = {
    'Normal (prefer cache)': 1,
    'Override (no cache)': 2,
    'Offline (cache only)': 3
  };
  return modes[answers.mode];
}

async function getDataFromUser() {
  const symbols = await getSymbols();
  const mode = await getMode();
  return [symbols, mode];
}

async function appendToCache(stockPrices, overrideFile = false) {
  try {
    await access(`./${process.env.CACHE_STOCK_FILE_PATH}`);
  } catch (e) {
    const stocks = stockPrices.reduce((acc, stockArr) => {
      const [stock] = stockArr;
      const [symbol, priceStr] = stock.split(':');
      const price = priceStr.substring(0, priceStr.length);
      return acc + `${symbol} ${price}\n`;
    }, ``);
    const headers = 'Symbol, Price';
    return await writeFile(`./${process.env.CACHE_STOCK_FILE_PATH}`, `${headers}\n${stocks}`);
  }
  const stocks = stockPrices.reduce((acc, stockArr) => {
    const [stock] = stockArr;
    const [symbol, priceStr] = stock.split(':');
    const price = priceStr.substring(0, priceStr.length);
    return acc + `${symbol} ${price}\n`;
  }, ``);
  console.log('appending to file');
  const appendOrWrite = overrideFile ? writeFile : appendFile;
  await appendOrWrite(`./${process.env.CACHE_STOCK_FILE_PATH}`, stocks);
}

async function readFromCache() {
  const dataBuffer = await readFile(`./${process.env.CACHE_STOCK_FILE_PATH}`); 
  const data = dataBuffer.toString();
  const stocks = data.split('\n').filter((r, idx) => idx !== 0 && r);
  return stocks.map(stock => {
    const splitStock = stock.split(',');
    const trimmed = splitStock.map(r => r.trim());
    return trimmed.filter(s => s);
  });
}

async function notInCache(symbols, stocksCache) {
  const filtered = symbols.split(',').filter(requestedSymbol => {
    let isInCache = false;
    stocksCache.forEach(stock => {
      const [symbol] = stock;
      if (requestedSymbol === symbol) {
        isInCache = true;
      }
    })
    return !isInCache;
  });
  return filtered.join(',');
}

async function fetchStockData(symbols, mode = 1) {
  const modes = {
    NORMAL: 1,
    NO_CACHE: 2,
    CACHE_ONLY: 3
  };
  const cacheSpinner = createSpinner('Retrieving data from cache...').start();
  try {
    const cachedStockData = mode === modes.NO_CACHE ? [] : (await readFromCache() ?? []);
    const symbolsNotInCache = mode === modes.NO_CACHE ? symbols : await notInCache(symbols, cachedStockData);
    cacheSpinner.success({text: 'Retrieved data from cache successfully'});
    if (!symbolsNotInCache || mode === modes.CACHE_ONLY) {
      return cachedStockData;
    }

    const limit = 10;
    const url = 'https://api.marketstack.com/v1/eod/latest';
    const spinner = createSpinner('Fetching stock data...').start();
    try {
      const rawRes = await fetch(`${url}?access_key=${process.env.STOCK_API_KEY}&symbols=${symbolsNotInCache}&limit=${limit}`);
      const res = await rawRes.json();
      const prices = res.data.map((entry, idx) => [`\r${symbolsNotInCache.split(',')[idx]}: ${entry.close}$\r`]);
      await appendToCache(prices);
      spinner.success({text: 'Fetched stock data successfully'});
      return prices.concat(cachedStockData);
    } catch (e) {
      spinner.error({text: `Fetching stock data failed`})
    }
  } catch (err) {
    cacheSpinner.error({text: `Retrieving data from cache failed`})
  }
}

async function main() {
  const [symbols, mode] = await getDataFromUser();
  const prices = await fetchStockData(symbols, mode);
  console.log(transformOutput(prices));
}

await main();
