import {access, appendFile, readFile, writeFile} from "fs/promises";
import dotenv from 'dotenv';
import {Logger} from '../logger.js';
dotenv.config();
const logger = new Logger();

export async function getCacheLastUpdated() {
    const lastUpdated = await readFile(`./${process.env.LAST_UPDATED_FILE}`);
    return new Date(lastUpdated);
}

export async function isCacheStale() {
    const staleTime = 2 * 1000 * 60 * 60; // 2 hours
    const lastUpdated = getCacheLastUpdated();
    return Date.now() - lastUpdated.getTime() > staleTime;
}

export async function logCacheLastUpdated() {
    const dateString = new Date().toISOString();
    await writeFile(`./${process.env.LAST_UPDATED_FILE}`, dateString);
}

export async function appendToCache(stockPrices, overrideFile = false) {
    const headers = 'Symbol,Price';
    try {
        await access(`./${process.env.CACHE_STOCK_FILE_PATH}`);
    } catch (e) {
        const stocks = stockPrices.reduce((acc, stockArr) => {
            const [stock] = stockArr;
            const [symbol, priceStr] = stock.split(':');
            const price = priceStr.substring(0, priceStr.length);
            return acc + `${symbol} ${price}\n`;
        }, ``);
        await writeFile(`./${process.env.CACHE_STOCK_FILE_PATH}`, `${headers}\n${stocks}`);
        return logCacheLastUpdated();
    }
    const stocks = stockPrices.reduce((acc, stockArr) => {
        const [stock] = stockArr;
        const [symbol, priceStr] = stock.split(':');
        const price = priceStr.substring(0, priceStr.length);
        return acc + `${symbol},${price}\n`;
    }, ``);
    logger.info(`stocks appended to file: ${stocks}`)
    if (overrideFile) {
        await writeFile(`./${process.env.CACHE_STOCK_FILE_PATH}`, `${headers}\n${stocks}`);
        return logCacheLastUpdated();
    }
    await appendFile(`./${process.env.CACHE_STOCK_FILE_PATH}`, stocks);
    logCacheLastUpdated();
}

export async function readFromCache() {
    const dataBuffer = await readFile(`./${process.env.CACHE_STOCK_FILE_PATH}`);
    const data = dataBuffer.toString();
    const stocks = data.split('\n').filter((r, idx) => idx !== 0 && r);
    return stocks.map(stock => {
        const splitStock = stock.split(',');
        const trimmed = splitStock.map(r => r.trim());
        return trimmed.filter(s => s);
    });
}

export async function notInCache(symbols, stocksCache) {
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
