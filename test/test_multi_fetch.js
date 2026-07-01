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
    const latest = history[0];
    console.log('Latest entry:', JSON.stringify(latest, null, 2));
    if (latest.btcPrice && latest.ethPrice && latest.btcTrades !== undefined) {
      console.log('SUCCESS: BTC, ETH prices and trade counts found.');
    } else {
      console.error('FAILURE: Missing BTC or ETH price.');
      process.exit(1);
    }
  } else {
    console.error('FAILURE: No history stored.');
    process.exit(1);
  }
  process.exit(0);
}

test();
