const fse = require('fs-extra');
const path = require('path');
const propOr = require('lodash/fp/propOr');
const package = require('./package.json');
const buildStatic = require('./lib/buildStatic');
const serveStatic = require('./lib/serveStatic');
const parseOptions = require('./lib/shared/parseOptions');
const initProject = require('./lib/initProject');

/**
 * Build static page options
 *
 * @typedef {Object} BuildStaticPageOptions
 * @property {boolean} init Initialize project
 * @property {boolean} build Build static page
 * @property {boolean} serve Start development server
 * @property {boolean} preview Build and start preview server
 * @property {string} [host=0.0.0.0] Server host to use
 * @property {number} [port=8080] Server port to use
 * @property {string} [root=./] Project root directory
 * @property {string} [src=./www] Project src directory
 * @property {string} [dist=./dist] Project dist directory
 * @property {string} [config=./build.static.page.config.js] Path to configuration
 * @property {string} [mode=development|production] Set mode
 * @property {boolean} [version] Print version
 * @property {boolean} [help] Print help
 */

/**
 * Build static pages
 *
 * @param {BuildStaticPageOptions} options
 */
function buildStaticPage(options) {
  return new Promise((resolve, reject) => {
    const parsedOptions = parseOptions(options);

    if (parsedOptions.init) {
      return initProject(parsedOptions).then(resolve).catch(reject);
    } else if (parsedOptions.build) {
      parsedOptions.mode = propOr('production', 'mode')(parsedOptions);
      return buildStatic(parsedOptions).then(resolve).catch(reject);
    } else if (parsedOptions.serve) {
      parsedOptions.mode = propOr('development', 'mode')(parsedOptions);
      return serveStatic(parsedOptions).then(resolve).catch(reject);
    } else if (parsedOptions.preview) {
      parsedOptions.mode = propOr('production', 'mode')(parsedOptions);
      return buildStaticPage({
        ...parsedOptions,
        build: true
      }).then(() => {
        console.log('');
        return buildStaticPage({
          ...parsedOptions,
          serve: true
        });
      }).then(resolve).catch(reject);
    } else if (parsedOptions.version) {
      console.log(package.version);
      resolve(package.version);
    } else {
      const helpFilePath = path.resolve(__dirname, './bin/help.txt');
      const helpText = fse.readFileSync(helpFilePath).toString().trim();
      console.log(helpText);
      resolve(helpText);
    }
  });
}

module.exports = buildStaticPage;
