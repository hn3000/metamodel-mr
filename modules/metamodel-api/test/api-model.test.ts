
import { TestClass } from "@hn3000/tsunit-async";
import { IAPIModel, IAPIModelBuilder } from "../src/api";
import { apiModel } from "./util-model";

export class ApiModelTest extends TestClass {

  testAddOperation() {
    const frozen: IAPIModel = apiModel.freeze();

    const builder: IAPIModelBuilder = apiModel.subModel(apiModel.operations().map(x => x.id).slice(1));
    const removedId = frozen.operations()[0].id;
    
    this.areIdentical(apiModel.operations().length, builder.operations().length + 1);
    this.areIdentical(frozen.operations().length, builder.operations().length + 1);
    this.isTruthy(apiModel.operationById(removedId));
    this.isTruthy(frozen.operationById(removedId));
    this.isFalsey(builder.operationById(removedId));

    builder.add(apiModel.operations()[0]);

    this.areIdentical(apiModel.operations().length, builder.operations().length);
    this.isTruthy(builder.operationById(removedId));
  }

  testRemoveOperationById() {
    const frozen: IAPIModel = apiModel.freeze();
    const builder: IAPIModelBuilder = apiModel.subModel(apiModel.operations().map(x => x.id));

    const removedId = builder.operations()[0].id;
    builder.remove(removedId);

    this.areIdentical(apiModel.operations().length, builder.operations().length + 1);
    this.isTruthy(apiModel.operationById(removedId));
    this.isTruthy(frozen.operationById(removedId));
    this.isFalsey(builder.operationById(removedId));
  }

  testRemoveOperation() {
    const frozen: IAPIModel = apiModel.freeze();
    const builder: IAPIModelBuilder = apiModel.subModel(apiModel.operations().map(x => x.id));

    const removed = builder.operations()[0];
    builder.remove(removed);

    const removedId = removed.id;

    this.areIdentical(apiModel.operations().length, builder.operations().length + 1);
    this.isTruthy(apiModel.operationById(removedId));
    this.isTruthy(frozen.operationById(removedId));
    this.isFalsey(builder.operationById(removedId));
  }

}
