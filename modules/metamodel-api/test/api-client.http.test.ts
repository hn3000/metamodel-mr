
import * as http from 'http';

import { TestClass } from "@hn3000/tsunit-async";
import { IAPIClient } from "../src/api";
import { MetaApiClient, APIModelRegistry } from "../src/export";
import { apiModel, opNoParams, opWithParams, opFailure, opSingleParamAndResponse } from "./util-model";
import { IPropertyStatusMessage } from '@hn3000/metamodel';

export class ApiClientWithServerTest extends TestClass {
  private apiClient?: IAPIClient;
  private server?: http.Server;
  private listeningAddressP!: Promise<any>;

  private initCount = 0;

  setUp() {
    ++this.initCount;
    if (this.initCount > 1) {
      console.log(`multiple setUp calls detected: ${this.initCount}`);
    } else {
      const server = http.createServer((msg, res) => {
        console.log('request', msg.method, msg.url);
        res.setHeader('content-type', 'application/json');
        
        if (msg.url === '/base/op-no-params/') {
          res.write('"ok"');
        } else if (msg.url?.startsWith('/base/op/withParam')) {
          res.write(JSON.stringify({
            url: msg.url,
            method: msg.method,
            headers: msg.rawHeaders,
            body: msg.readableLength,
            status: 'ok'
          }));
          msg.read();
        } else if (msg.url?.startsWith('/schema/one')) {
          res.write(JSON.stringify({
            paths: {
              '/': {
                get: {

                }
              }
            }
          }));
        } else if (msg.url?.startsWith('/base/op-single-param-and-response/')) {
          const isOne = msg.url?.endsWith('/1');
          console.debug(`request for ${msg.url}, isOne: ${isOne}`);
          res.setHeader('content-type', 'application/json');
          res.write(JSON.stringify({
            a: isOne ? 1 : "something else",
            b: 'lala'
          }));
          msg.read();
        } else if (msg.url?.startsWith('/base/fail/')) {
          let parts = msg.url!.split('/');
          let status = +parts[3];
          res.writeHead(status, parts[4] || 'not ok');
        }
        res.end();
      });
  
      server.listen({ host: '127.0.0.1', port: null });
      this.server = server;
      this.listeningAddressP = new Promise((resolve, _reject) => {
        server.addListener('listening', () => {
          const x = server.address() as { port: number; }; // AddressInfo, we're using IP
          console.log('listening: ', x);
          resolve(`127.0.0.1:${x.port}`); // must match host above
        });
      });
    }
  }

  tearDown() {
    --this.initCount;
    if (this.initCount == 0) {
      if (null != this.server) {
        console.log(`shutting down server at `, this.server!.address());
        if (this.server) {
          this.server.removeAllListeners();
          this.server.close();
          this.server = undefined;
        }
      }
    } else {
      console.log(`server not shut down, initialized ${this.initCount+1} times`)
    }
  }

  async _url(path = '/') {
    const address = await this.listeningAddressP;
    const url = `http://${address}${path}`;
    return url;
  }

  async _client() {
    if (null == this.apiClient) {
      const url = await this._url();
      this.apiClient = new MetaApiClient(apiModel, url);
    }
    return this.apiClient;
  }

  async testFetchSchema() {
    const registry = new APIModelRegistry();
    const url = await this._url('/schema/one');
    const model = await registry.fetchModel(url, 'one');

    this.areIdentical('one', model.id);
  }

  async testSimpleRequest() {

    const client = await this._client();

    const result = await client.runOperation(opNoParams, {});

    this.isTrue(result.isSuccess(), `result: ${result.error()}`);
    this.areIdentical('ok', result.response(), `result not ok: ${JSON.stringify(result.response(), null, 2)}`);
  }

  async testSimpleRequestGoodResponse() {

    const client = await this._client();

    const result = await client.runOperation(opSingleParamAndResponse, { which: 1 });

    this.isTrue(result.isSuccess(), `result: ${result.error()}`);
    this.areIdentical(JSON.stringify({a:1, b:'lala'}), JSON.stringify(result.response()), `result not ok: ${JSON.stringify(result.response(), null, 2)}`);
  }

  async testSimpleRequestBadResponse() {

    const client = await this._client();

    const result = await client.runOperation(opSingleParamAndResponse, { which: -1 });

    this.isFalse(result.isSuccess(), `result: ${result.error()}`);
    this.areIdentical('invalid response received', result.error()?.message, result.toString());
    const resultText = result.toString();
    this.isTruthy(resultText.includes('a (value-invalid)'), `expected message about a, got ${resultText}`);
  }

  async testRunOperationForInvalidIdFails() {

    const client = await this._client();

    try {
      const result = await client.runOperationById('nope', {});
      this.fail();
    } catch (e) {
      this.isTrue(e instanceof Error);
    }

  }

  async testRequestWithParams() {

    const client = await this._client();


    const result = await client.runOperation(
      opWithParams, 
      { param: 'withParam', q: 'q', a: ['1','2'] }
    );

    this.isTrue(result.isSuccess(), `result: ${result.error()}`);

    const response = result.response();

    this.isTrue(null != response, 'response should not be null');

    this.areIdentical('ok', response.status, `result not ok: ${JSON.stringify(result.response(), null, 2)}`);
    this.areIdentical('POST', response.method, `method not POST: ${JSON.stringify(result.response(), null, 2)}`);
  }

  async testRequestWithBadParams() {

    const client = await this._client();


    const result = await client.runOperation(
      opWithParams, 
      { param: 'withParam', q: 'x', corpus: { a: 'a'  } }
    );

    this.isFalse(result.isSuccess(), `result: ${result.error()}`);
    this.areIdentical(result.error()?.message, 'parameter validation failed');
    const messages: IPropertyStatusMessage[] = (result.error() as any).messages;
    this.areIdentical(3, messages.length);
    this.areIdentical('required-empty', messages[0].code);
    this.areIdentical('value-invalid', messages[1].code);
    this.areIdentical('required-empty', messages[2].code);
    const resultText = result.toString();
    this.isTrue(resultText.includes('parameter validation failed:'), resultText);
    this.isTrue(resultText.includes('missing: a'), resultText);
    this.isTrue(resultText.includes('corpus.a (value-invalid)'), resultText);
    this.isTrue(resultText.includes('missing: corpus.b'), resultText);
  }
  async testRequestFailedWithErrorStatus() {
    const client = await this._client();


    const result = await client.runOperationById(opFailure.id, null);

    this.areIdentical(false, result.isSuccess())
    this.areIdentical('444', result.error()?.message);
  }
}