#!/usr/bin/env node
'use strict';

if (process.cwd().indexOf('node_modules') === -1) {
  process.exit(0);
}

var fs = require('fs');

fs.symlinkSync('./lib/storages/file/index.js', './file.js');
fs.symlinkSync('./lib/storages/inMemory/index.js', './inMemory.js');
fs.symlinkSync('./lib/storages/redis/index.js', './redis.js');
