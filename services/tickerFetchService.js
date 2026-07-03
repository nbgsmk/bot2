const https = require('https');
const fs = require('fs');
const path = require('path');
const config = require('./configService');

const getHistoryFilePath_Json = () => path.join(__dirname, '../', config.historyData_json);
const getHistoryFilePath_Csv = () => path.join(__dirname, '../', config.historyData_csv);

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
    console.warn(`Warning: Could not load ${config.historyFileJson}, starting with empty history.`, err.message);
    history = [];
  }
}

/**
 * Saves current history to the JSON file
 */
function saveHistory_Json() {
  const filePath = getHistoryFilePath_Json();
  try {
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
  } catch (err) {
    console.error(`Error saving history file ${config.historyFileJson}:`, err.message);
  }
}

/**
 * Appends a single entry to the CSV file
 */
function saveHistory_Csv(entry) {
  const filePath = getHistoryFilePath_Csv();
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
    console.error(`Error appending to CSV file ${config.historyFileCsv}:`, err.message);
  }
}

// Initialize history on module load
// loadHistory_Json();

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
