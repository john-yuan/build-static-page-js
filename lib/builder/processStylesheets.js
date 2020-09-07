const toArray = require('lodash/fp/toArray');
const isAbsoluteURL = require('../shared/isAbsoluteURL');
const isRootURL = require('../shared/isRootURL');
const path = require('path');
const CleanCSS = require('clean-css');
const colors = require('colors');
const propOr = require('lodash/fp/propOr');
const cloneDeep = require('lodash/fp/cloneDeep');
const toString = require('lodash/fp/toString');
const renderLess = require('../shared/renderLess');
const saveFileWithHash = require('../shared/saveFileWithHash');
const isFile = require('../shared/isFile');

/**
 * @param {Window} window
 * @param {string} filepath
 * @param {string} rootDir
 * @param {Object.<string, any>} cache
 * @param {Object.<string, any>} config
 */
function processStylesheets(window, filepath, rootDir, cache, config) {
  return new Promise((resolve, reject) => {
    const { document } = window;
    const links = document.getElementsByTagName('link');
    const stylesheets = toArray(links).filter(link => {
      const rel = toString(link.getAttribute('rel')).toLowerCase();
      return rel === 'stylesheet' && !isAbsoluteURL(link.getAttribute('href'));
    }).map(link => {
      let href = link.getAttribute('href');
      const regSearchAndHash = /(\?|#).*$/;
      const searchAndHash = href.match(regSearchAndHash);

      href = searchAndHash ? href.replace(regSearchAndHash, '') : href;

      return {
        link: link,
        href: href,
        searchAndHash: searchAndHash ? searchAndHash[0] : '',
        filename: isRootURL(href)
          ? path.resolve(rootDir, '.' + href)
          : path.resolve(path.dirname(filepath), href)
      };
    });

    const stylesheetsCache = cache.stylesheetsCache || {};
    cache.stylesheetsCache = stylesheetsCache;

    const processNextStylesheet = () => {
      if (stylesheets.length) {
        const { link, href, filename, searchAndHash } = stylesheets.shift();
        const relativePath = filename.replace(rootDir, '').substr(1);

        const updateLinkHrefAndProcessNext = (newShortName) => {
          const hrefComponents = href.split('/');
          hrefComponents.pop();
          hrefComponents.push(newShortName);
          link.setAttribute('href', hrefComponents.join('/') + searchAndHash);
          processNextStylesheet();
        };

        if (stylesheetsCache[filename]) {
          console.log(`[INFO] reuse processed ${relativePath}`);
          updateLinkHrefAndProcessNext(stylesheetsCache[filename]);
        } else if (isFile(filename)) {
          console.log(`[INFO] process ${relativePath}`);
          renderLess(
            filename,
            cloneDeep(propOr({}, 'autoprefixerOptions')(config))
          )
            .then(css => {
              const output = new CleanCSS(
                cloneDeep(propOr({}, 'cleanCssOptions')(config))
              ).minify(css);

              if (output.errors && output.errors.length) {
                console.error(`[ERROR] failed to minify ${relativePath}`);
                throw output.errors;
              } else {
                return output.styles;
              }
            })
            .then(css => {
              const newFilepath = saveFileWithHash(filename, css, 'css');
              const newShortName = path.basename(newFilepath);
              stylesheetsCache[filename] = newShortName;
              updateLinkHrefAndProcessNext(newShortName);
            })
            .catch(reject);
        } else {
          console.log(colors.yellow(`[WARNING] ${relativePath} is not a file`));
          processNextStylesheet();
        }
      } else {
        resolve();
      }
    };

    processNextStylesheet();
  });
}

module.exports = processStylesheets;
