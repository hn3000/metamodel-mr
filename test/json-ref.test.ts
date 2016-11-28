
import * as fs from 'fs';

import { 
  JsonPointer, JsonReference, JsonReferenceProcessor 
} from "../src/index";

import {
  normalizePath
} from '../src/json-ref-processor'

import {
  TestClass
} from "@hn3000/tsunit-async";


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
    var ref = new JsonReference("./test/resource/json-ptr.test.json#/foo");

    this.areIdentical("./test/resource/json-ptr.test.json", ref.filename);
    this.areCollectionsIdentical(['foo'], ref.pointer.keys);
  }

  testResolveRefs() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var r = expander.expandRef ("./test/resource/json-ptr.test.json#/foo");

    return r.then ((x:any) => {
      if (Array.isArray(x) && x[0] == 'bar' && x[1] == 'baz') {
        this.isTrue(true); // success!
      } else {
        this.fail("failure, didn't get [ 'bar', 'baz' ] got:"+ JSON.stringify(x));
      }
      return x;
    });
  }

  testResolveIndirectRefs() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var r = expander.expandRef ("./test/resource/json-ptr.refs.json#/c");

    return r.then ((x:any) => {
      this.areIdentical(1, x);
    });
  }

  testResolveInvalidRefs() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var r = expander.expandRef ("./test/resource/json-ptr.refs.json#/e");

    return r.then ((x:any) => {
      this.isTruthy(x.$$ref);
      this.isFalse(x.$$filenotfound);
      this.isTrue(x.$$refnotfound);
    });
  }

  testResolveNofileRefs() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var r = expander.expandRef ("./test/resource/json-ptr.refs.json#/f");

    return r.then ((x:any) => {
      this.isTruthy(x.$$ref);
      this.isTrue(x.$$filenotfound);
      this.isTrue(x.$$refnotfound);
    });
  }


  testResolveIndirectIntermediateRefs() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var r = expander.expandRef ("./test/resource/json-ptr.refs.json#/i");

    return r.then ((x:any) => {
      if (Array.isArray(x) && x[0] == 'bar' && x[1] == 'baz') {
        this.isTrue(true); // success!
      } else {
        this.fail("failure, didn't get [ 'bar', 'baz' ] got:"+ JSON.stringify(x));
      }
    });
  }

  testResolveCycle() {
    var processor = new JsonReferenceProcessor();
  }

  testNormalizePathUnchangedForDotlessPath() {
    let path = './foo/bar/blub.bb';
    let normalized = normalizePath(path);
    this.areIdentical(path, normalized);
  }
  testNormalizePathHasSingleDotsRemovedPath() {
    let path = './foo/./bar/././blub.bb';
    let expected = './foo/bar/blub.bb';
    let normalized = normalizePath(path);
    this.areIdentical(expected, normalized);
  }
  testNormalizePathHasDoubleDotSegmentsRemovedPath() {
    let path = './foo/../bar/../../blub.bb';
    let expected = './../blub.bb';
    let normalized = normalizePath(path);
    this.areIdentical(expected, normalized);
  }
  testNormalizePathHasSingleAndDoubleDotSegmentsRemovedPath() {
    let path = './foo/./../bar/.././../blub.bb';
    let expected = './../blub.bb';
    let normalized = normalizePath(path);
    this.areIdentical(expected, normalized);
  }
} 

function fetchFile(x:string) {
  return Promise.resolve(x).then(x => {
    //console.log("reading ", x, process.cwd());
    return fs.readFileSync(x, 'utf-8');
  });
}
