import { assert } from 'chai';
import { MatchQ, matchMakerBuilder } from '../src';
import { ModelSchemaParser } from '@hn3000/metamodel';
require('@hn3000/mocha-delayed-logging');

describe('matchmakerBuilder', () => {
  describe('builds', () => {
    it('add copies original array', () => {
      const builder = matchMakerBuilder<number>([]);
      const mm1 = builder.freeze();
      builder.add(1, () => 1);
      const mm2 = builder.freeze();

      assert.isArray(mm1.getAll());
      assert.lengthOf(mm1.getAll(), 0);
      assert.isArray(mm2.getAll());
      assert.lengthOf(mm2.getAll(), 1);
    });
    it('finds best match', () => {
      const builder = matchMakerBuilder<number>([]);
      builder.add(1, () => 1);
      builder.add(3, () => 3);
      builder.add(2, () => 2);
      const mm = builder.freeze();

      const best = mm.findBest(undefined!, '', '', undefined);
      assert.isArray(best);
      assert.strictEqual(3, best[0], `expected entry 3, got ${JSON.stringify(best)}`);
    });
    it('matches by typename', () => {
      const schema = {
        id: 'model',
        type: 'object',
        properties: {
          text: { type: 'string' },
          num: { type: 'number' },
          arr: {
            type: 'array',
            items: { id: 'arrayItem', type: 'object', properties: {a: {type: 'string'}, b: {type: 'number'}}}
          }
        }
      };

      const registry = new ModelSchemaParser();
      const fullModel = registry.addSchemaObject(schema.id, schema);
      assert.isNotNull(fullModel);
      const arrayModel = fullModel.asCompositeType()!.itemType('arr');
      assert.isNotNull(arrayModel);
      const arrayItemModel = arrayModel.asCompositeType()!.itemType(0);
      assert.isNotNull(arrayItemModel);

      const builder = matchMakerBuilder<number>([]);
      builder.add(1, MatchQ.typeName('model'));
      builder.add(2, MatchQ.typeName('arrayItem'));
      builder.add(3, MatchQ.element(MatchQ.typeName('arrayItem')));
      const mm = builder.freeze();

      let best = mm.findBest(fullModel, '', '', undefined);
      assert.strictEqual(1, best[0], `expected entry 1, got ${JSON.stringify(best)}`);

      best = mm.findBest(arrayItemModel, '', '', undefined);
      assert.strictEqual(2, best[0], `expected entry 2, got ${JSON.stringify(best)}`);

      best = mm.findBest(arrayModel, '', '', undefined);
      assert.strictEqual(3, best[0], `expected entry 3, got ${JSON.stringify(best)}`);
    });
    it('matches by color', () => {
      const schema = {
        id: 'model',
        type: 'object',
        properties: {
          text: { type: 'string' },
          num: { type: 'number' },
          arr: {
            type: 'array',
            items: { id: 'arrayItem', type: 'object', properties: {a: {type: 'string'}, b: {type: 'number'}}}
          }
        }
      };

      const registry = new ModelSchemaParser();
      const fullModel = registry.addSchemaObject(schema.id, schema);
      assert.isNotNull(fullModel);
      const arrayModel = fullModel.asCompositeType()!.itemType('arr');
      assert.isNotNull(arrayModel);
      const arrayItemModel = arrayModel.asCompositeType()!.itemType(0);
      assert.isNotNull(arrayItemModel);

      const builder = matchMakerBuilder<number>([]);
      builder.add(1, MatchQ.typeName('model'));
      builder.add(2, MatchQ.typeName('arrayItem'));
      builder.add(3, MatchQ.element(MatchQ.typeName('arrayItem')));
      const mm = builder.freeze();

      let best = mm.findBest(fullModel, '', '', undefined);
      assert.strictEqual(1, best[0], `expected entry 1, got ${JSON.stringify(best)}`);

      best = mm.findBest(arrayItemModel, '', '', undefined);
      assert.strictEqual(2, best[0], `expected entry 2, got ${JSON.stringify(best)}`);

      best = mm.findBest(arrayModel, '', '', undefined);
      assert.strictEqual(3, best[0], `expected entry 3, got ${JSON.stringify(best)}`);
    });
  })
})