const https = require('https');
const config = require('../config.json');

const history = [];

function fetchBitcoinData() {
  const symbol = config.symbol || 'BTCUSDT';
  https.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      try {
        const json = JSON.parse(data);
        if (json.lastPrice && json.volume) {
          const entry = {
            timestamp: new Date().toISOString(),
            price: json.lastPrice,
            volume: json.volume
          };
          history.push(entry);
          // Keep history within limit defined in config
          const limit = config.historyLimit || 100;
          if (history.length > limit) {
            history.shift();
          }
          console.log(`[${entry.timestamp}] Stored ${symbol} data: Price ${entry.price}, Volume ${entry.volume}`);
        } else {
          console.error('Unexpected Binance response format:', json);
        }
      } catch (e) {
        console.error('Error parsing Binance response:', e);
      }
    });
  }).on('error', (err) => {
    console.error('Error fetching from Binance:', err.message);
  });
}

function start() {
  // Fetch immediately on start
  fetchBitcoinData();
  // Fetch at interval defined in config (default 10 minutes)
  const interval = (config.fetchIntervalSeconds || 60) * 1000;
  setInterval(fetchBitcoinData, interval);
}

function getHistory() {
  // Return a copy to avoid external modification
  return [...history];
}

module.exports = {
  start,
  getHistory,
  config
};
