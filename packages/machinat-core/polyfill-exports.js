#!/usr/bin/env node
'use strict';

if (process.cwd().indexOf('node_modules') === -1) {
  process.exit(0);
}

var fs = require('fs');

fs.symlinkSync('./lib/engine/index.js', './engine.js');
fs.symlinkSync('./lib/queue/index.js', './queue.js');
fs.symlinkSync('./lib/renderer/index.js', './renderer.js');
fs.symlinkSync('./lib/service/index.js', './service.js');
fs.symlinkSync('./lib/base', './base');
fs.symlinkSync('./lib/iterator', './iterator');
fs.symlinkSync('./lib/utils', './utils');
