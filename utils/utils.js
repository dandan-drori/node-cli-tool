export function transformOutput(stocksData) {
    return stocksData.reduce((acc, stockArr) => {
        const [stock, price] = stockArr;
        acc[stock] = price;
        return acc;
    }, {});
}
