const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./configService');

const getHistoryFilePath_Json = () => config.historyFilePath_json;
const getHistoryFilePath_Csv = () => config.historyFilePath_csv;

let history = [];

/**
 * Loads history from the JSON file if it exists
 */
function loadHistory_Json() {
  const filePath = getHistoryFilePath_Json();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      history = JSON.parse(data);
      console.log(`[INIT] Loaded ${history.length} entries from ${filePath}`);
    }
  } catch (err) {
    console.warn(`Warning: Could not load ${filePath}, starting with empty history.`, err.message);
    history = [];
  }
}

/**
 * Saves current history to the JSON file
 */
function saveHistory_Json() {
  const filePath = getHistoryFilePath_Json();
  try {
    config.ensureHistoryFolder();
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error(`Error saving history file ${filePath}:`, err.message);
  }
}

/**
 * Loads history from the CSV file if it exists
 */
function loadHistory_Csv() {
  const filePath = getHistoryFilePath_Csv();
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      const lines = data.trim().split('\n');
      if (lines.length < 2) return;

      const symbols = config.symbols;
      const newHistory = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length < 2) continue;

        const entry = { timestamp: values[0] };
        symbols.forEach((s, symbolIdx) => {
          const startIdx = 1 + symbolIdx * 6;
          if (values.length >= startIdx + 6) {
            entry[s] = {
              open: values[startIdx],
              high: values[startIdx + 1],
              low: values[startIdx + 2],
              close: values[startIdx + 3],
              tradeVolume: values[startIdx + 4],
              tradeCount: values[startIdx + 5]
            };
          }
        });
        newHistory.push(entry);
      }
      history = newHistory;
      console.log(`[INIT] Loaded ${history.length} entries from CSV ${filePath}`);
    }
  } catch (err) {
    console.warn(`Warning: Could not load CSV ${filePath}:`, err.message);
  }
}

/**
 * Appends a single entry to the CSV file
 */
function saveHistory_Csv(entry) {
  const filePath = getHistoryFilePath_Csv();
  config.ensureHistoryFolder();
  const symbols = config.symbols;
  const isNewFile = !fs.existsSync(filePath);

  try {
    let csvLine = '';
    if (isNewFile) {
      // Create Header: timestamp, symbol1_open, symbol1_high, etc.
      let header = 'timestamp';
      symbols.forEach(s => {
        const base = s.replace('USDT', '');
        header += `,${base}_open,${base}_high,${base}_low,${base}_close,${base}_volume,${base}_trades`;
      });
      csvLine += header + '\n';
    }

    let row = entry.timestamp;
    symbols.forEach(s => {
      const data = entry[s];
      if (data) {
        row += `,${data.open},${data.high},${data.low},${data.close},${data.tradeVolume},${data.tradeCount}`;
      } else {
        row += ',,,,,,'; // 6 commas for the 6 fields
      }
    });
    csvLine += row + '\n';

    fs.appendFileSync(filePath, csvLine);
  } catch (err) {
    console.error(`Error appending to CSV file ${filePath}:`, err.message);
  }
}

// Initialize history on module load
console.log(`[INIT] History storage folder: ${config.historyFolderPath}`);
console.log(`[INIT] History CSV file: ${config.historyFilePath_csv}`);
// loadHistory_Json();
loadHistory_Csv();

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
    
    // saveHistory_Json();
    saveHistory_Csv(entry);
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
