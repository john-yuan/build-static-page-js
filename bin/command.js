#!/usr/bin/env node

const fse = require('fs-extra');
const path = require('path');
const getAbsolutePath = require('../lib/shared/getAbsolutePath');
const startStaticServer = require('../lib/server/startStaticServer');
const buildStatic = require('../lib/builder/buildStatic');
const { argv } = require('yargs')
  .help(false)
  .default('source', './')
  .default('host', '0.0.0.0')
  .default('port', 8080);

const helpFilePath = path.resolve(__dirname, 'help.txt');
const helpContent = fse.readFileSync(helpFilePath).toString().trim();
const sourceDir = getAbsolutePath(argv.source);

if (argv.help) {
  console.log(helpContent);
} else if (argv.serve) {
  startStaticServer(sourceDir, argv.port, argv.host, argv.mode)
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else if (argv.target) {
  const targetDir = getAbsolutePath(argv.target);
  buildStatic(sourceDir, targetDir, argv.mode)
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log(helpContent);
}
