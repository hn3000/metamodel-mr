
import { APIModelRegistry } from '../src/metaapi';
import { IModelTypeComposite } from '@hn3000/metamodel';

import * as path from 'path';
import * as fs from 'fs';
import * as process from 'process';
import { ParamLocation } from '../src/api';

export class ApiDumper {
  static dumpApi(name: string) {
    let modelregistry = new APIModelRegistry(fetchFile);
    let fn = path.join(process.cwd(), name);
    console.log(fn);
    let promise = modelregistry.fetchModel(fn, 'xapi');
    promise.then(model => {
      //console.log(JSON.stringify(model, null, 2));
      for (let o of model.operations()) {
        const items = (o.requestModel.paramsType as IModelTypeComposite<any>).items || [];
        console.log(`${o.name}: ${items.map(x => x.key).join(', ')}`);
        if (items.length) {
          for (let l of Object.keys(o.requestModel.paramsByLocation) as ParamLocation[]) {
            console.log(`${o.name}-${l}: ${o.requestModel.paramsByLocation[l].join(', ')}`);
          }
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



if (process.argv.length > 1) {
  process.argv.slice(2).forEach(name => {
    ApiDumper.dumpApi(name);
  });
} else {
  console.error(`usage: ${process.argv0} <apifile>`);
}