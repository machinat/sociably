#!/usr/bin/env node
'use strict';

if (process.cwd().indexOf('node_modules') === -1) {
  process.exit(0);
}

var fs = require('fs');

fs.symlinkSync('./lib/webhook/index.js', './webhook.js');
