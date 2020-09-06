module.exports = function (mode) {
  return {
    // Path to ignore, relative to source directory.
    // If a path is absolute, it will be excluded.
    ignore: [],
    // Filename to ignore recursively in each directory.
    ignoreRecursively: [ '.DS_Store', 'node_modules' ],
    // The global variables in the template, add anything you need here.
    globals: {
      PUBLIC_URL: '/',
      MODE: mode,
    },
    // autoprefixer options
    // @see https://github.com/postcss/autoprefixer#options
    autoprefixerOptions: {},
    // clean-css options
    // @see https://github.com/jakubpawlowicz/clean-css#constructor-options
    cleanCssOptions: {
      format: 'beautify'
    },
    // prettier options
    // @see https://prettier.io/docs/en/options.html
    prettierOptions: {
      tabWidth: 2
    },
  };
};
