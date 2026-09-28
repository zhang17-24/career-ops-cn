import { strict as assert } from 'node:assert';
import plugin, { LIST_URL, parsePage } from '../index.mjs';
// Synthetic fixtures live only in this zero-network test.
globalThis.fetch = () => { throw new Error('test must not access network'); };
const row = { id: '12345678901234567890', projectId: 103, positionName: ' 测试岗位 ', workPlaceName: '杭州,北京', positionDescription: '职责', positionRequirement: '要求', updateTime: 1788926149000 };
const page = (list, total = list.length) => ({ code: 200, data: { list, total } });
const expected = { id: row.id, title: '测试岗位', company: '网易', url: `https://campus.163.com/app/detail/index?id=${row.id}&projectId=103`, location: '杭州,北京', description: '职责\n要求' };
assert.deepEqual(parsePage(page([row])), [expected]);
assert.equal(parsePage(page([{ ...row, id: 4845 }]))[0].id, '4845');
assert.deepEqual(parsePage(page([])), []);
assert.equal(parsePage(page([row, row])).length, 1);
for (const invalid of [{}, { code: 401 }, { code: 200, data: {} }, page([], 1), page([row], -1), page([row], '1'), page(Array(11).fill(row)), ...[
  { id: 9007199254740992 }, { id: {} }, { id: '1&x=2' }, { id: 0 }, { projectId: 102 }, { positionName: '' }, { workPlaceName: null }, { positionDescription: '' }, { positionRequirement: null },
].map(change => page([{ ...row, ...change }]))]) assert.throws(() => parsePage(invalid));
let calls = 0;
assert.deepEqual(await plugin.provider.fetch({ name: '网易', max_pages: 999, api: 'https://invalid.example' }, { fetchJson: async (url, options) => {
  calls++;
  assert.equal(url, LIST_URL);
  assert.deepEqual(options, { redirect: 'error' });
  return page([row], 77);
} }), [expected]);
assert.equal(calls, 1);
await assert.rejects(plugin.provider.fetch({}, { fetchJson: async () => { throw new Error('timeout'); } }), /timeout/);
await assert.rejects(plugin.provider.fetch({}, { fetchJson: async () => ({ code: 401 }) }));
await assert.rejects(plugin.provider.fetch({ name: '其他企业' }, {}), /仅支持网易/);
console.log('PASS: fields, string IDs, empty/malformed responses, duplicates, one-page limit, request failures; zero network');
