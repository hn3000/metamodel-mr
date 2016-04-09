import {
    modelTypes,
    ModelParseContext,
    ModelItemConstraints,
    ModelItemConstraintLess,
    ModelItemConstraintLessEqual,
    ModelItemConstraintMore,
    ModelItemConstraintMoreEqual
} from "../src/model";

import {
  TestClass
} from "tsunit.external/tsUnit";

export class ModelTest extends TestClass {
  testSimpleMetaModel() {
    let example = {
      lala: 1,
      blah: '2',
      blub: 3.14
    };

    let exampleModel = modelTypes.addObjectType('example', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number'));


    let context = new ModelParseContext(example);
    exampleModel.validate(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);
  }

  testSimpleMetaModelWarnsAboutInts() {
    let example = {
      lala: 1.1,
      blah: '2',
      blub: "3.14"
    };

    let exampleModel = modelTypes.addObjectType('example/fails', ()=>({}))
      .addItem('lala', modelTypes.type('number/int'))
      .addItem('blah', modelTypes.type('string'))
      .addItem('blub', modelTypes.type('number/int'));


    let context = new ModelParseContext(example);
    exampleModel.validate(context);

    this.areIdentical(2, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical('blub', context.warnings[1].path);
    this.areIdentical(0, context.errors.length);
  }

  testMetaModelChecksRanges() {
    let example = {
      lala: 1.1
    };

    let exampleModel = modelTypes.addObjectType('example/fails', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelItemConstraints.less(1).warnOnly()));


    let context = new ModelParseContext(example);
    let result:any = exampleModel.parse(context);

    this.areIdentical(1, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(1.1,result.lala);
  }

  testMetaModelChecksAndAdjustsRanges() {
    let example = {
      lala: 1.1
    };

    let exampleModel = modelTypes.addObjectType('example/fails')
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelItemConstraints.less(1)));


    let context = new ModelParseContext(example);
    let result:any = exampleModel.parse(context);

    this.areIdentical(1, context.warnings.length);
    this.areIdentical('lala', context.warnings[0].path);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(1,result.lala);
  }
  testMetaModelParsesStrings() {
    let example = {
      value: "1.1",
      flag: "yes",
      choice: "one"
    };

    let exampleModel = modelTypes.addObjectType('example/fails')
      .addItem('value', modelTypes.itemType('number').withConstraints(ModelItemConstraints.more(1)))
      .addItem('flag', modelTypes.itemType('boolean'))
      .addItem('choice', modelTypes.itemType('string').withConstraints(ModelItemConstraints.possibleValues(['one','two', 'three'])));


    let context = new ModelParseContext(example);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);

    this.areIdentical(1.1,result.value);
    this.areIdentical(true,result.flag);
    this.areIdentical("one",result.choice);

  }
  testMetaModelHasLowerBound() {
    let exampleModel = modelTypes.addObjectType('example/succeds', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelItemConstraints.more(1)));
      
    this.isTrue(null != exampleModel.subModel('lala').asItemType().lowerBound(), `constraints: ${(<any>exampleModel.subModel("lala"))._constraints}`);
  }
  testMetaModelHasUpperBound() {
    let exampleModel = modelTypes.addObjectType('example/succeds', ()=>({}))
      .addItem('lala', modelTypes.itemType('number').withConstraints(ModelItemConstraints.less(1)));
      
    this.isTrue(null != exampleModel.subModel('lala').asItemType().upperBound(), `constraints: ${(<any>exampleModel.subModel("lala"))._constraints}`);
  }
  
  testPossibleValuesAllowsValue() {
    let example = {
      lala: 'one'
    };

    let exampleModel = modelTypes.addObjectType('example/succeeds')
      .addItem('lala', modelTypes.itemType('string').withConstraints(ModelItemConstraints.possibleValues(['one'])));

    let context = new ModelParseContext(example);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(0, context.errors.length);
    this.areIdentical('one', result['lala']);
  }
  testPossibleValuesPreventsForbiddenValue() {
    let example = {
      lala: 'two'
    };

    let exampleModel = modelTypes.addObjectType('example/succeeds')
      .addItem('lala', modelTypes.itemType('string').withConstraints(ModelItemConstraints.possibleValues(['one'])));

    let context = new ModelParseContext(example);
    let result:any = exampleModel.parse(context);

    this.areIdentical(0, context.warnings.length);
    this.areIdentical(1, context.errors.length);
    this.areIdentical('lala', context.errors[0].path);
    this.areIdentical(null, result['lala']);
  }

}
