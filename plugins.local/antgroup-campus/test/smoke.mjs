import { strict as assert } from 'node:assert';
import plugin, { parsePage } from '../index.mjs';
// Synthetic data is isolated here and never imported by the production module.
const row = { id: '9007199254740993123', name: '测试岗位', workLocations: ['杭州', '北京'], description: '测试职责', requirement: '测试要求', publishTime: '2026-07-22T02:16:23.000+00:00' };
const response = rows => ({ success: true, errorCode: 'success', totalCount: rows.length, content: rows });
const [job] = parsePage(response([row]));
assert.equal(job.url, 'https://talent.antgroup.com/campus-position?positionId=9007199254740993123');
assert.equal(job.location, '杭州、北京');
assert.equal(job.postedAt, Date.parse(row.publishTime));
assert.equal(parsePage(response([{ ...row, id: 260721010991745 }]))[0].url.endsWith('260721010991745'), true);
assert.deepEqual(parsePage(response([])), []);
assert.equal(parsePage(response([row, row])).length, 1);
for (const bad of [{}, { ...response([]), success: false }, { ...response([]), totalCount: 2 }, response([{ ...row, id: Number(row.id) }]), response([{ ...row, name: '' }]), response([{ ...row, workLocations: [] }]), response([{ ...row, publishTime: 'bad' }]), response(Array(11).fill(row))]) assert.throws(() => parsePage(bad));
let calls = 0;
await plugin.provider.fetch({ max_pages: 50, api: 'https://wrong.example' }, { fetchJson: async (url, options) => {
  calls++; assert.equal(url, 'https://hrcareersweb.antgroup.com/api/campus/position/search');
  assert.equal(options.redirect, 'error'); assert.deepEqual(Object.keys(options.headers), ['Content-Type']);
  const body = JSON.parse(options.body); assert.equal(body.pageIndex, 1); assert.equal(body.pageSize, 10); assert.equal(body.key, '');
  return response([row]);
} });
assert.equal(calls, 1);
await assert.rejects(plugin.provider.fetch({}, { fetchJson: async () => { throw new Error('HTTP 503'); } }), /503/);
console.log('Antgroup smoke passed');
