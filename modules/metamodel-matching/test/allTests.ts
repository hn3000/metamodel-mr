import { assert } from 'chai';
import { matchMakerBuilder } from '../src';
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

      const best = mm.findBest(null, '', '', null);
      assert.isArray(best);
      assert.strictEqual(3, best[0], `expected entry 3, got ${JSON.stringify(best)}`);
    });
  })
})