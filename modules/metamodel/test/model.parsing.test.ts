import {
  IPropertyStatusMessage,
    ModelParseContext,
    ModelSchemaParser,
    ModelTypeObject,
    ModelView
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelParsingTest extends TestClass {
  testSimpleSchema() {
    const parser = new ModelSchemaParser();

    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "blah": {
          type: "string",
          pattern: /^\d+$/
        },
        "tgt3": {
          type: "string",
          minLength: 3
        },
        "tlt5": {
          type: "string",
          maxLength: 5
        },
        "tlt5d": {
          type: "string",
          maxLength: 5,
          pattern: /^\d+$/
        }
      }
    });

    const type = parser.type('ExampleObject');
    const ctx = new ModelParseContext({
      blah: '123a',
      tgt3: '12',
      tlt5: '123456',
      tlt5d: '12d34'
    }, type)
    type.validate(ctx);
    this.areIdentical(4, ctx.errors.length);
    this.areIdentical('value does not match /^\\d+$/:', ctx.errors[0].msg);
    this.areIdentical('length must be at least 3:', ctx.errors[1].msg);
    this.areIdentical('length must be at most 5:', ctx.errors[2].msg);
    this.areIdentical('value does not match /^\\d+$/:', ctx.errors[3].msg);
  }

  testSimpleNumericConstraints() {
    const parser = new ModelSchemaParser();

    parser.addSchemaObject('NumbersObject', {
      type: "object",
      properties: {
        gt0: {
          type: "number",
          minimum: 0,
          minimumExclusive: true
        },
        lt0: {
          type: "number",
          maximum: 0,
          maximumExclusive: true
        },
        ge0: {
          type: "number",
          minimum: 0
        },
        le0: {
          type: "number",
          maximum: 0
        }
      },
      required: [ 'lt0', 'gt0', 'le0', 'ge0' ]
    });

    const type = parser.type('NumbersObject');

    let ctx = new ModelParseContext({
      gt0: 0.1,
      lt0: -0.1,
      ge0: 0,
      le0: 0
    }, type, true, false)
    ctx.validate();
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      gt0: 0,
      lt0: 0,
      ge0: -0.0001,
      le0: 0.0001
    }, type, true, false)
    ctx.validate();

    this.areIdentical(4, ctx.messages.length);
    this.areIdentical('expected 0 > 0.', ctx.messages[0].msg);
    this.areIdentical('expected 0 < 0.', ctx.messages[1].msg);
    this.areIdentical('expected -0.0001 >= 0.', ctx.messages[2].msg);
    this.areIdentical('expected 0.0001 <= 0.', ctx.messages[3].msg);
  }


  testSimpleSchemaWithDefaults() {
    var parser = new ModelSchemaParser(undefined, {
      strings: {
        pattern: "^[aeiou]+$",
        minLength: 3,
        maxLength: 5
      },
      numbers: {
        minimum: 3,
        maximum: 7,
        multipleOf: 2
      }
    });

    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "text": {
          type: "string"
        },
        "number": {
          type: "number"
        },
        "number2": {
          type: "number"
        }
      }
    });

    var type = parser.type('ExampleObject');

    var ctx = new ModelParseContext({
      text: 'aeiou1b',
      number: 11,
      number2: 5
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(5, ctx.errors.length);
    this.areIdentical('length must be between 3 and 5:', ctx.errors[0].msg);
    this.areIdentical('value should not match /([^aeiou])/g:', ctx.errors[1].msg);
    this.areIdentical('expected 11 <= 7.', ctx.errors[2].msg);
    this.areIdentical('expected multiple of 2 but got 11', ctx.errors[3].msg);
    this.areIdentical('expected multiple of 2 but got 5', ctx.errors[4].msg);
  }

  testSimpleSchemaWithPatternDefault() {
    var parser = new ModelSchemaParser(undefined, {
      strings: {
        pattern: /a-z/
      }
    });

    parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "text": {
          type: "string"
        }
      }
    });

    var type = parser.type('ExampleObject');

    var ctx = new ModelParseContext({
      text: 'AEI'
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('value does not match /a-z/:', ctx.errors[0].msg);

    ctx = new ModelParseContext({
      text: 'XXa-zYY'
    }, type, true, false); // required=true, allowConversion=false

    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }

  testSchemaWithValueIfConstraint() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "string", pattern: /^\d+$/ },
        "q": { type: "string", pattern: /^\d+$/ },
        "r": { type: "string", pattern: /^\d+$/ },
        "s": { type: "string", pattern: /^\d+$/ }
      },
      constraints: [
        {
          constraint: 'valueIf',
          condition: { property: 'p', value: '12'},
          valueProperty: 'q',
          possibleValue: '13'
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '12',
      q: '14'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('q', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '13'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '11',
      q: '14'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testSchemaWithValueIfAllConstraint() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "number" },
        "q": { type: "integer" },
        "r": { type: "string", /*pattern: /^\d+$/*/ },
        "s": { type: "string", /*pattern: /^\d+$/*/ }
      },
      constraints: [
        {
          constraint: 'valueIfAll',
          condition: [
            { property: 'p', value: '12'},
            { property: 'q', value: '12'}
          ],
          valueProperty: 'r',
          possibleValue: '13'
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '11'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('r', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '',
      s: ''
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('r', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '11',
      r: '11',
      s: ''
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '13'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }

  testSchemaWithRequiredIfAllConstraint() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": { type: "number" },
        "q": { type: "integer" },
        "r": { type: "string", pattern: /^\d+$/ },
        "s": { type: "string", pattern: /^\d+$/ }
      },
      constraints: [
        {
          constraint: 'requiredIfAll',
          condition: [
            { property: 'p', value: '12'},
            { property: 'q', value: '12'}
          ],
          properties: 'r'
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: null
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('r', ctx.errors[0].property);

    ctx = new ModelParseContext({
      p: '12',
      q: '11',
      r: undefined
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '12',
      q: '12',
      r: '13'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testSchemaWithMinAge18YearsConstraintFails() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": {
          type: "string",
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          constraints: [
            {
              constraint: 'minAge',
              age: "18y"
            }
          ]
        }
      },
    });

    var ctx = new ModelParseContext({
      p: '2016-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].property);
  }
  testSchemaWithMaxAge6MonthsConstraintFails() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": {
          type: "string",
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          constraints: [
            {
              constraint: 'maxAge',
              age: "6months"
            }
          ]
        }
      },
    });

    var backthen = new Date();

    backthen.setMonth(backthen.getMonth() - 7);

    var ctx = new ModelParseContext({
      p: backthen.toISOString().substring(0,10)
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].property);
  }


  testSchemaWithMinAge18YearsConstraintSucceeds() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": {
          type: "string",
          pattern: /^\d{4}-\d{2}-\d{2}$/,
          constraints: [
            {
              constraint: 'minAge',
              age: "18y"
            }
          ]
        }
      }
    });

    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);
  }
  testSchemaWithMinAge18OnObject() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": {
          type: "string",
          pattern: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      constraints: [
        {
          constraint: 'minAge',
          property: 'p',
          years: "18"
        }
      ]
    });

    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '2050-01-01'
    }, type)
    type.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].property);
  }
  testSchemaWithMinAge18OnSlicedObject() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        "p": {
          type: "string",
          pattern: /^\d{4}-\d{2}-\d{2}$/
        }
      },
      constraints: [
        {
          constraint: 'minAge',
          property: 'p',
          years: "18"
        },
        {
          constraint: 'minAge',
          property: 'q',
          years: "18"
        }
      ]
    });

    var slice = (type as ModelTypeObject<any>).slice(['p']);

    var ctx = new ModelParseContext({
      p: '1998-01-01'
    }, type)
    slice.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: '2050-01-01'
    }, type)
    slice.validate(ctx);
    this.areIdentical(1, ctx.errors.length);
    this.areIdentical('p', ctx.errors[0].property);
  }
  testSchemaWithArrayOfEnum() {
    var parser = new ModelSchemaParser();

    var type = parser.addSchemaObject('ExampleObject', {
      type: "object",
      properties: {
        p: {
          type: "array",
          items: {
            type: "string",
            enum: [ "a", "b", "c" ],
            uniqueItems: true
          }
        }
      }
    });

    var slice = (type as ModelTypeObject<any>).slice(['p']);

    var ctx = new ModelParseContext({
      p: [ 'a' ]
    }, type)
    slice.validate(ctx);
    this.areIdentical(0, ctx.errors.length);

    ctx = new ModelParseContext({
      p: [ 'x', 'y' ]
    }, type)
    slice.validate(ctx);
    this.areIdentical(2, ctx.errors.length);
    this.areIdentical('p.0', ctx.errors[0].property);
    this.areIdentical('p.1', ctx.errors[1].property);

    let view = new ModelView​​(slice, ctx.currentValue);
    view = view.withValidationMessages(ctx.messages);

    this.areIdentical(2, view.getFieldMessages("p").length);
  }

  testFlavouredSchema() {
    var parser = new ModelSchemaParser();

    parser.addSchemaObject('FlavorObject', {
      type: "object",
      properties: {
        "text": {
          type: "string",
          flavour: "stringy-text"
        },
        "number": {
          type: "number",
          flavor: "digital-number"
        },
        "number2": {
          type: "number",
          'x-flavor': "digit-flavored-number"
        },
        "text2": {
          type: "string",
          'x-Flavour': "cheese-flavoured-string"
        },
        "text3": {
          type: "string",
          'x-flavour': "cheese-flavoured-string"
        }
      }
    });

    var type = parser.type('FlavorObject').asCompositeType();

    this.areNotIdentical(undefined, type, 'parsed type must be composite');

    this.isTrue(null != type.itemType('text'), 'composite should have item for text');
    this.isTrue(null != type.itemType('text').propGet('flavor'), 'item text should have flavor');
    this.isTrue(null != type.itemType('text2').propGet('flavor'), 'item text2 should have flavor');
    this.isTrue(null != type.itemType('number').propGet('flavor'), 'item for number should have flavor');
    this.isTrue(null != type.itemType('number2').propGet('flavor'), 'item for number should have flavor');
    this.isTrue(null != type.itemType('text').propGet('flavour'), 'item text should have flavour');
    this.isTrue(null != type.itemType('text2').propGet('flavour'), 'item text should have flavour');
    this.isTrue(null != type.itemType('text3').propGet('flavour'), 'item text should have flavour');
    this.isTrue(null != type.itemType('number').propGet('flavour'), 'item for number should have flavour');
    this.isTrue(null != type.itemType('number2').propGet('flavour'), 'item for number should have flavour');
    
    this.areIdentical('stringy-text', type.itemType('text').propGet('flavor'), 'item text should have flavor');
    this.areIdentical('stringy-text', type.itemType('text').propGet('flavour'), 'item text should have flavour');
    this.areIdentical('cheese-flavoured-string', type.itemType('text2').propGet('flavor'), 'item text should have flavor');
    this.areIdentical('cheese-flavoured-string', type.itemType('text2').propGet('flavour'), 'item text should have flavour');
    this.areIdentical('cheese-flavoured-string', type.itemType('text3').propGet('flavor'), 'item text should have flavor');
    this.areIdentical('cheese-flavoured-string', type.itemType('text3').propGet('flavour'), 'item text should have flavour');
    this.areIdentical('digital-number', type.itemType('number').propGet('flavor'), 'item for number should have flavor');
    this.areIdentical('digital-number', type.itemType('number').propGet('flavour'), 'item for number should have flavour');
    this.areIdentical('digit-flavored-number', type.itemType('number2').propGet('flavor'), 'item for number should have flavor');
    this.areIdentical('digit-flavored-number', type.itemType('number2').propGet('flavour'), 'item for number should have flavour');
  }


  testOneOfSchema() {
    var parser = new ModelSchemaParser();

    parser.addSchemaObject('OneOfObject', {
      type: "object",
      properties: {
        "tag": {
          type: "string",
          enum: ["gt0", "lt0"]
        },
        "number": {
          type: "number"
        }
      },
      oneOf: [
        { type: "object",
          properties: { 
            "tag": { enum: [ "gt0" ], type: "string"},
            "number": { minimum: 0, minimumExclusive: true, type: "number" }
          },
          required: [ 'tag', 'number' ]
        },
        { type: "object",
          properties: { 
            "tag": { enum: [ "lt0" ], type: "string"},
            "number": { maximum: 0, maximumExclusive: true, type: "number" }
          },
          required: [ 'tag', 'number' ]
        },
      ]
    });

    var type = parser.type('OneOfObject').asCompositeType();

    this.areNotIdentical(undefined, type, 'parsed type must be composite');

    let ctx = new ModelParseContext({ tag: "xyzzy", number: 0 }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(3, ctx.messages.length, `expected three validation messages, got ${formatMessages(ctx)}`);
    this.areIdentical("not a valid value", ctx.messages[0].msg);
    this.areIdentical("one of failed to match", ctx.messages[1].msg);

    ctx = new ModelParseContext({ tag: "gt0", number: 0 }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(2, ctx.messages.length, `expected two validation messages, got ${formatMessages(ctx)}`);
    this.areIdentical("one of failed to match", ctx.messages[0].msg);

    ctx = new ModelParseContext({ tag: "gt0", number: 12 }, type, false);
    const val = ctx.currentValue();
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.messages.length, `expected no validation messages got ${formatMessages(ctx)}`);
    this.isTrue(val === ctx.currentValue());

  }

  testOneOfWithConstraints() {
    var parser = new ModelSchemaParser();

    parser.addSchemaObject('OneOfObject', {
      type: "object",
      properties: {
        "ttt": {
          type: "string",
          enum: ["old", "new"]
        },
        "ddd": {
          type: "string",
          format: "date"
        }
      },
      oneOf: [
        { type: "object",
          properties: { 
            "ttt": { enum: [ "old" ], type: "string"},
            "ddd": {
              type: "string",
              format: "date",
              constraints: [
                {
                  constraint: "maxAge",
                  age: "6m"
                },
                {
                  constraint: "before",
                  date: "tomorrow"
                }
              ]
            }
          }
        },
        { type: "object",
          properties: { 
            "ttt": { enum: [ "new" ], type: "string"},
            "ddd": {
              type: "string",
              format: "date",
            }
          },
          constraints: [
            {
              property: "ddd",
              constraint: "after",
              date: "today"
            }
          ]
        }
      ],
      required: ['ttt','ddd']
    });

    var type = parser.type('OneOfObject').asCompositeType();

    /*
    console.log(type);
    console.log(JSON.stringify((type as any)._constraints._constraints[0]._types, null, 2));
    for (const i of type.items) {
      console.log(i.key, i.type);
    }
    */

    let now = new Date();
    let halfAYearAgo = new Date();
    halfAYearAgo.setMonth(halfAYearAgo.getMonth()-6);
    halfAYearAgo.setDate(halfAYearAgo.getDate()+1);
    let halfAYearAgoAndADay = new Date(halfAYearAgo);
    halfAYearAgoAndADay.setDate(halfAYearAgoAndADay.getDate()-1);
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate()+1);

    let afterTomorrow = new Date();
    afterTomorrow.setDate(afterTomorrow.getDate()+2);


    let ctx = new ModelParseContext({ ttt: "old", ddd: now }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.messages.length, `expected no validation messages (old/now), got ${formatMessages(ctx)}`);
    
    ctx = new ModelParseContext({ ttt: "old", ddd: halfAYearAgoAndADay }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(2, ctx.messages.length, `expected two validation messages (old/6m+1), got ${formatMessages(ctx)}`);
    this.areIdentical("one of failed to match", ctx.messages[0].msg);

    ctx = new ModelParseContext({ ttt: "old", ddd: tomorrow }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(2, ctx.messages.length, `expected two validation messages (old/tomorrow), got ${formatMessages(ctx)}`);
    this.areIdentical("one of failed to match", ctx.messages[0].msg);

    ctx = new ModelParseContext({ ttt: "old", ddd: halfAYearAgo }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.messages.length, `expected no validation messages (old/6m), got ${formatMessages(ctx)}`);

    ctx = new ModelParseContext({ ttt: "new", ddd: tomorrow }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(0, ctx.messages.length, `expected no validation messages (new/tomorrow), got ${formatMessages(ctx)}`);

    ctx = new ModelParseContext({ ttt: "new", ddd: now }, type);
    ctx.currentType().validate(ctx);
    this.areIdentical(2, ctx.messages.length, `expected two validation messages (new/now), got ${formatMessages(ctx)}`);
    this.areIdentical("one of failed to match", ctx.messages[1].msg);


  }
}

function formatMessages(ctx: ModelParseContext) {
  const { messages } = ctx;
  const formatted = messages.map(x => (x.property+': '+x.msg /*+''+JSON.stringify(x.props??{})*/ ));
  if (formatted.length)
  return formatted.join(' / ')
}