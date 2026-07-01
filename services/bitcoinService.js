const https = require('https');
const config = require('../config.json');

const history = [];

async function fetchData() {
  const symbols = config.symbols || ['BTCUSDT', 'ETHUSDT'];
  const timestamp = new Date().toISOString();
  
  try {
    const promises = symbols.map(symbol => {
      return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              const json = JSON.parse(data);
              resolve({ symbol, json });
            } catch (e) {
              reject(e);
            }
          });
        }).on('error', (err) => {
          reject(err);
        });
      });
    });

    const results = await Promise.all(promises);
    const entry = { timestamp };
    
    results.forEach(res => {
      const baseSymbol = res.symbol.replace('USDT', '').toLowerCase();
      entry[`${baseSymbol}Price`] = res.json.lastPrice;
      entry[`${baseSymbol}Volume`] = res.json.volume;
    });

    history.push(entry);
    
    // Keep history within limit defined in config
    const limit = config.historyLimit || 100;
    if (history.length > limit) {
      history.shift();
    }
    console.log(`[${timestamp}] Stored data for ${symbols.join(', ')}`);
  } catch (err) {
    console.error('Error fetching from Binance:', err.message);
  }
}

function start() {
  // Fetch immediately on start
  fetchData();
  // Fetch at interval defined in config (default 10 minutes)
  const interval = (config.fetchIntervalSeconds || 60) * 1000;
  setInterval(fetchData, interval);
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
