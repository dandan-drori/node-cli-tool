#!/usr/bin/env node

import inquirer from 'inquirer'; // prompt user for input
import gradient from 'gradient-string'; // color the ascii art
import figlet from 'figlet'; // ascii art
import {createSpinner} from 'nanospinner'; // loading spinner when waiting
import {program} from 'commander'; // parse command line arguments
import dotenv from 'dotenv'; // load environment variables
import fetch from 'node-fetch'; // make http requests to external APIs

// native in Node.js
import {readFile, writeFile, appendFile, access} from 'fs/promises'; // interact with files
import {promisify} from 'util';
import {exec} from 'child_process';

dotenv.config();
const execPrm = promisify(exec);

let user;

const sleep = (ms = 2000) => new Promise((r) => setTimeout(r, ms));

function winner() {
  console.clear();
  const msg = `Congrats, ${user} !`;
  figlet(msg, (err, data) => {
    console.log(gradient.pastel.multiline(data));
  });
}

async function handleAnswer(isCorrect) {
  const spinner = createSpinner('Checking answer...').start();
  await sleep();

  if (isCorrect) {
    spinner.success({text: `Nice work ${user}!`});
    return;
  }
  spinner.error({text: `Game over, you lose ${user}`})
}

async function askName() {
  const answers = await inquirer.prompt({
    name: 'playerName',
    type: 'input',
    message: 'What is your name?',
    default() {
      return 'User';
    }
  });
  user = answers.playerName;
  console.log('Your name is:', user); 
} 

async function question1() { 
  const answers = await inquirer.prompt({ 
    name: 'question1',
    type: 'list', 
    message: 'How are you today?\n', 
    choices: [ 
    'well', 
    'very good', 
    'great!', 
    'not so good' 
    ] 
  }); 
  return handleAnswer(answers.question1 === 'great!');
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

async function notInCache(symbols) {
  const stocksCache = await readFromCache();
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
  const symbolsNotInCache = mode === modes.NO_CACHE ? symbols : await notInCache(symbols);
  const cachedStockData = mode === modes.NO_CACHE ? [] : (await readFromCache() ?? []);
  if (!symbolsNotInCache || mode === modes.CACHE_ONLY) {
    console.log('Fetched only from cache'); 
    return cachedStockData;
  }

  const limit = 10;
  const url = 'http://api.marketstack.com/v1/eod/latest';
  const rawRes = await fetch(`${url}?access_key=${process.env.STOCK_API_KEY}&symbols=${symbolsNotInCache}&limit=${limit}`);
  const res = await rawRes.json();
  const prices = res.data.map((entry, idx) => [`\r${symbolsNotInCache.split(',')[idx]}: ${entry.close}$\r`]);
  await appendToCache(prices);
  return prices.concat(cachedStockData);
}

async function main() {
  program
    .version('1.0.0', '-v, --version')
    .usage('[OPTIONS]...')
    .option('-f, --flag', 'Detects if the flag is present.')
    .option('-s, --symbols <value>', 'List of stock symbols (TSLA,AAPL)...', [])
    .parse(process.argv);
  const options = program.opts();
  const flag = options.flag ? 'Flag is present.' : 'Flag is not present.';

  // const symbols = options.symbols ? options.symbols.toUpperCase() : [];
  // const prices = await fetchStockData(symbols, 3);
  // console.log(prices);

  const {stdout} = await execPrm('ls'); // execute ls command
  console.log(stdout.split('\n').filter(f => f)); // log the output of the ls previous command
  //console.log(await execPrm('echo "This is copied text from script" | pbcopy'));

  //await askName();
  //await question1();
  //await winner();
}

await main();

