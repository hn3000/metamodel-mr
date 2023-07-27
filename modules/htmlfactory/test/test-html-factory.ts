
import { HTML, toKebabCase } from '../src/html-factory.js';
import { describe, it } from 'mocha';
import * as assert from 'assert';
import * as _delayedLogging from '@hn3000/mocha-delayed-logging';

describe('HTML', () => {
  it('creates nodes', () => {
    assert.notEqual(null, HTML.div());
    assert.ok(HTML.div() instanceof HTMLDivElement);
  })
});

describe('toKebabCase', () => {
  it('turns lower-case/upper-case boundaries into dashes', () => {
    assert.equal("a-bc-de-fg", toKebabCase("aBcDeFG"));
  })
});

