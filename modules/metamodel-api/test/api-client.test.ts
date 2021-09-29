
import { TestClass } from "tsunit.external/tsUnitAsync";
import { IAPIClient } from "../src/api";
import { MetaApiClient } from "../src/export";
import { apiModel, opNoParams, opWithParams } from "./util-model";

export class ApiClientTest extends TestClass {

  private apiClient!: IAPIClient;

  setUp() {
    this.apiClient = new MetaApiClient(apiModel, 'https://localhost/');
  }

  testApiClientCreatesURLForOperation() {
    let url = this.apiClient.urlForOperation(opNoParams, {});
    this.areIdentical('https://localhost/base/op-no-params/', url);
  }
  testApiClientCreatesURLForOperationId() {
    let url = this.apiClient.urlForOperationId(opNoParams.id, {});
    this.areIdentical('https://localhost/base/op-no-params/', url);
  }
  testApiClientURLFailsForInvalidOperationId() {
    let url = this.apiClient.urlForOperationId('nope', {});
    this.areIdentical(undefined, url);
  }
  testApiClientCreatesURLWithParamForOperation() {
    let url = this.apiClient.urlForOperation(opWithParams, { param: 4711, q: 'qqq', a: ['aAa', 'bBb'] });
    this.areIdentical('https://localhost/base/op/4711?q=qqq&a=aAa&a=bBb', url);
  }

  testApiClientUsesDefaultValues() {
      let client = new MetaApiClient(this.apiClient.model, this.apiClient.baseUrl);

      client.setDefaultValues({ param: 23, q: 'defaultQ'});
      let url = client.urlForOperation(opWithParams, { a: ['42']});
      this.areIdentical('https://localhost/base/op/23?q=defaultQ&a=42', url);

  }

  testApiClientDirectValueOverridesDefaultValue() {
      let client = new MetaApiClient(this.apiClient.model, this.apiClient.baseUrl);
  
      client.setDefaultValues({ param: 23, q: 'defaultQ'});
      client.addDefaultValues({ a: [ ]});
      let url = client.urlForOperation(opWithParams, { a: ['42']});
      this.areIdentical('https://localhost/base/op/23?q=defaultQ&a=42', url);

      url = client.urlForOperation(opWithParams, { });
      this.areIdentical('https://localhost/base/op/23?q=defaultQ', url);
  }
  testApiClientUsesDefaultHeaders() {
    let client = new MetaApiClient(this.apiClient.model, this.apiClient.baseUrl);

    client.setDefaultHeaders({ 'x-test-header': 'test-value'});
    let [url, requestInit] = client.requestInfoForOperation(opNoParams, { });
    this.areIdentical("test-value", (requestInit.headers as any)['x-test-header']);
  }
  testApiClientUsesAddedDefaultHeaders() {
    let client = new MetaApiClient(this.apiClient.model, this.apiClient.baseUrl);

    client.setDefaultHeaders({ 'x-test-header': 'test-value'});
    client.addDefaultHeaders({ 'x-test-header-too': 'test-value-too'});
    let [url, requestInit] = client.requestInfoForOperation(opNoParams, { });
    this.areIdentical("test-value", (requestInit.headers as any)['x-test-header']);
    this.areIdentical("test-value-too", (requestInit.headers as any)['x-test-header-too']);
  }
  testApiClientCreatesRequestInfoForOperation() {
    let requestInfo = this.apiClient.requestInfoForOperation(opNoParams, {});
    this.areIdentical('https://localhost/base/op-no-params/', requestInfo[0]);
    this.areIdentical(undefined, requestInfo[1].body);
    this.areIdentical('GET', requestInfo[1].method);
    this.areIdentical('cors', requestInfo[1].mode);
    this.areIdentical('Content-Type', Object.keys((requestInfo[1] as any).headers)[0]);
    this.areIdentical('application/json', (requestInfo[1] as any).headers['Content-Type']);
    //this.areIdentical('', JSON.stringify(requestInfo[1], null, 2));
  }
  testApiClientCreatesRequestInfoForOperationId() {
    let requestInfo = this.apiClient.requestInfoForOperationId(opNoParams.id, {});
    this.isTrue(undefined !== requestInfo, 'requestInfo should be defined');
    this.areIdentical('https://localhost/base/op-no-params/', requestInfo![0]);
  }
  testApiClientRequestInfoFailsForInvalidOperationId() {
    let requestInfo = this.apiClient.requestInfoForOperationId('nope', {});
    this.areIdentical(undefined, requestInfo);
  }
}
