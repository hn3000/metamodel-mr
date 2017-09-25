
import { APIModelRegistry } from '../src/metaapi';

import {
  TestClass
} from "tsunit.external/tsUnitAsync";

import * as path from 'path';
import * as fs from 'fs';

export class PetStoreTest extends TestClass {
  testParse() {
    let modelregistry = new APIModelRegistry(fetchFile);
    let fn = path.join(__dirname, '../../test/petstore.json');
    //let url = `file://${fn}`;
    console.log(fn);
    let promise = modelregistry.fetchModel(fn, 'petstore');
    promise.then(model => {
      console.log(model);
    }, err => console.log(err));
  }
}

function fetchFile(x:string) {
  return Promise.resolve(x).then(x => {
    console.log("reading ", x, process.cwd());
    return fs.readFileSync(x, 'utf-8');
  });
}