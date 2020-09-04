const os = require('os');
const fse = require('fs-extra');
const ejs = require('ejs');
const path = require('path');
const express = require('express');
const colors = require('colors');
const filesize = require('filesize');
const prettier = require('prettier');
const package = require('../../package.json');
const getAbsolutePath = require('../shared/getAbsolutePath');
const isFile = require('../shared/isFile');
const isDirectory = require('../shared/isDirectory');
const setMode = require('../shared/setMode');
const renderLess = require('../shared/renderLess');
const renderHtml = require('../shared/renderHtml');

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
 * @param {string} sourceDir
 * @param {number} port
 * @param {string} host
 * @param {string} mode
 */
function startStaticServer(sourceDir, port, host, mode) {
  setMode(mode || 'development');

  return new Promise((resolve, reject) => {
    const app = express();
    const root = getAbsolutePath(sourceDir);

    app.use((req, res, next) => {
      const filepath = resolveFilePath(root, req.path);

      if (isFile(filepath)) {
        if (/\.html?$/i.test(filepath)) {
          renderHtml(filepath)
            .then(html => res.send(
              prettier.format(html, { parser: 'html' })
            ))
            .catch(err => res.send(err));
        } else if (/\.less$/i.test(filepath)) {
          renderLess(filepath)
            .then(css => {
              res.setHeader('Content-Type', 'text/css; charset=utf-8');
              res.send(css);
            }).catch(err => {
              res.send(err);
            });
        } else {
          next();
        }
      } else if (isDirectory(filepath)) {
        if (req.path.charAt(req.path.length - 1) !== '/') {
          res.redirect(req.path + '/');
        } else {
          const files = readDirectory(filepath);
          const templatePath = path.resolve(__dirname, 'index.template.html');

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
            res.send(err);
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
        console.log(colors.green('Server started, root directory:'));
        console.log(colors.cyan('  ' + relativePath))
        console.log(colors.green('Mode(process.env.BUILD_STATIC_PAGE_MODE): '));
        console.log(colors.cyan('  ' + process.env.BUILD_STATIC_PAGE_MODE));
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

module.exports = startStaticServer;
