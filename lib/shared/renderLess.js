const less = require('less');
const fse = require('fs-extra');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

/**
 * @param {string} filepath
 * @param {Object.<string, any>} autoprefixerOptions
 */
function renderLess(filepath, autoprefixerOptions) {
  return less.render(fse.readFileSync(filepath).toString(), {
    filename: filepath
  }).then(({ css }) => {
    return postcss([
      autoprefixer(autoprefixerOptions)
    ]).process(css, {
      from: filepath
    }).then(({ css }) => css);
  });
}

module.exports = renderLess;
