const ejs = require('ejs');

/**
 * @param {string} filepath
 * @param {Object.<string, any>} data
 */
function renderHtml(filepath, data) {
  return ejs.renderFile(filepath, data);
}

module.exports = renderHtml;
