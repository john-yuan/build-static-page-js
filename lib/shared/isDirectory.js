const fse = require('fs-extra');

/**
 * @param {string} filepath
 */
function isDirectory(filepath) {
  try {
    return fse.statSync(filepath).isDirectory();
  } catch (e) {}
  return false;
}

module.exports = isDirectory;
