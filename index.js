#!/usr/bin/env node

import {getDataFromUser} from "./prompt/prompt.js";
import {fetchStockData, fetchStockDataV2} from "./api/api.js";
import {transformOutput} from "./utils/utils.js";

const { symbols, mode } = await getDataFromUser();
const prices = await fetchStockDataV2(symbols, mode);
console.log('Stock Data:', transformOutput(prices));
