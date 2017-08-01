
import * as fs from 'fs';

import {
  JsonPointer, JsonReference, JsonReferenceProcessor
} from "../src/index";

import {
  TestClass
} from "tsunit.external/tsUnitAsync"

export class JsonPointerTest extends TestClass {
  private json: any;
  constructor() {
    super();
    let tmp = fs.readFileSync('./test/resource/json-ptr.test.json', 'utf-8');
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

    this.parameterizeUnitTest(this.testToStringIsIdenticalToInput, [
      [""],
      ["/a"],
      ["/a/b"]
    ]);
  }

  testHasJson() {
    this.areNotIdentical(null, this.json);
    this.areNotIdentical(undefined, this.json);
  }

  testEmptyPointerReturnsOriginalObject() {
    var ptr = new JsonPointer("");
    this.areIdentical(this.json, ptr.getValue(this.json));
  }
  testSimplePointerReturnsReferencedProperty() {
    var ptr = new JsonPointer("/foo");
    this.areIdentical(this.json.foo, ptr.getValue(this.json));
  }
  testArrayIndexReturnsArrayElement() {
    var ptr = new JsonPointer("/foo/0");
    this.areIdentical(this.json.foo[0], ptr.getValue(this.json));
    this.areIdentical("bar", ptr.getValue(this.json));
  }
  testArrayIndexDashReturnsArrayElementAfterLast() {
    var ptr = new JsonPointer("/-");
    var arr = [1];
    (arr as any)['-'] = 'property called minus';
    this.areIdentical(arr[1], ptr.getValue(arr));
  }
  testObjectPropDashReturnsProperty() {
    var ptr = new JsonPointer("/-");
    var obj:any = {a:1};
    obj['-'] = 'property called minus';
    this.areIdentical(obj['-'], ptr.getValue(obj));
  }
  testEmptyPropertyNameWorks() {
    var ptr = new JsonPointer("/");
    this.areIdentical(this.json[""], ptr.getValue(this.json));
    this.areIdentical(0, ptr.getValue(this.json));
  }

  testPointer(p:string, v:any) {
    var ptr = new JsonPointer(p);
    this.areIdentical(v, ptr.getValue(this.json));
  }

  testToStringIsIdenticalToInput(p:string) {
    var ptr = new JsonPointer(p);
    this.areIdentical(p, ptr.toString());
  }

  testJsonPointerWalkObject() {
    let t = { a: { b: 11, c:12, d:null as any } };
    let r: {v:any,p:JsonPointer}[] = [];
    JsonPointer.walkObject(t, (v,p) => (r.push({v,p}),false));

    this.areIdentical(4, r.length);
    this.areIdentical(t.a,    r[0].v);
    this.areIdentical('/a',   r[0].p.toString());
    this.areIdentical(11,     r[1].v);
    this.areIdentical('/a/b', r[1].p.toString());
    this.areIdentical(12,     r[2].v);
    this.areIdentical('/a/c', r[2].p.toString());
    this.areIdentical(null,   r[3].v);
    this.areIdentical('/a/d', r[3].p.toString());
  }

  testPointerSetValue() {
    var ptr = new JsonPointer('/lala');
    var obj = {};
    this.areCollectionsIdentical([], Object.keys(obj));
    ptr.setValue(obj, '#');
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
  }

  testPointerSetValueWithMissingIntermediates() {
    var path = '/a/b/c/0/foo';
    var ptr = new JsonPointer(path);
    var obj:any = {};
    this.areCollectionsIdentical([], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    ptr.setValue(obj, '#', true);
    this.areCollectionsIdentical([path], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    this.isTrue(Array.isArray(obj.a.b.c), `expected array at /a/b/c, got ${typeof obj.a.b.c}`)
  }

  testPointerSetValueAppending() {
    var path = '/a/-';
    var ptr = new JsonPointer(path);
    var obj:any = {};
    this.areCollectionsIdentical([], JsonPointer.paths(obj));
    ptr.setValue(obj, '1', true);
    ptr.setValue(obj, '2', true);
    ptr.setValue(obj, '3', true);
    this.isTrue(3 == obj.a.length, `found ${JSON.stringify(obj)}`);
    let paths = JsonPointer.paths(obj, (x) => (typeof x !== 'object'));
    this.isTrue(3 == paths.length, `found paths ${JSON.stringify(paths)} in ${JSON.stringify(obj)}`);
    this.areCollectionsIdentical(['/a/0', '/a/1', '/a/2'], paths);
    this.isTrue(Array.isArray(obj.a), `expected array at /a, got ${typeof obj.a}`)
    this.areCollectionsIdentical(['1','2','3'], obj.a);
  }

  testPointerDeleteValue() {
    var ptr = new JsonPointer('/lala');
    var obj = { 'lala': '#' };
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
    ptr.setValue(obj, null);
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
    ptr.setValue(obj, undefined);
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
    ptr.deleteValue(obj);
    this.areCollectionsIdentical([], Object.keys(obj));
  }
}

