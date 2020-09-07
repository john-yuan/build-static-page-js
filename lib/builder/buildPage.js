const fse = require('fs-extra');
const JSDOM = require('jsdom').JSDOM;
const propOr = require('lodash/fp/propOr');
const cloneDeep = require('lodash/fp/cloneDeep');
const processStylesheets = require('./processStylesheets');
const renderHtml = require('../shared/renderHtml');
const processJavaScripts = require('./processJavaScripts');
const beautifyHtml = require('../shared/beautifyHtml');

/**
 * @param {string} filepath
 * @param {string} rootDir
 * @param {Object.<string, any>} cache
 * @param {Object.<string, any>} config
 */
function buildPage(filepath, rootDir, cache, config) {
  return new Promise((resolve, reject) => {
    const relativePath = filepath.replace(rootDir, '').substr(1);
    const globals = propOr({}, 'globals')(config);
    const htmlBeautifyOptions = propOr({}, 'htmlBeautifyOptions')(config);

    console.log(`[INFO] process ${relativePath}`);

    renderHtml(filepath, cloneDeep(globals))
      .then(html => {
        const dom = new JSDOM(html);
        return processStylesheets(dom.window, filepath, rootDir, cache, config)
          .then(() => {
            return processJavaScripts(dom.window, filepath, rootDir, cache, config);
          })
          .then(() => {
            fse.outputFileSync(
              filepath,
              beautifyHtml(dom.serialize(), cloneDeep(htmlBeautifyOptions))
            );
          });
      })
      .then(resolve)
      .catch(reject);
  });
}

module.exports = buildPage;
