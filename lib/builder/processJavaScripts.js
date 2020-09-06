const toArray = require('lodash/fp/toArray');
const isAbsoluteURL = require('../shared/isAbsoluteURL');
const isRootURL = require('../shared/isRootURL');
const path = require('path');
const fse = require('fs-extra');
const colors = require('colors');
const UglifyJS = require('uglify-js');
const propOr = require('lodash/fp/propOr');
const isNil = require('lodash/fp/isNil');
const cloneDeep = require('lodash/fp/cloneDeep');
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
function processJavaScripts(window, filepath, rootDir, cache, config) {
  return new Promise((resolve) => {
    const { document } = window;
    const scripts = toArray(document.getElementsByTagName('script')).filter((script) => {
      const type = script.getAttribute('type');
      const supportedTypes = [
        'application/javascript',
        'application/ecmascript',
        'application/x-ecmascript',
        'application/x-javascript',
        'text/javascript',
        'text/ecmascript',
        'text/javascript1.0',
        'text/javascript1.1',
        'text/javascript1.2',
        'text/javascript1.3',
        'text/javascript1.4',
        'text/javascript1.5',
        'text/jscript',
        'text/livescript',
        'text/x-ecmascript',
        'text/x-javascript'
      ];

      if (typeof type === 'string') {
        return supportedTypes.indexOf(type.toLowerCase().trim()) > -1;
      }

      return isNil(type);
    });

    const javaScriptsCache = cache.javaScriptsCache || {};
    cache.javaScriptsCache = javaScriptsCache;

    let scriptNo = 0;

    const processNextJavaScript = () => {
      if (scripts.length) {
        scriptNo += 1;
        const script = scripts.shift();
        const src = script.getAttribute('src');
        const uglifyJsOptions = cloneDeep(propOr({}, 'uglifyJsOptions')(config));

        if (isNil(src)) {
          console.log(`[INFO] process inline script`);
          const code = script.innerHTML;
          const result = UglifyJS.minify(code, uglifyJsOptions);
          if (result.error) {
            console.error(`[ERROR] failed to minify inline`
              + ` script in file ${filepath}`
              + `\n\n${code.trim()}\n`);

            throw result.error;
          }
          script.innerHTML = result.code;
          processNextJavaScript();
        } else if (!isAbsoluteURL(src)) {
          const regSearchAndHash = /(\?|#).*$/;
          const searchAndHash = src.match(regSearchAndHash);
          const cleanSrc = searchAndHash ? src.replace(regSearchAndHash, '') : src;
          const filename = isRootURL(cleanSrc)
            ? path.resolve(rootDir, '.' + cleanSrc)
            : path.resolve(path.dirname(filepath), cleanSrc);

          const relativePath = filename.replace(rootDir, '').substr(1);

          const updateScriptSrcAndProcessNext = (newShortName) => {
            const srcComponents = cleanSrc.split('/');
            const oldSearchAndHash = searchAndHash ? searchAndHash[0] : '';
            srcComponents.pop();
            srcComponents.push(newShortName);
            script.setAttribute('src', srcComponents.join('/') + oldSearchAndHash);
            processNextJavaScript();
          };

          if (javaScriptsCache[filename]) {
            console.log(`[INFO] reuse processed ${relativePath}`);
            updateScriptSrcAndProcessNext(javaScriptsCache[filename]);
          } else if (isFile(filename)) {
            console.log(`[INFO] process ${relativePath}`);
            const code = fse.readFileSync(filename).toString();
            const result = UglifyJS.minify(code, uglifyJsOptions);

            if (result.error) {
              console.error(`[ERROR] failed to minify ${relativePath}`);
              result.error.filename = relativePath;
              throw result.error;
            }

            const newFilepath = saveFileWithHash(filename, result.code, 'js');
            const newShortName = path.basename(newFilepath);
            javaScriptsCache[filename] = newShortName;
            updateScriptSrcAndProcessNext(newShortName);
          } else {
            console.log(colors.yellow(`[WARNING] ${relativePath} is not a file`));
            processNextJavaScript();
          }
        } else {
          processNextJavaScript();
        }
      } else {
        resolve();
      }
    };

    processNextJavaScript();
  });
}

module.exports = processJavaScripts;
