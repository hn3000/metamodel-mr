
import { APIModelRegistry } from '../src/metaapi';

import {
  TestClass
} from "@hn3000/tsunit-async";

import * as path from 'path';
import * as fs from 'fs';

export class PetStoreTest extends TestClass {
  testParse() {
    let modelregistry = new APIModelRegistry(fetchFile);
    let fn = path.join(__dirname, '../../test/petstore.json');
    //let url = `file://${fn}`;
    console.log(fn);
    let promise = modelregistry.fetchModel(fn, 'petstore');
    return promise.then(model => {
      this.areIdentical(20, model.operations().length, 'number of operations should be 20');
      this.isTrue(null != model.propGet('spec'), 'model should keep spec around')
      this.areIdentical(model.base, model.propGet('spec').basePath, 'model base should match spec')
      //console.log(model);
    }, err => console.log(err));
  }
}

function fetchFile(x:string) {
  return Promise.resolve(x).then(x => {
    console.log("reading ", x, process.cwd());
    return fs.readFileSync(x, 'utf-8');
  });
}