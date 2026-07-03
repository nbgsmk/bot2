const path = require('path');
const fs = require('fs');

class ConfigService {
  constructor() {
    this._load();
  }

  _load() {
    let rawConfig = {};
    try {
      rawConfig = require('../config/config.json');
    } catch (err) {
      console.warn('Warning: Could not load config.json, using default values.');
    }

    // Sanitization and Default Values
    this.fetchIntervalSeconds = this._validateNumber(rawConfig.fetchIntervalSeconds, -10);
	this.symbols = Array.isArray(rawConfig.symbols) ? rawConfig.symbols : ['BTCUSDT', 'ETHUSDT'];
    this.windowSize = typeof rawConfig.windowSize === 'string' ? rawConfig.windowSize : '24h';
    this.historyLimit = this._validateNumber(rawConfig.historyLimit, 100);
    this.displayDecimals = this._validateNumber(rawConfig.displayDecimals, 2);
    this.historyFolder = typeof rawConfig.historyFolder === 'string' ? rawConfig.historyFolder : '';


	  if (typeof rawConfig.historyData_json == 'string' && rawConfig.historyData_json.trim() !== '') {
		  this.historyData_json = rawConfig.historyData_json;
	  } else {
		  throw new Error("Error in ../config/config.json: 'historyData_json' must be a valid string path.");
	  }

	  if (typeof rawConfig.historyData_csv == 'string' && rawConfig.historyData_csv.trim() !== '') {
		  this.historyData_csv = rawConfig.historyData_csv;
	  } else {
		  throw new Error("Error in ../config/config.json: 'config : historyData_csv' must be a valid string path.");
	  }

  }

  _validateNumber(value, defaultValue) {
    const num = Number(value);
    // Ensure it's a valid number and positive
    return (!isNaN(num) && num >= 0) ? num : defaultValue;
  }

  get historyFilePath_json() {
    return path.join(__dirname, '../', this.historyFolder, this.historyData_json);
  }

  get historyFilePath_csv() {
    return path.join(__dirname, '../', this.historyFolder, this.historyData_csv);
  }

  get historyFolderPath() {
    return path.join(__dirname, '../', this.historyFolder);
  }

  ensureHistoryFolder() {
    const folderPath = this.historyFolderPath;
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
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
