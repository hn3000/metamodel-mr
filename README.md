
# JSON Reference tools

Contains some relatively simple tools to parse and resolve JSON Pointer and JSON Reference notation.

A custom fetch implementation must be provided to allow clients to provide different resolution strategies. For most uses a very simple adapter can be used with isomorphic-fetch, allowing operation in both node and browser.

Example code:

```Typescript
import { JsonReferenceProcessor } from '@hn3000/json-ref';

let referenceProcessor = new JsonReferenceProcessor();

let promise = referenceProcessor.expandRef ("./somedata.json#/foo");

promise.then((somedataFoo:any) => {
  // somedata.json#/foo is in somedataFoo
});

```
At this point, all referenced files have been loaded so that all references can be resolved without fetching anything.

The object has only been expanded as far as necessary to access the property foo. All further property accesses work through dynamic getters, avoiding any issues with (indirect) cyclic references. Direct cyclic references will currently lead to endless promise resolution, i.e. they will not even crash with a stackoverflow.
