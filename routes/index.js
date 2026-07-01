var express = require('express');
var router = express.Router();
var bitcoinService = require('../services/bitcoinService');

/* GET home page. */
router.get('/', function(req, res, next) {
  const history = bitcoinService.getHistory();
  const config = bitcoinService.config;
  
  res.render('index', {
    title: 'Price History',
    history: history,
    intervalMinutes: config.intervalMinutes,
    displayDecimals: config.displayDecimals
  });
});

module.exports = router;
