import { strict as assert } from 'node:assert';
import plugin, { parsePage } from '../index.mjs';
// Synthetic fixture stays in tests, never imported by production.
const row = { postId: '1282707398326592512', positionTitle: '测试工程师', workCities: '深圳  北京 ' };
const payload = { status: 0, data: { count: 1, positionList: [row] } };
const [job] = parsePage(payload);
assert.equal(job.url, 'https://join.qq.com/post_detail.html?postid=1282707398326592512');
assert.equal(job.location, '深圳 北京');
assert.equal(job.postedAt, undefined);
assert.deepEqual(parsePage({ status: 0, data: { count: 0, positionList: [] } }), []);
for (const bad of [{}, { status: -1 }, { status: 0, data: { count: 1, positionList: [] } }, { status: 0, data: { count: 1, positionList: [{ ...row, postId: Number(row.postId) }] } }]) assert.throws(() => parsePage(bad));
assert.equal(parsePage({ status: 0, data: { count: 2, positionList: [row, row] } }).length, 1);
let calls = 0;
await plugin.provider.fetch({ pageSize: 100, api: 'https://wrong.example' }, { fetchJson: async (url, options) => {
  calls++; assert.equal(url, 'https://join.qq.com/api/v1/position/searchPosition');
  assert.equal(options.redirect, 'error');
  const body = JSON.parse(options.body); assert.equal(body.pageSize, 10); assert.equal(body.pageIndex, 1); assert.deepEqual(body.projectMappingIdList, [1]);
  return payload;
} });
assert.equal(calls, 1);
await assert.rejects(plugin.provider.fetch({}, { fetchJson: async () => { throw new Error('HTTP 503'); } }), /503/);
console.log('Tencent smoke passed');

assert.equal(plugin.provider.id, 'company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b');
assert.deepEqual(job, {title: '测试工程师', company: '腾讯', location: '深圳 北京', url: 'https://join.qq.com/post_detail.html?postid=1282707398326592512'});
for (const patch of [{postId: ''}, {postId: '1&x=2'}, {positionTitle: ' '}, {workCities: null}]) {
  assert.throws(() => parsePage({status: 0, data: {count: 1, positionList: [{...row, ...patch}]}}));
}
for (const count of [-1, 0, 1.5, '1', null]) assert.throws(() => parsePage({status: 0, data: {count, positionList: [row]}}));
assert.throws(() => parsePage({status: 0, data: {count: 11, positionList: Array(11).fill(row)}}));
assert.equal(parsePage({status: 0, data: {count: 117, positionList: Array.from({length: 10}, (_, i) => ({...row, postId: String(9000 + i)}))}}).length, 10);
console.log('Extended validation and page-cap checks passed');
