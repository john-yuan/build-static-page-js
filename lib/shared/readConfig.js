const isFile = require('./isFile');

/**
 * @param {string} configPath
 * @returns {(mode: string) => Object<string, any>}
 */
function readConfig(configPath) {
  const configFunction = isFile(configPath)
    ? require(configPath)
    : require('../initializer/default.config');

  if (typeof configFunction !== 'function') {
    throw new Error('config should be a function');
  }

  return configFunction;
}

module.exports = readConfig;
