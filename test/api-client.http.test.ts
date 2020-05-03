
import * as http from 'http';

import { TestClass } from "tsunit.external/tsUnitAsync";
import { IAPIClient } from "../src/api";
import { MetaApiClient, APIModelRegistry } from "../src/export";
import { apiModel, opNoParams, opWithParams, opFailure } from "./util-model";

export class ApiClientWithServerTest extends TestClass {
  private apiClient?: IAPIClient;
  private server?: http.Server;
  private listeningP!: Promise<any>;

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
        } else if (msg.url?.startsWith('/base/fail/')) {
          let parts = msg.url!.split('/');
          let status = +parts[3];
          res.writeHead(status, parts[4] || 'not ok');
        }
        res.end();
      });
  
      server.listen({ host: '127.0.0.1', port: null });
      this.server = server;
      this.listeningP = new Promise((resolve, _reject) => {
        server.addListener('listening', () => {
          const x = server.address() as { port: number; }; // AddressInfo, we're using IP
          console.log('listening: ', x);
          resolve(x.port);
        });
      });
    }
  }

  tearDown() {
    --this.initCount;
    if (this.initCount == 0) {
      if (null != this.server) {
        console.log(`shutting down`, this.server, this.server!.address());
        if (this.server) {
          this.server.removeAllListeners();
          this.server.close();
          this.server = undefined;
        }
      }
    } else {
      console.log(`server was null, initialized ${this.initCount} times`)
    }
  }

  async _url(path = '/') {
    const port = await this.listeningP;
    const url = `http://localhost:${port}${path}`;
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

  async testRequestFailedWithErrorStatus() {
    const client = await this._client();


    const result = await client.runOperationById(opFailure.id, null);

    this.areIdentical(false, result.isSuccess())
    this.areIdentical('444', result.error()?.message);
  }
}