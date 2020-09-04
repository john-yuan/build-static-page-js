const fs = require('fs');
const path = require('path');

/**
 * @param {string} dirname
 * @param {(filepath: string) => void} callback
 */
function walkDirSync(dirname, callback) {
  const absoluteDirname = path.isAbsolute(dirname)
    ? path.resolve(dirname)
    : path.resolve(process.cwd(), dirname);
  const entries = fs.readdirSync(absoluteDirname);

  entries.forEach(filename => {
    const filepath = path.resolve(dirname, filename);
    const stat = fs.statSync(filepath);

    if (stat.isDirectory()) {
      walkDirSync(filepath, callback);
    } else if (stat.isFile()) {
      callback(filepath);
    }
  });
}

module.exports = walkDirSync;
