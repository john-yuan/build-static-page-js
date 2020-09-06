const fse = require('fs-extra');
const path = require('path');
const propOr = require('lodash/fp/propOr');
const isRegExp = require('lodash/fp/isRegExp');
const walkDirSync = require("./shared/walkDirSync");
const buildPage = require('./builder/buildPage');
const readConfig = require('./shared/readConfig');

/**
 * @param {string} srcDir
 * @param {string} destDir
 * @param {Object.<keyof, string>} config
 */
function copySrc(srcDir, destDir, config) {
  const ignore = propOr([], 'ignore')(config).filter(filepath => {
    if (typeof filepath === 'string') {
      if (path.isAbsolute(filepath)) {
        console.error('[ERROR] ignore path cannot be absolute: ' + filepath);
        return false;
      }
      return true;
    } else {
      console.error('[ERROR] ignore path is not string: ' + filepath);
    }
  }).map(filepath => {
    return path.resolve(srcDir, filepath);
  });

  const ignoreRecursively = propOr([], 'ignoreRecursively')(config);

  fse.removeSync(destDir);

  const tempDir = fse.mkdtempSync('build-static-page');

  fse.copySync(srcDir, tempDir, {
    filter: function(filepath) {
      if (filepath === srcDir) {
        return true;
      }

      if (ignore.indexOf(filepath) > -1) {
        return false;
      }

      let disableCount = 0;
      const basename = path.basename(filepath);

      ignoreRecursively.forEach(rule => {
        if (isRegExp(rule)) {
          if (rule.test(basename)) {
            disableCount += 1;
          }
        } else if (rule === basename) {
          disableCount += 1;
        }
      });

      return disableCount > 0 ? false : true;
    }
  });

  fse.renameSync(tempDir, destDir);
  fse.removeSync(tempDir);
}

/**
 * @param {string} dirname
 */
function getHtmlEntries(dirname) {
  const entries = [];
  walkDirSync(dirname, filepath => {
    if (!/\.fragment\.html?$/i.test(filepath)) {
      if (/\.html?$/i.test(filepath)) {
        entries.push(filepath);
      }
    }
  });
  return entries;
}

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
 * @param {BuildStaticPageOptions} options
 */
function buildStatic(options) {
  const { mode, src, dist } = options;

  return new Promise((resolve, reject) => {
    const config = readConfig(options.config)(mode);
    const cache = {};

    copySrc(src, dist, config);

    const htmlEntries = getHtmlEntries(dist);

    const buildNextPage = () => {
      if (htmlEntries.length) {
        buildPage(htmlEntries.shift(), dist, cache, config)
          .then(() => buildNextPage())
          .catch(err => reject(err));
      } else {
        resolve();
      }
    };

    buildNextPage();
  });
}

module.exports = buildStatic;
