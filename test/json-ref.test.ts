
import * as fs from 'fs';

import { 
  JsonPointer, 
  JsonReference, 
  JsonReferenceProcessor 
} from "../src/index";

import {
  normalizePath,
  jsonParse,
  removeComments
} from '../src/json-ref-processor'

import {
  TestClass
} from "tsunit.external/tsUnitAsync"


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

  testExpandDynamicLiteralObj() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var x = expander.expandDynamic (
      {
        a: { "$ref": "#/d/a" },
        b: { "$ref": "#/d/b" },
        d: {
          a: "actual-a",
          b: [ "b1", "b2" ]
        }
      },
      "json"
    );

    if (Array.isArray(x.b) && x.b[0] == 'b1' && x.b[1] == 'b2' && x.a == "actual-a") {
      this.isTrue(true); // success!
    } else {
      this.fail('failure, didn\'t get { "a": "actual-a", "b": [ ... ]  } got:'+ JSON.stringify(x));
    }
  }

  testExpandDynamicLiteralObjWithBasePointer() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var x = expander.expandDynamic (
      {
        a: { "$ref": "#/x/d/a" },
        b: { "$ref": "#/x/d/b" },
        d: {
          a: "actual-a",
          b: [ "b1", "b2" ]
        }
      },
      "json#/x"
    );

    if (Array.isArray(x.b) && x.b[0] == 'b1' && x.b[1] == 'b2' && x.a == "actual-a") {
      this.isTrue(true); // success!
    } else {
      this.fail('failure, didn\'t get { "a": "actual-a", "b": [ ... ]  } got:'+ JSON.stringify(x));
    }
  }
  testExpandRefsInLiteralObj() {
    var expander = new JsonReferenceProcessor(fetchFile);
    var p = expander.expandRefs (
      {
        a: { "$ref": "#/d/a" },
        b: { "$ref": "#/d/b" },
        d: {
          a: "actual-a",
          b: [ "b1", "b2" ]
        }
      },
      "json"
    );

    p.then((x:any) => {
      if (Array.isArray(x.b) && x.b[0] == 'b1' && x.b[1] == 'b2' && x.a == "actual-a") {
        this.isTrue(true); // success!
      } else {
        this.fail('failure, didn\'t get { "a": "actual-a", "b": [ ... ]  } got:'+ JSON.stringify(x));
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

  testJsonParseUnderstandsCommentedJson() {
    let json = '{ "x": 1 /* lala */ }';
    let obj = jsonParse(json);

    this.areIdenticalObjects(obj, { x: 1 });
  }

  testJsonParseFailsWithIncompatiblyCommentedJson() {
    let json = '{ "x": "http://a.b" /* lala */ }';
    let obj = jsonParse(json);

    this.areIdenticalObjects(obj, undefined);
  }

  areIdenticalObjects(a: any, b: any): void {
    if (a === b) {
      return;
    }

    let ta = typeof(a);

    this.areIdentical(ta, typeof(b));

    if (ta !== 'object') {
      this.areIdentical(a, b); 
    }
    let ka = Object.keys(a);
    let kb = Object.keys(b);

    this.areIdentical(ka.length, kb.length, "objects have different number of keys: "+JSON.stringify(ka)+" != "+JSON.stringify(kb));
    ka.sort();

    for (let k of ka) {
      this.areIdenticalObjects(a[k], b[k]);
    }
  }
} 

function fetchFile(x:string) {
  return Promise.resolve(x).then(x => {
    //console.log("reading ", x, process.cwd());
    return fs.readFileSync(x, 'utf-8');
  });
}
