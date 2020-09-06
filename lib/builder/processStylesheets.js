const toArray = require('lodash/fp/toArray');
const isAbsoluteURL = require('../shared/isAbsoluteURL');
const isRootURL = require('../shared/isRootURL');
const fse = require('fs-extra');
const path = require('path');
const CleanCSS = require('clean-css');
const propOr = require('lodash/fp/propOr');
const cloneDeep = require('lodash/fp/cloneDeep');
const renderLess = require('../shared/renderLess');
const md5 = require('../shared/md5');
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
      return !isAbsoluteURL(link.getAttribute('href'));
    }).map(link => {
      const href = link.getAttribute('href');
      return {
        link: link,
        href: href,
        filename: isRootURL(href)
          ? path.resolve(rootDir, '.' + href)
          : path.resolve(path.dirname(filepath), href)
      };
    });

    const stylesheetsCache = cache.stylesheetsCache || {};
    cache.stylesheetsCache = stylesheetsCache;

    const processNextStylesheet = () => {
      if (stylesheets.length) {
        const { link, href, filename } = stylesheets.shift();

        const updateLinkHrefAndProcessNext = (newShortName) => {
          const hrefComponents = href.split('/');

          hrefComponents.pop();
          hrefComponents.push(newShortName);
          link.setAttribute('href', hrefComponents.join('/'));
          processNextStylesheet();
        };

        const relativePath = filename.replace(rootDir, '').substr(1);

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
              const hash = md5(css).substr(0, 7);
              const dirname = path.dirname(filename);
              const shortName = path.basename(filename);

              let finalHash = hash;
              let counter = 0;
              let newShortName;
              let newFilename;

              while (true) {
                newShortName = shortName.replace(/\.(less|css)$/i, `.${finalHash}.css`);
                newFilename = path.resolve(dirname, newShortName);

                if (isFile(newFilename)) {
                  if (fse.readFileSync(newFilename).toString() === css) {
                    break;
                  } else {
                    counter += 1;
                    finalHash = `${hash}.${counter}`;
                  }
                } else {
                  fse.outputFileSync(newFilename, css);
                  break;
                }
              }

              stylesheetsCache[filename] = newShortName;
              updateLinkHrefAndProcessNext(stylesheetsCache[filename]);
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
