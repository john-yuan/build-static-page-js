const ejs = require('ejs');

/**
 * @param {string} filepath
 */
function renderHtml(filepath) {
  return ejs.renderFile(filepath);
}

module.exports = renderHtml;
