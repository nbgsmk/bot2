const path = require('path');

class ConfigService {
  constructor() {
    this._load();
  }

  _load() {
    let rawConfig = {};
    try {
      // Load the config file
      rawConfig = require('../config.json');
    } catch (err) {
      console.warn('Warning: Could not load config.json, using default values.');
    }

    // Sanitization and Default Values
    this.fetchIntervalSeconds = this._validateNumber(rawConfig.fetchIntervalSeconds, 10);
    this.symbols = Array.isArray(rawConfig.symbols) ? rawConfig.symbols : ['BTCUSDT', 'ETHUSDT'];
    this.windowSize = typeof rawConfig.windowSize === 'string' ? rawConfig.windowSize : '24h';
    this.historyLimit = this._validateNumber(rawConfig.historyLimit, 100);
    this.historyFile = typeof rawConfig.historyFile === 'string' ? rawConfig.historyFile : 'trade_history.json';
    this.displayDecimals = this._validateNumber(rawConfig.displayDecimals, 2);
  }

  _validateNumber(value, defaultValue) {
    const num = Number(value);
    // Ensure it's a valid number and positive
    return (!isNaN(num) && num >= 0) ? num : defaultValue;
  }

  /**
   * Helper to get interval in milliseconds
   */
  get fetchIntervalMs() {
    return this.fetchIntervalSeconds * 1000;
  }

  /**
   * Helper to get interval in minutes for display
   */
  get intervalMinutes() {
    return (this.fetchIntervalMs / 60000).toFixed(2);
  }
}

// Export a singleton instance
module.exports = new ConfigService();
