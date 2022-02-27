import {createSpinner} from "nanospinner";
import fetch from "node-fetch";
import {Modes} from "../models/model.js";
import dotenv from 'dotenv';
import {Logger} from '../utils/logger.js';
import {appendToCache, notInCache, readFromCache} from "../cache/cache.js";
dotenv.config();
const logger = new Logger();

export async function fetchStockData(symbols, mode = Modes.CACHE_ONLY) {
    const cacheSpinner = createSpinner('Retrieving data from cache...').start();
    try {
        const cachedStockData = mode === Modes.NO_CACHE ? [] : (await readFromCache() ?? []);
        const symbolsNotInCache = mode === Modes.NO_CACHE ? symbols : await notInCache(symbols, cachedStockData);
        cacheSpinner.success({text: 'Retrieved data from cache successfully'});
        if (!symbolsNotInCache || mode === Modes.CACHE_ONLY) {
            return cachedStockData;
        }

        const limit = 10;
        // https is not supported for current plan
        const url = 'http://api.marketstack.com/v1/eod/latest';
        const spinner = createSpinner('Fetching stock data...').start();
        try {
            const rawRes = await fetch(`${url}?access_key=${process.env.STOCK_API_KEY}&symbols=${symbolsNotInCache}&limit=${limit}`);
            const res = await rawRes.json();
            const prices = res.data.map((entry, idx) => [`\r${symbolsNotInCache.split(',')[idx]}: ${entry.close}$\r`]);
            await appendToCache(prices);
            spinner.success({text: 'Fetched stock data successfully'});
            return prices.concat(cachedStockData);
        } catch (e) {
            logger.error(`Failed to fetch stock data (fetchStockData), ${e}`);
            spinner.error({text: `Fetching stock data failed`});
            return [];
        }
    } catch (err) {
        logger.error(`Failed to retrieve data from cache (fetchStockData), ${err}`);
        cacheSpinner.error({text: `Retrieving data from cache failed`});
        return [];
    }
}

export async function fetchStockDataV2(symbol, mode = Modes.CACHE_ONLY) {
    const cacheSpinner = createSpinner('Retrieving data from cache...').start();
    try {
        const cachedStockData = mode === Modes.NO_CACHE ? [] : (await readFromCache() ?? []);
        const symbolNotInCache = mode === Modes.NO_CACHE ? symbol : await notInCache(symbol, cachedStockData);
        cacheSpinner.success({text: 'Retrieved data from cache successfully'});
        if (!symbolNotInCache || mode === Modes.CACHE_ONLY) {
            return cachedStockData;
        }

        const url = 'https://finnhub.io/api/v1/quote';
        const spinner = createSpinner('Fetching stock data...').start();
        try {
            const rawRes = await fetch(`${url}?symbol=${symbolNotInCache}&token=${process.env.STOCK_V2_API_KEY}`);
            const res = await rawRes.json();
            const price = res?.c;
            const stockData = [[`${symbolNotInCache}: ${price}$`]];
            await appendToCache(stockData);
            spinner.success({text: 'Fetched stock data successfully'});
            return [[symbolNotInCache, `${price}$`]];
        } catch (e) {
            logger.error(`Failed to fetch stock data (fetchStockDataV2), ${e}`);
            spinner.error({text: `Fetching stock data failed`});
            return [];
        }
    } catch (err) {
        logger.error(`Failed to retrieve data from cache (fetchStockDataV2), ${err}`);
        cacheSpinner.error({text: `Retrieving data from cache failed`});
        return [];
    }
}
