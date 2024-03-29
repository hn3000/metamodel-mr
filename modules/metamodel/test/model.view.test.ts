import {
    IModelTypeComposite,
    IModelView,
    ModelParseContext,
    ModelTypeConstraints,
    ModelSchemaParser,
    ModelView,
    modelTypes,
    MessageSeverity
} from "../src/model";

import {
  TestClass
} from "@hn3000/tsunit-async";

export class ModelViewTest extends TestClass {

  private _tinySchema = {
    type: 'object',
    properties: {
      a: { type: 'string' },
      r: { type: 'string' },
    },
    required: [ 'r' ]
  };

  private _pagedSchema = {
    type: 'object',
    properties: {
      aa: { type: 'string' },
      ab: { type: 'string' },
      ba: { type: 'string' },
      bb: { type: 'string' },
      ca: { type: 'string' },
      cb: { type: 'string' }
    },
    pages: [
      {
        alias: 'a',
        properties: [ 'aa', 'ab' ],
        pages: [
          { properties: [ 'aa' ] }
        ]
      },
      {
        alias: 'b',
        properties: [ 'ba', 'bb' ],
        pages: [
          { properties: [ 'ba' ] }
        ]
      },
      {
        alias: 'c',
        properties: [ 'ca', 'cb' ]
      }
    ]
  };

  private _pagedSchemaSkippedPage = {
    type: 'object',
    properties: {
      aa: { type: 'string' },
      ab: { type: 'string' },
      ac: { type: 'string' },
      ad: { type: 'string' },
      ba: { type: 'string' },
      bb: { type: 'string' },
      ca: { type: 'string' },
      cb: { type: 'string' }
    },
    pages: [
      {
        alias: 'a',
        properties: [ 'aa', 'ab', 'ac', 'ad' ],
        pages: [
          { 
            alias: 'aa',
            properties: [ 'aa' ],
            skipIf: [[ { property: 'aa', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ab',
            properties: [ 'ab' ],
            skipIf: [[ { property: 'ab', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ac',
            properties: [ 'ac' ],
            skipIf: [[ { property: 'ac', value: 'skip!', op: '==' } ]]
          },
          { 
            alias: 'ad',
            properties: [ 'ad' ],
            skipIf: [[ { property: 'ad', value: 'skip!', op: '==' } ]]
          }
        ],
        skipIf: [[
          { property: 'ab', op: '==', value: 'skip!' }
        ]]
      },
      {
        alias: 'b',
        properties: [ 'ba', 'bb' ],
        pages: [
          { properties: [ 'ba' ] }
        ],
        skipIf: [[
          { property: 'aa', op: '==', value: 'skip!' }
        ]]
      },
      {
        alias: 'c',
        properties: [ 'ca', 'cb' ]
      }
    ]
  };

  private _flaggySchema = {
    type: 'object',
    properties: {
      aa: { type: 'string' },
      ab: { type: 'string' },
    },
    pages: [
      {
        alias: 'a',
        properties: [ 'aa', 'ab' ],
        fooIf: true,
        "x-barIf": 'false',
        blahIf: { op: '>', property: "aa", value: 12 }
      }
    ]
  };

  private _nestedSchema = {
    type: 'object',
    properties: {
      sub: { 
        type: 'object',
        properties: {
          x: { type: 'number' },
          s: { type: 'string' }
        }
      },
      flat: { type: 'string' },
    }
  };

  private _schemaParser: ModelSchemaParser;
  private _tinyModel: IModelTypeComposite<any>;
  private _pagedModel: IModelTypeComposite<any>;
  private _pagedSkippedPageModel: IModelTypeComposite<any>;
  private _flaggyModel: IModelTypeComposite<any>;
  private _nestedModel: IModelTypeComposite<any>;

  setUp() {
    this._schemaParser = new ModelSchemaParser(undefined, {
      strings: {
        minLength: 2
      }
    });
    this._tinyModel = this._schemaParser.parseSchemaObject(this._tinySchema) as IModelTypeComposite<any>;
    this._pagedModel = this._schemaParser.parseSchemaObject(this._pagedSchema) as IModelTypeComposite<any>;
    this._pagedSkippedPageModel = this._schemaParser.parseSchemaObject(this._pagedSchemaSkippedPage) as IModelTypeComposite<any>;
    this._flaggyModel = this._schemaParser.parseSchemaObject(this._flaggySchema) as IModelTypeComposite<any>;
    this._nestedModel = this._schemaParser.parseSchemaObject(this._nestedSchema) as IModelTypeComposite<any>;
  }

  async testFieldValidity(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._tinyModel);

    view = view.withAddedData({
      a: null,
      r: null
    });

    view = await view.validateFull();

    this.isTrue(view.isFieldValid('a'), 'field a should be valid');
    this.isFalse(view.isFieldValid('r'), 'field r should not be valid');
  }

  async testClearedField() {
    var view: IModelView<any> = new ModelView(this._tinyModel);

    this.areIdentical(undefined, view.getFieldValue('a'), "initial state should be undefined");

    view = view.withAddedData({
      a: '1',
      r: 'lala'
    });

    this.areIdentical('1', view.getFieldValue('a'), "addedData should have set field a to '1'");
    this.areIdentical('lala', view.getFieldValue('r'), "addedData should have set field r to 'lala'");

    view = view.withClearedField('a');

    this.areIdentical(undefined, view.getFieldValue('a'), "withClearedField should have set a to undefined");
    this.areIdentical('lala', view.getFieldValue('r'), "withClearedField should have kept field r set to 'lala'");
  }

  async testClearedNestedField() {
    var view: IModelView<any> = new ModelView(this._nestedModel);

    this.areIdentical(undefined, view.getFieldValue('a'), "initial state should be undefined");

    view = view.withAddedData({
      flat: '1',
      sub: {
        x: 12,
        s: 'lala'
      }
    });

    this.areIdentical('1', view.getFieldValue('flat'), "addedData should have set field flat to '1'");
    this.areIdentical(12, view.getFieldValue('sub.x'), "addedData should have set field sub.x to 12");
    this.areIdentical('lala', view.getFieldValue('sub.s'), "addedData should have set field sub.s to 'lala'");

    view = view.withClearedField('sub.s');

    this.areIdentical('1', view.getFieldValue('flat'), "addedData should have set field flat to '1'");
    this.areIdentical(undefined, view.getFieldValue('sub.s'), "withClearedField should have set sub.s to undefined");
    this.areIdentical(12, view.getFieldValue('sub.x'), "withClearedField should have kept field sub.x set to 12");

    view = view.withClearedField('sub.x');

    this.areIdentical('1', view.getFieldValue('flat'), "addedData should have set field flat to '1'");
    this.areIdentical(undefined, view.getFieldValue('sub.s'), "withClearedField should have cleared sub.s");
    this.areIdentical(undefined, view.getFieldValue('sub.x'), "withClearedField should have cleared sub.x");
  }

  async testValidationRemovesAllMessages(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._tinyModel);

    view = view.withAddedData({
      a: null,
      r: '##' // minLength: 2
    });

    view = view.withStatusMessages([ { code: 'code', msg: 'message', severity: MessageSeverity.ERROR } ]);

    this.isFalse(view.isPageValid(), 'page should be invalid');

    view = await view.validateFull();

    this.isTrue(view.isFieldValid('a'), 'field a should be valid');
    this.isTrue(view.isFieldValid('r'), 'field r should be valid');

    this.isTrue(view.isPageValid(), 'page should be valid');
  }

  async testPageValidity(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedModel);

    view = view.withAddedData({
      aa: "_",
      ba: "_",
      ca: "_"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(-1), 'page -1 should be valid');
    this.isTrue(view.isPageValid(3), 'page 3 should be valid');
    this.isFalse(view.isPageValid(0), 'page 0 should not be valid');
    this.isFalse(view.isPageValid(1), 'page 1 should not be valid');
    this.isFalse(view.isPageValid(2), 'page 2 should not be valid');
    this.isFalse(view.isPageValid('c-cc'), 'page c-cc does not exist, should not be valid');
  }

  async testVisitedFields(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedModel);
    view = view.withAddedData({
      aa: "lala",
      ba: "l"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isTrue(view.isPageValid('aa'), 'page aa should be valid');
    this.isFalse(view.isPageValid(1), 'page 1 should be invalid');
    this.isFalse(view.isPageValid('ba'), 'page ba should not be valid');

    this.isTrue(view.arePagesUpToCurrentValid(), 'visited pages should be valid');
    this.isFalse(view.areVisitedPagesValid(), 'visited pages should be invalid');

    view = view.withAddedData({
      ba: "lolo"
    });

    view = await view.validateFull();

    this.isTrue(view.isPageValid(0), 'page 0 should be valid');
    this.isTrue(view.isPageValid(1), 'page 1 should be valid');
    this.isTrue(view.isPageValid('aa'), 'page aa should be valid');
    this.isTrue(view.isPageValid('ba'), 'page ba should be valid');
    this.isFalse(view.isPageValid('cc'), 'page cc still does not exist, should not be valid');
  }

  async testPageSkipping(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ba: null,
      ca: null
    });

    view = view.changePage(1);

    this.areIdentical(0, view.currentPageIndex);
    this.areIdentical(1, view.currentUnskippedPageNo, 'unskipped page no should be 1');
    this.areIdentical('c', view.getPageByUnskippedPageNo(1).alias);

    view = view.changePage(1);

    this.areIdentical(2, view.currentPageIndex);
    this.areIdentical(2, view.currentUnskippedPageNo, 'unskipped page no should be 2');
    this.areIdentical('a', view.getNextUnskippedPage(-1).alias);

    view = view.changePage(1);

    this.areIdentical(3, view.currentPageIndex);
  }
  async testFocusedPageSkippingPageA(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ab: "skip!",
      ba: null,
      ca: null
    });

    view = view.withFocusedPage('a');

    this.areIdentical('a', view.getFocusedPage().alias);
    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(0, view.getFocusedPageUnskippedPageNo());  // page 'a' is skipped itself
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(1, view.currentUnskippedPageNo);

    view = view.withAddedData({
      ab: "do not skip!"
    });

    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(2, view.currentUnskippedPageNo);

    view = view.withAddedData({
      aa: "do not skip!"
    });

    this.areIdentical(1, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());
    this.areIdentical('ac', view.currentPageAlias);
    this.areIdentical(3, view.currentPageNo);
    this.areIdentical(3, view.currentUnskippedPageNo);
  }

  async testFocusedPageSkippingPageC(): Promise<void> {
    var view: IModelView<any> = new ModelView(this._pagedSkippedPageModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: "skip!",
      ba: null,
      ca: null
    });

    view = view.withFocusedPage('c');

    this.areIdentical('c', view.getFocusedPage().alias);
    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(2, view.getFocusedPageUnskippedPageNo());

    view = view.withAddedData({
      ab: "skip!"
    });

    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(1, view.getFocusedPageUnskippedPageNo());

    view = view.withAddedData({
      aa: "do not skip!",
      ab: "do not skip!"
    });

    this.areIdentical(3, view.getFocusedPageNo());
    this.areIdentical(3, view.getFocusedPageUnskippedPageNo());
    
  }

  async testPageFlagsExist() {
    let view: IModelView<any> = new ModelView(this._flaggyModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = await view.changePage(1);

    this.areIdentical(0, view.currentPageIndex);
    this.areIdentical('a', view.currentPageAlias);

    const page = view.getPage();
    this.isTruthy(page);
    this.isTrue(page.flagExists('foo'), 'should have flag foo');
    this.isTrue(page.flagExists('bar'), 'should have flag bar');
    this.isTrue(page.flagExists('blah'), 'should have flag blah');

    this.isTrue(page.flagIsTrue('foo', {}), 'foo should be true');
    this.isFalse(page.flagIsTrue('bar', {}), 'bar should be false');
  }

  async testPageFlagsCheckValues() {
    var view: IModelView<any> = new ModelView(this._flaggyModel, {}, -1);

    this.areIdentical(-1, view.currentPageIndex);

    view = view.withAddedData({
      aa: '13',
      ab: ''
    });

    view = await view.changePage(1);

    this.areIdentical(0, view.currentPageIndex);
    this.areIdentical('a', view.currentPageAlias);

    const page = view.getPage();

    this.isTrue(page.flagIsTrue('blah', { aa: 13}), 'blah should be true for literal');
    this.isTrue(view.isPageFlagTrue('blah'), 'blah should be true for view');

    view = view.withAddedData({
      aa: '12',
      ab: ''
    });

    this.isFalse(view.isPageFlagTrue('blah'), 'blah should be false for view');

  }


  testGetFieldType() {
    const model = this._nestedModel;

    const viewmodel = new ModelView(model, {});

    const xFieldType = viewmodel.getFieldType('sub.x');
    this.isTrue(null != xFieldType, 'getFieldType("x") should not be null');
    this.areIdentical(xFieldType.kind, 'number', 'field type x should be number');
    const sFieldType = viewmodel.getFieldType('sub.s');
    this.isTrue(null != sFieldType, 'getFieldType("s") should not be null');
    this.areIdentical(sFieldType.kind, 'string', 'field type s should be string');

  }

  testGetFieldContainerTypeRoot() {
    const model = this._nestedModel;

    const viewmodel = new ModelView(model, {});

    const rootContainerFieldType = viewmodel.getFieldContainerType('sub');
    this.isTrue(null != rootContainerFieldType, 'getFieldContainerType("sub") should not be null');
    this.areIdentical(rootContainerFieldType, model, 'container type for root property should be model itself');
  }

  testGetFieldContainerType() {
    const model = this._nestedModel;

    const viewmodel = new ModelView(model, {});

    const subFieldType = viewmodel.getFieldType('sub');
    this.isTrue(null != subFieldType, 'getFieldType("sub") should not be null');
    this.areIdentical(subFieldType.kind, 'object', 'field type sub should be object');

    const subAsContainerFieldType = viewmodel.getFieldContainerType('sub.s');
    this.isTrue(null != subAsContainerFieldType, 'getFieldContainerType("sub.s") should not be null');
    this.areIdentical(subFieldType, subAsContainerFieldType, 'types for field sub and sub-as-container-of-s should be identical');
  }
}
