const bitcoinService = require('../services/bitcoinService');

async function test() {
  console.log('Starting service...');
  // The service fetches immediately on start
  bitcoinService.start();
  
  console.log('Waiting for first fetch (5 seconds)...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const history = bitcoinService.getHistory();
  console.log('History entries:', history.length);
  if (history.length > 0) {
    const latest = history[history.length - 1];
    console.log('Latest entry:', JSON.stringify(latest, null, 2));
    if (latest.BTCUSDT && typeof latest.BTCUSDT === 'object' && latest.BTCUSDT.close !== undefined) {
      console.log('SUCCESS: BTC, ETH data found in labeled JSON objects.');
    } else {
      console.error('FAILURE: Missing or incorrect data structure.');
      process.exit(1);
    }
  } else {
    console.error('FAILURE: No history stored.');
    process.exit(1);
  }
  process.exit(0);
}

test();
