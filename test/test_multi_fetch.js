const bitcoinService = require('../services/bitcoinService');

async function test() {
  console.log('Starting fetch to get raw response...');
  // Call fetchData directly to get the results and log them
  const results = await bitcoinService.fetchData();
  
  if (results) {
    console.log('--- ORIGINAL BINANCE RESPONSES ---');
    results.forEach(res => {
      console.log(`Symbol: ${res.symbol}`);
      console.log(JSON.stringify(res.json, null, 2));
    });
    console.log('----------------------------------');
  } else {
    console.error('FAILURE: Fetch failed, no results returned.');
    process.exit(1);
  }

  // Now check the history
  const history = bitcoinService.getHistory();
  console.log('History entries:', history.length);
  if (history.length > 0) {
    const latest = history[history.length - 1];
    console.log('Latest entry in history:', JSON.stringify(latest, null, 2));
    
    const symbols = bitcoinService.config.symbols;
    let allOk = true;

    symbols.forEach(symbol => {
      const data = latest[symbol];
      if (data && typeof data === 'object' && 
          data.open !== undefined && 
          data.high !== undefined && 
          data.low !== undefined && 
          data.close !== undefined && 
          data.tradeVolume !== undefined && 
          data.tradeCount !== undefined) {
        console.log(`SUCCESS: ${symbol} data found with correct keys.`);
      } else {
        console.error(`FAILURE: ${symbol} data is missing or has incorrect structure.`);
        allOk = false;
      }
    });

    if (!allOk) process.exit(1);
  } else {
    console.error('FAILURE: No history stored.');
    process.exit(1);
  }
  process.exit(0);
}

test();
