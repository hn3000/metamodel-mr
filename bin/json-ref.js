#!/usr/bin/env node

var jp = require('../out/src/index.js');
var fs = require('fs');

function fetcher(x) {
  //console.error("reading ",x);
  if (x == "") {
    let err = new Error("empty filename");
    //console.error(err);
    throw err;
  }
  return Promise.resolve().then(()=>fs.readFileSync(x,'utf-8'));
}

var processor = new jp.JsonReferenceProcessor(fetcher);

var expanded = processor.expandRef(process.argv[2]);

expanded.then(
  (x) => {
    console.log(JSON.stringify(x, null, 2));
    console.error("wrote json ");
  }
).then(
  ()=>null, 
  (err) => console.error("error: ", err)
);
