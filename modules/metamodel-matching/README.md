# Metamodel Matching

This project contains a mechanism to map combinations of an IModelType and some
other data (fieldname, type name, kind, some others) to an object or function,
to facilitate metamodel-drive construction of UI (or basically, anything).

The underlying idea is that a certain type of data should always be rendered
or edited identically, for that purpose you can map components to combinations
of their type, their type's kind, flavor and whatever other data you use
for differentiating data types (you can basically attach anything you like
to your schema nodes).

You can obtain a mapping from a Matchmaker like so:

```

const matchmaker = /*...*/;
const component = matchmaker.findBest(type, fieldname);

```


The construction of matchmakers is done in two phases, they are added
to a matchmaker builder (by calling it's chainable `add(obj, matcher)`method)
and when all components have been added, a matchmaker
is created by calling `freeze()` on the builder:

```
const matchmaker =
        matchMakerBuilder([])
        .add(editArray, MatchQ.kind('array'))
        .add(editObject, MatchQ.and(MatchQ.kind('object'), MatchQ.typeName('Properties')))
        .freeze();

```

The empty array given to the `matchmakerBuilder()` can also be filled with
tuples of your desired type `T` and matchers, ie. instances of type 
`MetamodelMatchFun`, which is defined as:

```
type MetamodelMatchFun =
  (
    type: IModelType<any>, 
    fieldName:string, 
    flavor:string, 
    container?: IModelTypeComposite<any>
  ) => number;
  ```

