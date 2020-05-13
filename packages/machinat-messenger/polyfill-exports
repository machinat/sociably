#!/usr/bin/env node
'use strict';

if (process.cwd().indexOf('node_modules') === -1) {
  process.exit(0);
}

var fs = require('fs');

fs.mkdirSync('./auth');

fs.symlinkSync('./lib/components/index.js', './components.js');
fs.symlinkSync('./lib/asset/index.js', './asset.js');
fs.symlinkSync('../lib/auth/index.js', './auth/index.js');
fs.symlinkSync('../lib/auth/client.js', './auth/client.js');
