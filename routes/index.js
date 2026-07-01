var express = require('express');
var router = express.Router();
var bitcoinService = require('../services/bitcoinService');

/* GET home page. */
router.get('/', function(req, res, next) {
  const history = bitcoinService.getHistory();
  const config = bitcoinService.config;
  
  // Convert interval to minutes for display
  const intervalMinutes = Number(((config.fetchIntervalSeconds * 1000) || 1000) / 60000).toFixed(config.displayDecimals);
  
  res.render('index', {
    title: 'Price History',
    history: history,
	  intervalMinutes: intervalMinutes,
    displayDecimals: config.displayDecimals
  });
});

module.exports = router;
