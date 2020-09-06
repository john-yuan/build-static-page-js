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
  };
};
