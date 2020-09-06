const fse = require('fs-extra');
const isFile = require('./shared/isFile');
const path = require('path');
const isDirectory = require('./shared/isDirectory');

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
 *
 * @param {BuildStaticPageOptions} options
 */
function initProject(options) {
  return new Promise((resolve) => {
    const { src, config } = options;

    if (fse.pathExistsSync(config)) {
      if (isFile(config)) {
        console.log('Project already initialized.');
        return resolve();
      } else {
        throw new Error(`${config} is not a file`);
      }
    }

    const defaultConfigPath = path.resolve(__dirname, 'initializer/default.config.js');
    const defaultConfig = fse.readFileSync(defaultConfigPath).toString();

    fse.outputFileSync(config, defaultConfig);

    if (fse.pathExistsSync(src)) {
      if (isDirectory(src)) {
        console.log(`${src} exists.`);
        return resolve();
      } else {
        throw new Error(`${src} is not a directory`);
      }
    }

    const defaultSrcPath = path.resolve(__dirname, 'initializer/www');

    fse.mkdirpSync(src);
    fse.copySync(defaultSrcPath, src);
    console.log('Project initialized.');
  });
}

module.exports = initProject;
