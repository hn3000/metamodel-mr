
import {
  ModelTypeBool, ModelParseContext,
} from '../src/model';


import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelTypeBoolTest extends TestClass {
  private static s_type = new ModelTypeBool('bool');
  testBooleanFalseIsValid() {
    let ctx = new ModelParseContext(false, ModelTypeBoolTest.s_type, true);
    ctx.validate();

    this.areIdentical(0, ctx.messages.length);
  }

  testBooleanTrueIsValid() {
    let ctx = new ModelParseContext(false, ModelTypeBoolTest.s_type, true);
    ctx.validate();

    this.areIdentical(0, ctx.messages.length);
  }

  testBooleanConversions() {
    let convert = (x: string|boolean|any, errors: string[] = [], required=true) => {
      const ctx = new ModelParseContext(x, ModelTypeBoolTest.s_type, required);
      const result = ctx.parse();
      this.areIdentical(errors.length, ctx.messages.length);
      for (let i = 0; i < errors.length; ++i) {
        this.areIdentical(errors[i], ctx.messages[i].msg);
      }
      return result;
    };

    this.areIdentical(true, convert(true)      , "convert(true)");
    this.areIdentical(true, convert('checked') , "convert('checked')");
    this.areIdentical(true, convert('yes')     , "convert('yes')");
    this.areIdentical(true, convert('true')    , "convert('true')");

    this.areIdentical(false, convert('false'));
    this.areIdentical(false, convert('no'));
    this.areIdentical(false, convert(false));

    this.areIdentical(null, convert(null, ['required value is missing']));
    this.areIdentical(null, convert(undefined, ['required value is missing']));
    this.areIdentical(null, convert(/true/, ['can not convert to boolean']));
  }

}