/**
 * @param {string} mode
 */
function setMode(mode) {
  process.env.BUILD_STATIC_PAGE_MODE = mode;
}

module.exports = setMode;
