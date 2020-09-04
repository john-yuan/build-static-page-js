/**
 * @param {string} path
 */
function isRootURL(path) {
  return path.charAt(0) === '/';
}

module.exports = isRootURL;
