const buildStatic = require("./lib/builder/buildStatic");
const startStaticServer = require("./lib/server/startStaticServer");

module.exports = {
  buildStatic: buildStatic,
  startStaticServer: startStaticServer
};
