import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { scanScopeKey } from '../../src/lib/explore-scan-scope.mjs';
test('only positive keyword changes can reuse scanned candidates', () => {
  const base = { ats: ['netease'], positive: ['工程师'], negative: [], allow: [], block: [], blockHard: [], alwaysAllow: [], sinceDays: 30, limitPerAts: 50 };
  assert.equal(scanScopeKey(base), scanScopeKey({ ...base, positive: ['运营'] }));
  for (const patch of [{ ats: ['bilibili'] }, { sinceDays: 7 }, { allow: ['上海'] }, { negative: ['外包'] }, { block: ['国外'] }, { blockHard: ['新加坡'] }, { alwaysAllow: ['远程'] }, { limitPerAts: 100 }]) assert.notEqual(scanScopeKey(base), scanScopeKey({ ...base, ...patch }));
  assert.equal(scanScopeKey({ ...base, ats: ['a','b'] }), scanScopeKey({ ...base, ats: ['b','a','b'] }));
  assert.equal(scanScopeKey(undefined), null);
});
