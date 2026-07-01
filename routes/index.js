var express = require('express');
var router = express.Router();
var bitcoinService = require('../services/bitcoinService');

/* GET home page. */
router.get('/', function(req, res, next) {
  const history = bitcoinService.getHistory();
  const symbol = bitcoinService.config.symbol || 'BTCUSDT';
  // const intervalSeconds = Math.round((bitcoinService.config.fetchIntervalSeconds || 1000) / 1000);
  const intervalSeconds = Number( ( (bitcoinService.config.fetchIntervalSeconds * 1000) || 1000) / 60000 ).toFixed(2);
  res.render('index', {
    title: `${symbol} Price History`,
    history: history,
    intervalMinutes: intervalSeconds,
    symbol: symbol
  });
});

module.exports = router;
