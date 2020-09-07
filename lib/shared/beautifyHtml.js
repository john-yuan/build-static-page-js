const htmlBeautify = require('js-beautify').html;

/**
 * @param {string} html
 * @param {Object.<string, any>} options
 */
function beautifyHtml(html, options) {
  return htmlBeautify(html, options);
}

module.exports = beautifyHtml;
