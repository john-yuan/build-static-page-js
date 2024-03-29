const fse = require('fs-extra');
const path = require('path');
const md5 = require('../shared/md5');
const isFile = require('../shared/isFile');

/**
 * @param {string} filepath
 * @param {string|Buffer} content
 * @param {string} buildSuffix
 * @param {string} [newSuffix]
 */
function saveFileWithHash(filepath, content, buildSuffix, newSuffix) {
  const hash = buildSuffix || md5(content).substr(0, 7);
  const dirname = path.dirname(filepath);
  const basename = path.basename(filepath).split('.');

  let nextHash = hash;
  let nameWithoutSuffix = '';
  let suffix = '';

  if (basename.length > 1) {
    suffix = basename.pop();
    suffix = `.${newSuffix || suffix}`;
    nameWithoutSuffix = basename.join('.');
  } else {
    nameWithoutSuffix = basename.join('.');
  }

  let newFilename = '';
  let newFilepath = '';
  let counter = 0;

  while (true) {
    newFilename = `${nameWithoutSuffix}.${nextHash}${suffix}`;
    newFilepath = path.resolve(dirname, newFilename);

    if (fse.pathExistsSync(newFilepath)) {
      if (isFile(newFilepath)) {
        const buffer = fse.readFileSync(newFilepath);
        if (typeof content === 'string') {
          if (buffer.toString() === content) {
            break;
          }
        } else if (Buffer.isBuffer(content)) {
          if (Buffer.compare(buffer, content) === 0) {
            break;
          }
        } else {
          throw new Error(`failed to save ${filepath} with hash,`
            + ' content type not supported');
        }
      }
    } else {
      fse.outputFileSync(newFilepath, content);
      break;
    }

    counter += 1;
    nextHash = `${hash}.${counter}`;
  }

  return newFilepath;
}

module.exports = saveFileWithHash;
