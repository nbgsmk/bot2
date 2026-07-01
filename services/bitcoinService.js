const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./configService');

const getHistoryFilePath = () => path.join(__dirname, '../', config.historyFile);

let history = [];

/**
 * Loads history from the JSON file if it exists
 */
function loadHistory() {
  const filePath = getHistoryFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      history = JSON.parse(data);
      console.log(`[INIT] Loaded ${history.length} entries from ${filePath}`);
    }
  } catch (err) {
    console.warn(`Warning: Could not load ${config.historyFile}, starting with empty history.`, err.message);
    history = [];
  }
}

/**
 * Saves current history to the JSON file
 */
function saveHistory() {
  const filePath = getHistoryFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error(`Error saving history file ${config.historyFile}:`, err.message);
  }
}

// Initialize history on module load
loadHistory();

async function fetchData() {
  const symbols = config.symbols;
  const timestamp = new Date().toISOString();
  
  try {
    const promises = symbols.map(symbol => {
      return new Promise((resolve, reject) => {
        https.get(`https://api.binance.com/api/v3/ticker?symbol=${symbol}&windowSize=${config.windowSize}`, (res) => {
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
      // Store each symbol's data as a separate JSON object with descriptive keys
      entry[res.symbol] = {
        open: res.json.openPrice,
        high: res.json.highPrice,
        low: res.json.lowPrice,
        close: res.json.lastPrice,
        priceChange: res.json.priceChange,
        tradeVolume: res.json.volume,
        tradeCount: res.json.count
      };
    });

    history.push(entry);
    
    // Keep history within limit defined in config
    const limit = config.historyLimit;
    if (history.length > limit) {
      history.shift();
    }
    
    saveHistory();
    console.log(`[${timestamp}] Stored data for ${symbols.join(', ')}`);
    return results; // Return the raw results for debugging/testing
  } catch (err) {
    console.error('Error fetching from Binance:', err.message);
  }
}

function start() {
  // Fetch immediately on start
  fetchData();
  // Fetch at interval defined in config
  setInterval(fetchData, config.fetchIntervalMs);
}

function getHistory() {
  // Return a copy to avoid external modification
  return [...history];
}

module.exports = {
  start,
  fetchData,
  getHistory,
  config
};
