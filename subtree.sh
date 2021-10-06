
for m in metamodel metamodel-react 
do
  echo "------------ ${m} --------------"
  git subtree  add --prefix=modules/${m} ../${m}/.git develop
done
for m in json-ref simpletemplate systemjs-jsonschema-loader webpack-jsonschema-loader
do
  echo "------------ ${m} --------------"
  git subtree  add --prefix=modules/${m} ../${m}/.git master
done


git subtree  add --prefix=modules/metamodel-api ../metaapi/.git develop
