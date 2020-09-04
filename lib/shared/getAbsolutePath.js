const path = require('path');

/**
 * @param {string} pathname
 * @returns {string}
 */
function getAbsolutePath(pathname) {
  return path.isAbsolute(pathname)
    ? path.resolve(pathname)
    : path.resolve(process.cwd(), pathname);
}

module.exports = getAbsolutePath;
