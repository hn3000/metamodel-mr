///<reference path="../typings/globals/node/index.d.ts"  />

import * as fs from 'fs';

import { 
  JsonPointer, JsonReference, JsonReferenceProcessor 
} from "../src/index";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class JsonPointerTest extends TestClass {
  private json: any;
  constructor() {
    super();
    let tmp = fs.readFileSync('./test/json-ptr.test.json', 'utf-8');
    this.json = JSON.parse(tmp);

    this.parameterizeUnitTest(this.testPointer, [
      ["/a~1b" , 1],
      ["/c%d"  , 2],
      ["/e^f"  , 3],
      ["/g|h"  , 4],
      ["/i\\j" , 5],
      ["/k\"l" , 6],
      ["/ "    , 7],
      ["/m~0n" , 8]
    ]);
  }

  testHasJson() {
    this.areNotIdentical(null, this.json);
    this.areNotIdentical(undefined, this.json);
  }

  testCase1() {
    var ptr = new JsonPointer("");
    this.areIdentical(this.json, ptr.getValue(this.json));
  }
  testCase2() {
    var ptr = new JsonPointer("/foo");
    this.areIdentical(this.json.foo, ptr.getValue(this.json));
  }
  testCase3() {
    var ptr = new JsonPointer("/foo/0");
    this.areIdentical(this.json.foo[0], ptr.getValue(this.json));
    this.areIdentical("bar", ptr.getValue(this.json));
  }
  testCase4() {
    var ptr = new JsonPointer("/");
    this.areIdentical(this.json[""], ptr.getValue(this.json));
    this.areIdentical(0, ptr.getValue(this.json));
  }

  testPointer(p:string, v:any) {
    var ptr = new JsonPointer(p);
    this.areIdentical(v, ptr.getValue(this.json));
  }
   
}

export class JsonReferenceTest extends TestClass {
  testSimpleReference() {
    var ref = new JsonReference("");

    this.areIdentical("", ref.filename);
    this.areCollectionsIdentical([], ref.pointer.keys);
  }
  testPointerReference() {
    var ref = new JsonReference("#/lala");

    this.areIdentical("", ref.filename);
    this.areCollectionsIdentical(['lala'], ref.pointer.keys);
  }
  testFileReference() {
    var ref = new JsonReference("./test/json-ptr.test.json#/foo");

    this.areIdentical("./test/json-ptr.test.json", ref.filename);
    this.areCollectionsIdentical(['foo'], ref.pointer.keys);
  }

  testResolveRefs() {
    var fetch = (x:string) => Promise.resolve(fs.readFileSync(x, 'utf-8'));
    var expander = new JsonReferenceProcessor(fetch);
    var r = expander.expandRef ("./test/json-ptr.test.json#/foo");

    return r.then ((x:any) => {
      console.log("async test result:")
      if (Array.isArray(x) && x[0] == 'bar' && x[1] == 'baz') {
        console.log("success!");
      } else {
        console.log("failure, didn't get [ 'bar', 'baz' ] got:", x);
      }
      return x;
    }, (err:any) => { 
      console.log("failure!", err);
    });
  }

  testResolveCycle() {
    var processor = new JsonReferenceProcessor();
    processor.expandRef
  }
} 