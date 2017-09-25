
import { APIModelRegistry } from '../src/metaapi';
import { IModelTypeComposite } from '@hn3000/metamodel';

import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';

export class ApiDumper {
  dumpApi(name: string) {
    let modelregistry = new APIModelRegistry(fetchFile);
    let fn = path.join(process.cwd(), name);
    console.log(fn);
    let promise = modelregistry.fetchModel(fn, 'xapi');
    promise.then(model => {
      //console.log(JSON.stringify(model, null, 2));
      for (let o of model.operations()) {
        console.log(`${o.name}: ${(o.requestModel.paramsType as IModelTypeComposite<any>).items.map(x => x.key).join(', ')}`);
        for (let l of Object.keys(o.requestModel.paramsByLocation)) {
          console.log(`${o.name}-${l}: ${o.requestModel.paramsByLocation[l].join(', ')}`);
        }
      }
    }, err => console.log(err));
  }
}

function fetchFile(x:string) {
  return Promise.resolve(x).then(x => {
    console.log("reading ", x, process.cwd());
    return fs.readFileSync(x, 'utf-8');
  });
}


