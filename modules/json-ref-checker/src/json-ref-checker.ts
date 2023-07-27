
import { JsonPointer } from '@hn3000/json-ref';

type NodeMap = {
  [path: string]: JsonPointer[];
}

export class JsonRefChecker {

  public static checkReferences(obj: any): JsonPointer[][] {
    const nodeMap = {} as NodeMap;

    JsonPointer.walkObject(obj, (o, p) => {
      if (o['$ref']) {
        const target = JsonPointer.get(o['$ref']);
        const src = p;
        let paths = nodeMap[target.asString()];
        if (undefined === paths) {
          paths = [ src ];
          nodeMap[target.asString()] = paths;
        } else {
          paths.push(src);
        }
      }
      return false;
    });

    /*
    console.log(JSON.stringify(nodeMap, (_, x) => {
      if (x instanceof JsonPointer) {
        return x.asString();
      }
      return x;
    }));
    */

    const loops = [] as string[];
    for (const np of Object.keys(nodeMap)) {
      const paths = nodeMap[np];
      const stack = paths.slice();

      while (stack.length) {
        const thisPath = stack.shift();
        let cur = thisPath;
        while (cur.hasParent()) {
          const curPaths = nodeMap[cur.asString()];
          for (const p of curPaths ?? []) {
            const ps = p.asString();
            if (!paths.some(x => x.asString() === ps)) {
              paths.push(p);
              stack.push(p);
            } else {
              if (!loops.some(l => l === np)) {
                loops.push(np);
              }
            }
          }
          cur = cur.parent;
        }
      }
    }

    let result: JsonPointer[][] = loops.map(x => nodeMap[x]); //[] as JsonPointer[][];


    console.log(JSON.stringify(result, (_, x) => {
      if (x instanceof JsonPointer) {
        return x.asString();
      }
      return x;
    }));

    return result;
  }
  

}