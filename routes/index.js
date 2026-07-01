var express = require('express');
var router = express.Router();
var tickerFetchService = require('../services/tickerFetchService');

/* GET home page. */
router.get('/', function(req, res, next) {
  const history = tickerFetchService.getHistory();
  const config = tickerFetchService.config;
  
  res.render('index', {
    title: 'Price History',
    history: history,
    symbols: config.symbols,
    intervalMinutes: config.intervalMinutes,
    displayDecimals: config.displayDecimals,
    windowSize: config.windowSize
  });
});

module.exports = router;
