const less = require('less');
const fse = require('fs-extra');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

/**
 * @param {string} filepath
 */
function renderLess(filepath) {
  return less.render(fse.readFileSync(filepath).toString(), {
    filename: filepath
  }).then(({ css }) => {
    return postcss([ autoprefixer({
      overrideBrowserslist: ["iOS >= 7", "Android >= 4"]
    }) ]).process(css, {
      from: filepath
    }).then(({ css }) => css);
  });
}

module.exports = renderLess;
