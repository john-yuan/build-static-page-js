const fse = require('fs-extra');
const path = require('path');
const propOr = require('lodash/fp/propOr');
const isFile = require('./shared/isFile');
const isRegExp = require('lodash/fp/isRegExp');
const getAbsolutePath = require("./shared/getAbsolutePath");
const walkDirSync = require("./shared/walkDirSync");
const setMode = require('./shared/setMode');
const buildPage = require('./builder/buildPage');

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
 * @param {string} sourceDir
 * @param {string} targetDir
 * @param {string} mode
 */
function buildStatic(sourceDir, targetDir, mode) {
  setMode(mode || 'production');

  return new Promise((resolve, reject) => {
    const srcDir = getAbsolutePath(sourceDir);
    const destDir = getAbsolutePath(targetDir);
    const configPath = path.resolve(srcDir, '.buildStaticPage.config.js');
    const config = isFile(configPath) ? require(configPath) : {};
    const cache = {};

    copySrc(srcDir, destDir, config);

    const htmlEntries = getHtmlEntries(destDir);

    const buildNextPage = () => {
      if (htmlEntries.length) {
        buildPage(htmlEntries.shift(), destDir, cache, config)
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
