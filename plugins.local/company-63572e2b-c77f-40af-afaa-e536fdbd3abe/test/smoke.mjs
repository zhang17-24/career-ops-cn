import { strict as assert } from 'node:assert';
import hooks, { parseJobs, LIST_URL, QUERY } from '../index.mjs';

// Offline fixtures only; synthetic long ID intentionally tests lossless handling.
const row = { id: '900719925474099312345', title: '测试岗位', addressDetailList: [{ addressDetail: '上海' }] };
const response = (list, total = list.length) => ({ code: 0, success: true, error: false, data: { list, total, pageNo: 1, pageSize: 10 } });
let calls = 0;
const jobs = await hooks.provider.fetch({}, { fetchJson: async (url, options) => {
  calls++;
  assert.equal(url, LIST_URL);
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'error');
  assert.deepEqual(options.headers, { 'content-type': 'application/json' });
  assert.deepEqual(JSON.parse(options.body), { pageNo: 1, pageSize: 10, channelDetailIds: [1], hireType: 1 });
  return response([row]);
} });
assert.equal(calls, 1);
assert.deepEqual(jobs, [{ id: row.id, title: row.title, url: `https://jobs.mihoyo.com/#/campus/position/${row.id}`, company: '米哈游', location: '上海' }]);
assert.deepEqual(parseJobs(response([])), []);
assert.equal(parseJobs(response(Array.from({length: 10}, (_, i) => ({ ...row, id: String(i + 1) })), 259)).length, 10);
for (const bad of [null, {}, { ...response([]), code: 401 }, { ...response([]), success: false },
  response([], 5), response([row], -1), response([row, row]), response([{ ...row, id: 123 }]),
  response([{ ...row, id: '../1' }]), response([{ ...row, title: '' }]), response([{ ...row, addressDetailList: [] }]),
  { ...response([row]), data: { ...response([row]).data, pageNo: 2 } }]) {
  assert.throws(() => parseJobs(bad));
}
await assert.rejects(hooks.provider.fetch({}, { fetchJson: async () => { throw new Error('network unavailable'); } }), /network unavailable/);
assert.equal(QUERY.pageSize, 10);
console.log('offline fixture passed: mapping, long IDs, empty, malformed, duplicates, pagination and request failure');
