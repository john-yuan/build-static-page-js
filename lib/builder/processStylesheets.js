const toArray = require('lodash/fp/toArray');
const isAbsoluteURL = require('../shared/isAbsoluteURL');
const isRootURL = require('../shared/isRootURL');
const path = require('path');
const CleanCSS = require('clean-css');
const propOr = require('lodash/fp/propOr');
const cloneDeep = require('lodash/fp/cloneDeep');
const renderLess = require('../shared/renderLess');
const saveFileWithHash = require('../shared/saveFileWithHash');

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
      return !isAbsoluteURL(link.getAttribute('href'));
    }).map(link => {
      let href = link.getAttribute('href');
      const regSearchAndHash = /(\?|#).*$/;
      const searchOrHash = href.match(regSearchAndHash);

      href = searchOrHash ? href.replace(regSearchAndHash, '') : href;

      return {
        link: link,
        href: href,
        searchOrHash: searchOrHash ? searchOrHash[0] : '',
        filename: isRootURL(href)
          ? path.resolve(rootDir, '.' + href)
          : path.resolve(path.dirname(filepath), href)
      };
    });

    const stylesheetsCache = cache.stylesheetsCache || {};
    cache.stylesheetsCache = stylesheetsCache;

    const processNextStylesheet = () => {
      if (stylesheets.length) {
        const { link, href, filename, searchOrHash } = stylesheets.shift();
        const relativePath = filename.replace(rootDir, '').substr(1);

        const updateLinkHrefAndProcessNext = (newShortName) => {
          const hrefComponents = href.split('/');
          hrefComponents.pop();
          hrefComponents.push(newShortName);
          link.setAttribute('href', hrefComponents.join('/') + searchOrHash);
          processNextStylesheet();
        };

        if (stylesheetsCache[filename]) {
          console.log(`[INFO] reuse processed ${relativePath}`);
          updateLinkHrefAndProcessNext(stylesheetsCache[filename]);
        } else {
          console.log(`[INFO] process ${relativePath}`);
          renderLess(
            filename,
            cloneDeep(propOr({}, 'autoprefixerOptions')(config))
          )
            .then(css => {
              const output = new CleanCSS(
                propOr({}, 'cleanCssOptions')(config)
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
        }
      } else {
        resolve();
      }
    };

    processNextStylesheet();
  });
}

module.exports = processStylesheets;
