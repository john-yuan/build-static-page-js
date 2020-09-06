const path = require('path');
const propOr = require('lodash/fp/propOr');
const toString = require('lodash/fp/toString');
const getAbsolutePath = require("./getAbsolutePath");

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
 * @returns {BuildStaticPageOptions}
 */
function parseOptions(options) {
  const parsedOptions = { ...options };
  const host = toString(propOr('0.0.0.0', 'host')(options));
  const port = parseInt(propOr(8080, 'port')(options), 10);
  const root = toString(propOr('./', 'root')(options));
  const src = toString(propOr('www', 'src')(options));
  const dist = toString(propOr('dist', 'dist')(options));
  const config = toString(propOr('build.static.page.config.js', 'config')(options));

  if (isNaN(port)) {
    throw new Error('port must be a number');
  }

  parsedOptions.host = host;
  parsedOptions.port = port;
  parsedOptions.root = getAbsolutePath(root);

  parsedOptions.src = path.isAbsolute(src)
    ? path.resolve(src)
    : path.resolve(parsedOptions.root, src);

  parsedOptions.dist = path.isAbsolute(dist)
    ? path.resolve(dist)
    : path.resolve(parsedOptions.root, dist);

  parsedOptions.config = path.isAbsolute(config)
    ? path.resolve(config)
    : path.resolve(parsedOptions.root, config);

  return parsedOptions;
}

module.exports = parseOptions;
