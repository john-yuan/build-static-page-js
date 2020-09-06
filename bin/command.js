#!/usr/bin/env node

const pick = require('lodash/fp/pick');
const buildStaticPage = require('..');
const { argv } = require('yargs').help(false);

const options = pick([
  'init',
  'build',
  'serve',
  'preview',
  'host',
  'port',
  'root',
  'src',
  'dist',
  'config',
  'mode',
  'help',
  'version',
])(argv);

buildStaticPage(options)
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
