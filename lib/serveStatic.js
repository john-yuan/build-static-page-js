const os = require('os');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const express = require('express');
const colors = require('colors');
const filesize = require('filesize');
const package = require('../package.json');
const isFile = require('./shared/isFile');
const isDirectory = require('./shared/isDirectory');
const renderLess = require('./shared/renderLess');
const renderHtml = require('./shared/renderHtml');
const readConfig = require('./shared/readConfig');
const propOr = require('lodash/fp/propOr');
const cloneDeep = require('lodash/fp/cloneDeep');
const beautifyHtml = require('./shared/beautifyHtml');

/**
 * @param {string} root
 * @param {string} requestPath
 * @returns {string}
 */
function resolveFilePath(root, requestPath) {
  const filepath = path.resolve(root, requestPath.replace(/^\/?/, './'));

  if (isDirectory(filepath)) {
    const indexHtml = path.resolve(filepath, 'index.html');
    const indexHtm = path.resolve(filepath, 'index.htm');

    if (isFile(indexHtml)) {
      return indexHtml;
    }

    if (isFile(indexHtm)) {
      return indexHtm;
    }
  }

  return filepath;
}

/**
 * @returns {string[]}
 */
function getIpList() {
  const interfaces = new os.networkInterfaces();
  const hasOwn = Object.prototype.hasOwnProperty;
  const ipList = [];

  for (const prop in interfaces) {
    if (hasOwn.call(interfaces, prop)) {
      for (const info of interfaces[prop]) {
        if (info.family === 'IPv4') {
          ipList.push(info.address);
        }
      }
    }
  }

  if (ipList[0] !== '127.0.0.1') {
    ipList.reverse();
  }

  return ipList;
}

/**
 * @param {string} dirPath
 * @returns {Object[]}
 */
function readDirectory(dirPath) {
  const entries = fse.readdirSync(dirPath);
  const files = [];
  const dirs = [];

  entries.unshift('..');
  entries.unshift('.');

  entries.forEach(entry => {
    const filepath = path.resolve(dirPath, entry);
    try {
      const stat = fse.statSync(filepath);
      if (stat.isDirectory()) {
        dirs.push({
          type: 'directory',
          url: entry + '/',
          mtime: stat.mtime,
          size: '-',
        });
      } else if (stat.isFile()) {
        files.push({
          type: 'file',
          url: entry,
          mtime: stat.mtime,
          size: filesize(stat.size)
        });
      }
    } catch (err) {
      console.log(err);
    }
  });

  return [...dirs, ...files];
}

/**
 * Build static page options
 *
 * @typedef {Object} BuildStaticPageOptions
 * @property {boolean} init Initialize project
 * @property {boolean} build Build static page
 * @property {boolean} serve Start development server
 * @property {boolean} preview Build and start preview server
 * @property {string} [host=0.0.0.0] Server host to use
 * @property {number} [port=8080] Server port to use
 * @property {string} [root=./] Project root directory
 * @property {string} [src=./www] Project src directory
 * @property {string} [dist=./dist] Project dist directory
 * @property {string} [config=./build.static.page.config.js] Path to configuration
 * @property {string} [mode=development|production] Set mode
 * @property {boolean} [version] Print version
 * @property {boolean} [help] Print help
 */

/**
 * @param {BuildStaticPageOptions} options
 */
function serveStatic(options) {
  const { src, dist, port, host, mode, preview } = options;

  return new Promise((resolve, reject) => {
    const app = express();
    const root = preview ? dist : src;
    const config = readConfig(options.config)(mode);
    const globals = propOr({}, 'globals')(config);
    const htmlBeautifyOptions = propOr({}, 'htmlBeautifyOptions')(config);

    !preview && app.use((req, res, next) => {
      const filepath = resolveFilePath(root, req.path);

      if (isFile(filepath)) {
        if (/\.html?$/i.test(filepath)) {
          renderHtml(filepath, cloneDeep(globals))
            .then(html => res.send(
              beautifyHtml(html, cloneDeep(htmlBeautifyOptions))
            ))
            .catch(err => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.send(err.toString());
              console.error(err.toString());
            });
        } else if (/\.less$/i.test(filepath)) {
          renderLess(
            filepath,
            cloneDeep(propOr({}, 'autoprefixerOptions')(config))
          )
            .then(css => {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.send(css);
            }).catch(err => {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              res.send(`/*\n${err.toString()}*/`);
              console.error(err.toString());
            });
        } else {
          next();
        }
      } else if (isDirectory(filepath)) {
        if (req.path.charAt(req.path.length - 1) !== '/') {
          res.redirect(req.path + '/');
        } else {
          const files = readDirectory(filepath);
          const templatePath = path.resolve(__dirname, 'server/index.template.html');

          if (req.path === '/') {
            const current = files.shift();
            files.shift();
            files.unshift(current);
          }

          ejs.renderFile(templatePath, {
            dirname: req.path,
            files: files,
            version: package.version,
            homepage: package.homepage,
          }).then(html => res.send(html)).catch(err => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(err.toString());
            console.error(err.toString());
          });
        }
      } else {
        next();
      }
    });

    app.use(express.static(root));

    const relativePath = root.replace(process.cwd(), '.');
    const tryNextAvailablePort = (port) => {
      app.listen(port, host, () => {
        console.log(colors.green('Server started, src directory:'));
        console.log(colors.cyan('  ' + relativePath))
        console.log(colors.green('Mode: '));
        console.log(colors.cyan('  ' + mode));
        console.log(colors.green('Available on:'));
        if (host === '0.0.0.0') {
          console.log(colors.cyan(`  http://localhost:${port}`));
          getIpList().forEach(ip => {
            console.log(colors.cyan(`  http://${ip}:${port}`));
          });
        } else {
          console.log(colors.cyan(`  http://${host}:${port}`));
        }
        console.log(colors.yellow('Hit Ctrl-C to stop the server'));
        resolve();
      }).once('error', (err) => {
        if (err.errno === 'EADDRINUSE') {
          tryNextAvailablePort(port + 1);
        } else {
          reject(err);
        }
      });
    };

    tryNextAvailablePort(port);
  });
}

module.exports = serveStatic;
