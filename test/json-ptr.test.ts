
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

  testPointerSetValue() {
    var ptr = new JsonPointer('/lala');
    var obj = {};
    this.areCollectionsIdentical([], Object.keys(obj));
    ptr.setValue(obj, '#');
    this.areCollectionsIdentical(['lala'], Object.keys(obj));
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

