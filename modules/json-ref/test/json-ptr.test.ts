
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
    let tmp = fs.readFileSync('./test/resource/json-ptr.test.json', 'utf-8');
    this.json = JSON.parse(tmp);

    const pointerTestCases = [
      ["/a~1b" , 1],
      ["/c%d"  , 2],
      ["/e^f"  , 3],
      ["/g|h"  , 4],
      ["/i\\j" , 5],
      ["/k\"l" , 6],
      ["/ "    , 7],
      ["/m~0n" , 8],
      ["" , this.json],
      ["/x/y" , undefined]
    ];
    this.parameterizeUnitTest(this.testPointer, pointerTestCases);
    this.parameterizeUnitTest(this.testPointerGet, pointerTestCases);
    this.parameterizeUnitTest(this.testDeref, pointerTestCases);

    this.parameterizeUnitTest(this.testToStringIsIdenticalToInput, [
      [""],
      ["/a"],
      ["/a/b"]
    ]);

    this.parameterizeUnitTest(this.testHasParent, [
      ["", false],
      ["/a", true],
      ["/a/b", true]
    ]);

    this.parameterizeUnitTest(this.testParent, [
      ["", null],
      ["/a", ""],
      ["/a/b", "/a"]
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

  testPointerGet(p:string, v:any) {
    var ptr = JsonPointer.get(p);
    this.areIdentical(v, ptr.getValue(this.json));
  }

  testDeref(p:string, v:any) {
    var val = JsonPointer.deref(p, this.json);
    this.areIdentical(v, val);
  }

  testHasParent(p: string, shouldHaveParent: boolean) {
    const ptr = JsonPointer.get(p);
    var hasParent = ptr.hasParent();
    this.areIdentical(shouldHaveParent, hasParent);
  }

  testParent(p: string, expectedParent: string) {
    const ptr = JsonPointer.get(p);
    if (null == expectedParent) {
      this.areIdentical(null, ptr.parent);
    } else {
      this.isTrue(null != ptr.parent);
      this.areIdentical(expectedParent, ptr.parent.toString());
    }
  }

  testPointerGetFromJsonPointer() {
    var ptrA = new JsonPointer('/a/b');
    var ptrB = JsonPointer.get(ptrA);
    this.areIdentical(ptrA, ptrB);
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

  testJsonPointerPaths() {
    let t = { a: { b: 11, c:12, d:null as any } };

    const r = JsonPointer.paths(t);

    this.areIdentical(4, r.length);
    this.areIdentical('/a',   r[0]);
    this.areIdentical('/a/b', r[1]);
    this.areIdentical('/a/c', r[2]);
    this.areIdentical('/a/d', r[3]);
  }

  testJsonPointerPointers() {
    let t = { a: { b: 11, c:12, d:null as any } };

    const r = JsonPointer.pointers(t);

    this.areIdentical(4, r.length);
    this.areIdentical('/a',   r[0].toString());
    this.areIdentical('/a/b', r[1].toString());
    this.areIdentical('/a/c', r[2].toString());
    this.areIdentical('/a/d', r[3].toString());
  }

  testJsonPointerPointersWithPredicate() {
    let t = { a: { b: 11, c:12, d:null as any } };

    const r = JsonPointer.pointers(t, (v,p) => (p.keys.length > 1));

    this.areIdentical(3, r.length);
    this.areIdentical('/a/b', r[0].toString());
    this.areIdentical('/a/c', r[1].toString());
    this.areIdentical('/a/d', r[2].toString());
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

  testPointerSetValueWithMissingIntermediatesButNoCreatePath() {
    var path = '/a/b/c/0/foo';
    var ptr = new JsonPointer(path);
    var obj:any = {};
    this.areCollectionsIdentical([], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    ptr.setValue(obj, '#', false);
    this.areCollectionsIdentical([], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    this.isTrue(null == obj.a);
  }

  testPointerSetValueWithMissingRoot() {
    const path = '/a/b/c/0/foo';
    const ptr = new JsonPointer(path);
    const obj:any = {};
    this.areCollectionsIdentical([], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    const newObj = ptr.setValue(null, '#', true);
    this.areCollectionsIdentical([path], JsonPointer.paths(newObj, (x) => (typeof x !== 'object')));
    this.isTrue(Array.isArray(newObj.a.b.c), `expected array at /a/b/c, got ${typeof newObj.a.b.c}`)
  }

  testPointerSetValueWithMissingRootStartingWithArray() {
    const path = '/-/a/b';
    const ptr = new JsonPointer(path);
    const obj:any = {};
    this.areCollectionsIdentical([], JsonPointer.paths(obj, (x) => (typeof x !== 'object')));
    let newObj = ptr.setValue(null, '#', true);
    ptr.setValue(newObj, '#', true);
    this.areCollectionsIdentical(['/0/a/b', '/1/a/b'], JsonPointer.paths(newObj, (x) => (typeof x !== 'object')));
    this.isTrue(Array.isArray(newObj), `expected array, got ${typeof newObj}`)
  }

  testPointerSetValueWithEmptyPath() {
    const path = '';
    const ptr = new JsonPointer(path);
    const obj:any = {};
    const val = '#';
    const newObj = ptr.setValue(obj, val, true);
    this.areNotIdentical(obj, newObj);
    this.areIdentical(newObj, val);
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

  testPointerWithValue() {
    var ptr = new JsonPointer('/lala');
    var obj = {};
    this.areCollectionsIdentical([], Object.keys(obj));
    var newObj = ptr.withValue(obj, '#');
    this.areNotIdentical(obj, newObj);
    this.areCollectionsIdentical([], Object.keys(obj));
    this.areCollectionsIdentical(['lala'], Object.keys(newObj));
  }

  testPointerWithValueDeepCreatePath() {
    var ptr = new JsonPointer('/foo/bar');
    var obj = {};
    this.areCollectionsIdentical([], Object.keys(obj));
    var newObj = ptr.withValue(obj, '#', true);
    this.areNotIdentical(obj, newObj);
    this.areCollectionsIdentical([], Object.keys(obj));
    this.areCollectionsIdentical(['foo'], Object.keys(newObj));
    this.areCollectionsIdentical(['bar'], Object.keys(newObj.foo));
  }

  testPointerWithValueDeep() {
    var ptr = new JsonPointer('/foo/bar');
    var obj = { foo: { lala: 12 }};
    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['lala'], Object.keys(obj.foo));

    var newObj = ptr.withValue(obj, '#', true);

    this.areNotIdentical(obj, newObj, 'root objects must be different');
    this.areNotIdentical(obj.foo, newObj.foo, 'inner objects must be different');

    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['lala'], Object.keys(obj.foo));

    this.areCollectionsIdentical(['foo'], Object.keys(newObj));
    this.areCollectionsIdentical(['lala','bar'], Object.keys(newObj.foo));
  }

  testPointerWithValueDeepInArray() {
    var ptr = new JsonPointer('/foo/0/bar');
    var obj = { foo:  [ { lala: 12 } ] };
    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['0'], Object.keys(obj.foo));
    this.areCollectionsIdentical(['lala'], Object.keys(obj.foo[0]));

    var newObj = ptr.withValue(obj, '#', false);

    this.areNotIdentical(obj, newObj, 'root objects must be different');
    this.areNotIdentical(obj.foo, newObj.foo, 'array must be different');
    this.areNotIdentical(obj.foo[0], newObj.foo[0], 'inner objects must be different');

    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['0'], Object.keys(obj.foo));
    this.areCollectionsIdentical(['lala'], Object.keys(obj.foo[0]));

    this.areCollectionsIdentical(['foo'], Object.keys(newObj));
    this.areCollectionsIdentical(['0'], Object.keys(newObj.foo));
    this.areCollectionsIdentical(['lala','bar'], Object.keys(newObj.foo[0]));
  }

  testPointerWithValueDeepInNewArrayMember() {
    var ptr = new JsonPointer('/foo/-/bar');
    var obj = { foo:  [ { lala: 12 } ] };
    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['0'], Object.keys(obj.foo));
    this.areCollectionsIdentical(['lala'], Object.keys(obj.foo[0]));

    var newObj = ptr.withValue(obj, '#', true);

    this.areNotIdentical(obj, newObj, 'root objects must be different');
    this.areNotIdentical(obj.foo, newObj.foo, 'array must be different');
    this.areIdentical(obj.foo[0], newObj.foo[0], 'inner objects not must be different');

    this.areCollectionsIdentical(['foo'], Object.keys(obj));
    this.areCollectionsIdentical(['0'], Object.keys(obj.foo));

    this.areCollectionsIdentical(['foo'], Object.keys(newObj));
    this.areCollectionsIdentical(['0', '1'], Object.keys(newObj.foo));
    this.areCollectionsIdentical(['lala'], Object.keys(newObj.foo[0]));
    this.areCollectionsIdentical(['bar'], Object.keys(newObj.foo[1]));
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

  testPointerDeleteMissingValue() {
    var ptr = new JsonPointer('/lala/lala');
    var obj:any = {  };
    this.areCollectionsIdentical([], Object.keys(obj));
    ptr.setValue(obj, null, true);
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
    delete obj['lala'];
    this.areCollectionsIdentical([], Object.keys(obj));
    ptr.deleteValue(obj);
    this.areCollectionsIdentical([], Object.keys(obj));
  }

  testPointerSegmentGet() {
    const path = '/a/b/c/0/foo';
    const ptr = new JsonPointer(path);
    this.areIdentical('a', ptr.get(0));
    this.areIdentical('a', ptr.get(-5));
    this.areIdentical('b', ptr.get(1));
    this.areIdentical('b', ptr.get(-4));
    this.areIdentical('c', ptr.get(2));
    this.areIdentical('c', ptr.get(-3));
    this.areIdentical('0', ptr.get(3));
    this.areIdentical('0', ptr.get(-2));
    this.areIdentical('foo', ptr.get(4));
    this.areIdentical('foo', ptr.get(-1));
  }

  testNewJsonPointerEmptyArray() {
    const ptr = new JsonPointer([]);
    const obj = { a: 1 };
    this.areIdentical(obj, ptr.getValue(obj));
  }
  testNewJsonPointerEmptyString() {
    const ptr = new JsonPointer("");
    const obj = { a: 1 };
    this.areIdentical(obj, ptr.getValue(obj));
  }
  testJsonPointerGetEmptyString() {
    const ptr = JsonPointer.get("");
    const obj = { a: 1 };
    this.areIdentical(obj, ptr.getValue(obj));
  }
}

