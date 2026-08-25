'use strict';

const fs = require('node:fs');
const path = require('node:path');

const source = path.join(__dirname, '..', 'src', 'treasury.js');
const outDir = path.join(__dirname, '..', 'dist');
const target = path.join(outDir, 'treasury.js');

fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(source, target);
if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
  throw new Error('build output was not created');
}
console.log(`built ${path.relative(process.cwd(), target)}`);
