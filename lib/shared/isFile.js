const fse = require('fs-extra');

/**
 * @param {string} filepath
 */
function isFile(filepath) {
  try {
    return fse.statSync(filepath).isFile();
  } catch (e) {}
  return false;
}

module.exports = isFile;
