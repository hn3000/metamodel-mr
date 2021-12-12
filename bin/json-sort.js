#!/usr/bin/env node

let jp = require('../out/src/index.js');
let path = require('path');
let process = require('process');
const { stdout } = require('process');
let { argv } = process;
if (argv.length <= 2) {
  console.log(`usage: ${path.basename(argv[1])} <json-pointer>+`);
  console.log();
  console.log(`  sorts values from JSON data read from stdin`);
  console.log();
  console.log(`  <json-pointer> is an RFC 6901 string, e.g. /a/b`);
  console.log(`  Multiple <json-pointer> strings can be provided,`);
  console.log(`  all mentioned items will have their keys sorted.`);

  process.exit();
}

let stdin = process.stdin;

let chunks = [];
stdin.on('data', (chunk) => chunks.push(chunk))
     .on('end', () => {
      let json = Buffer.concat(chunks).toString('utf8');
      let obj = JSON.parse(json);
      let values = argv.slice(2).map(x => jp.JsonPointer.deref(x, obj));
      values.forEach(v => sortKeys(v));
      stdout.write(JSON.stringify(obj, null, 2));
     });

function sortKeys(x) {
  if (typeof x === 'object') {
    const keys = Object.keys(x);
    keys.sort();
    const tmp = {...x};
    keys.forEach(k => delete x[k]);
    keys.forEach(k => x[k] = tmp[k]);
    return x;
  }
  return x;
}
