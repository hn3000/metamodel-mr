#!/usr/bin/env node

import { JsonRefChecker } from '../out/src/index.js';
import * as fs from 'fs';

const argv = process.argv.slice(2);

for (const a of argv) {
  console.log(`checking ${a}`);
  const contents = readFile(a);
  const loops = JsonRefChecker.checkReferences(contents);
  //console.log(JSON.stringify(loops, (k,v) => v.asString(), 2));
}


function readFile(a) {
  return JSON.parse(fs.readFileSync(a, { encoding: 'utf-8'}));
}
