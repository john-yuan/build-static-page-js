/**
 * @param {string} url
 * @returns {boolean}
 */
function isAbsoluteURL(url) {
  return /^(?:[a-z][a-z0-9\-\.\+]*:)?\/\//i.test(url);
}

module.exports = isAbsoluteURL;
