#!/usr/bin/env node

let jp = require('../out/src/index.js');
let path = require('path');
let process = require('process');
let { argv } = process;
if (argv.length <= 2) {
  console.log(`usage: ${path.basename(argv[1])} <json-pointer>+`);
  console.log();
  console.log(`  Extracts values from JSON data read from stdin`);
  console.log();
  console.log(`  <json-pointer> is an RFC 6901 string, e.g. /a/b`);
  console.log(`  Multiple <json-pointer> strings can be provided,`);
  console.log(`  values will be printed one per line.`);

  process.exit();
}

let stdin = process.stdin;

let chunks = [];
stdin.on('data', (chunk) => chunks.push(chunk))
     .on('end', () => {
      let json = Buffer.concat(chunks).toString('utf8');
      let obj = JSON.parse(json);
      let values = argv.slice(2).map(x => jp.JsonPointer.deref(x, obj));
      values.forEach(v => console.log(printable(v)));
     });

function printable(x) {
  if (typeof x === 'object') {
    return JSON.stringify(x, null, 2);
  }
  return x;
}
