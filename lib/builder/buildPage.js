const fse = require('fs-extra');
const JSDOM = require('jsdom').JSDOM;
const processStylesheets = require('./processStylesheets');
const renderHtml = require('../shared/renderHtml');
const prettier = require('prettier');

/**
 * @param {string} filepath
 * @param {string} rootDir
 * @param {Object.<string, any>} cache
 * @param {Object.<string, any>} config
 */
function buildPage(filepath, rootDir, cache, config) {
  return new Promise((resolve, reject) => {
    const relativePath = filepath.replace(rootDir, '').substr(1);

    console.log(`[INFO] process ${relativePath}`);

    renderHtml(filepath)
      .then(html => {
        const dom = new JSDOM(html);
        processStylesheets(dom.window, filepath, rootDir, cache, config)
          .then(() => {
            fse.outputFileSync(filepath, prettier.format(dom.serialize(), {
              parser: 'html'
            }));
          });
      })
      .catch(reject);
  });
}

module.exports = buildPage;
