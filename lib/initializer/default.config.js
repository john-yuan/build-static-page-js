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
    // js-beautify HTMLBeautifyOptions
    // @see https://www.npmjs.com/package/js-beautify#css--html
    htmlBeautifyOptions: {
      indent_size: 2,
      wrap_line_length: 0,
      indent_with_tabs: false,
      end_with_newline: false,
      preserve_newlines: false,
      indent_inner_html: false
    },
  };
};
