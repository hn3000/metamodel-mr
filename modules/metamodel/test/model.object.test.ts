import {
    IModelTypeComposite,
    modelTypes,
    ModelTypeConstraintConditionalValue,
    ModelTypeConstraintCompareProperties,
    ModelTypeConstraintEqualProperties,
    ModelTypeObject,
    ModelTypeConstraintPossibleValues
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";
import { ModelTypeArray, ModelTypeArraySizeConstraint, ModelTypeArrayUniqueElementsConstraint } from "../src/model.array";

export class ModelTypeObjectTest extends TestClass {

  private model:IModelTypeComposite<any>;
  private modelNested:IModelTypeComposite<any>;
  setUp() {
    modelTypes.removeType('test');
    this.model = (
      modelTypes.addObjectType('test')
        .addItem('p', modelTypes.type('string'))
        .addItem('q', modelTypes.type('string'))
        .addItem('r', modelTypes.type('string'))
        .addItem('s', modelTypes.type('string'))
    );
    modelTypes.removeType('nested');
    modelTypes.removeType('o');
    modelTypes.removeType('r');

    const numberArrayMinLen3 = modelTypes.itemType('number[]').withConstraints(
      new ModelTypeArraySizeConstraint({ minLength:3, maxLength: 5 })
      );

    const numberArrayMinLen3Uniq = numberArrayMinLen3.withConstraints(
      new ModelTypeArrayUniqueElementsConstraint()
    );

    const smallPrimeType = modelTypes.type('number')
    .asItemType()
    .withNameAndConstraints(
      'smallprime',
      new ModelTypeConstraintPossibleValues([2,3,5,7,11,13])
    );
    modelTypes.addType(smallPrimeType);
    const numberArrayMinLen3UniqPrimes = new ModelTypeArray(
        modelTypes.type('smallprime').asItemType()
      )
      .withConstraints(
        new ModelTypeArraySizeConstraint({ minLength:3, maxLength: 5 }),
        new ModelTypeArrayUniqueElementsConstraint()
      );

    this.modelNested = (
      modelTypes.addObjectType('nested')
        .addItem('p', modelTypes.type('string'))
        .addItem('q', modelTypes.type('string'))
        .addItem('o', (
          modelTypes.addObjectType('o'))
          .addItem('s', modelTypes.type('string'), true)
          .addItem('n', modelTypes.type('number'), true)
        , false)
        .addItem('r', (
          modelTypes.addObjectType('r'))
          .addItem('s', modelTypes.type('string'), true)
          .addItem('n', modelTypes.type('number'), true)
          .addItem('a', numberArrayMinLen3, true)
          .addItem('b', numberArrayMinLen3Uniq, true)
          .addItem('c', numberArrayMinLen3UniqPrimes, true)
        , true)
    );
  }

  testComparePropertiesConstraintEqualWithDifferentValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '=='}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
  }

  testComparePropertiesConstraintEqualWithEqualValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '=='}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testComparePropertiesConstraintEqualWithNullishValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({
      properties: ['p', 'q'], 
      op: '=='
    }));

    let t: { [k: string]: null|undefined|string|number } = {
      p: null,
      q: undefined
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
    t = {
      p: null,
      q: undefined
    };

    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }


  testComparePropertiesConstraintLessWithCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '<'}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testComparePropertiesConstraintLessWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '<'}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-less', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-less', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testComparePropertiesConstraintGreaterWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '>'}));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-greater', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-greater', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testComparePropertiesConstraintGreaterEqualWithWrongValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintCompareProperties({properties: ['p','q'], op: '>='}));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-wrong-order-greater-equal', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-wrong-order-greater-equal', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testEqualPropertiesConstraintWithDifferentValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 13
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('properties-different', context.errors[0].code);
    this.areIdentical('p', context.errors[0].property);
    this.areIdentical('properties-different', context.errors[1].code);
    this.areIdentical('q', context.errors[1].property);
  }

  testEqualPropertiesConstraintWithEqualsValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintEqualProperties(['p','q']));

    let t = {
      p: 12,
      q: 12
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }

  testConstraintConditionalValueRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }
  testConstraintConditionalValueChecksCorrectValue() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  'q',
        possibleValue: '13',
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    var context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '99';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('q', context.errors[0].property);
  }
  testConstraintConditionalValueAllowsOneFromArrayOfValues() {
    var model = this.model as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  'q',
        possibleValue: ['13', '15'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '12',
      q: '13',
      r: '14'
    };

    var context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '13';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);

    t.q = '15';
    context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }
  testConstraintConditionalValueIgnoresWhenConditionFalse() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: '13',
      q: null,
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.errors.length);
  }
  testConstraintConditionalValueClearsValuesWhenConditionFalse() {
    var model:IModelTypeComposite<any> = this.model;
    var modelwc = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: true
    }));

    let t:any = {
      p: '13',
      q: 'ab',
      r: 17
    };

    let context = modelTypes.createParseContext(t, model, true, false);
    let result = model.parse(context);

    this.areIdentical(1, context.errors.length);
    this.areIdentical('r', context.errors[0].property);

    context = modelTypes.createParseContext(t, modelwc, false, false);
    result = modelwc.parse(context);
    this.areIdentical(0, context.errors.length);
    this.areIdentical(undefined, result.q);
    this.areIdentical(undefined, result.r);
  }

  testConstraintConditionalValueOnArrayRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', value: '12' },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: ['11','12','13'],
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }

  testConstraintConditionalValueArrayOnArrayRequiresCorrectValues() {
    var model:ModelTypeObject<any> = this.model.slice(['p']) as ModelTypeObject<any>;
    model = model.withConstraints(new ModelTypeConstraintConditionalValue({
        condition: { property: 'p', op: "=", value: ['6', '12', '24'] },
        properties:  ['q','r','s'],
        clearOtherwise: false
    }));

    let t:any = {
      p: ['11','12','13'],
      q: '13',
      r: null
    };

    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(2, context.errors.length);
    this.areIdentical('r', context.errors[0].property);
    this.areIdentical('s', context.errors[1].property);
  }

  testOptionalObjectWithRequiredMembersIsNotRequired() {
    const model = this.modelNested;
    const t: any = {
      p: ['11','12','13'],
      q: '13',
      o: null,
      r: { n: 1, s: '#', a: [0,0,0], b: [1,2,3], c: [2,3,5] }
    };
    let context = modelTypes.createParseContext(t, model);
    model.validate(context);

    this.areIdentical(0, context.messages.length, "validate should not find errors, got "+context.messages.map(x => `${x.property}: ${x.msg} (${x.code})`).join(';'));

    context = modelTypes.createParseContext(t, model);
    model.parse(context);

    console.debug(context.messages);
    this.areIdentical(0, context.messages.length, "parse should not find errors");

  }

  testTypeObjectWithReplacedItems() {
    const model = (this.modelNested as ModelTypeObject<any>).withReplacedItems(
      {
        'r.s': modelTypes.type('boolean'),
        'r.n': undefined,
        'o': modelTypes.type('number')
      }
    );

    this.areIdentical('number', model.itemType('o').name);
    this.areIdentical('object', model.itemType('r').kind);
    this.areIdentical('bool', model.itemType('r').asCompositeType().itemType('s').kind);
    this.areIdentical(undefined, model.itemType('r').asCompositeType().itemType('n'));
  }

  testObjectCreateFillsProperties() {
    const type = this.modelNested.asCompositeType();
    const obj = type.create();
    this.isTruthy(obj.r);
    this.isFalsey(obj.s);
    this.areIdentical("", obj.r.s, 'obj.r.s should be empty string');
    this.areIdentical(0, obj.r.n, 'obj.r.n should be zero');
    this.areIdentical(3, obj.r.a.length, 'obj.r.a should be 3 long array');
    this.areCollectionsIdentical([0,0,0], obj.r.a, 'obj.r.a should be zero-filled array');
    this.areCollectionsIdentical([undefined,undefined,undefined], obj.r.b, 'obj.r.b should be array of 3 empty slots');
    this.areCollectionsIdentical([2,3,5], obj.r.c, 'obj.r.c should be prime-filled array');
  }

}
