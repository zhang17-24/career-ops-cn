import { strict as assert } from 'node:assert';
import hooks, { parseJobs, LIST_URL, DETAIL_URL_PREFIX } from '../index.mjs';

// Offline fixtures only. Synthetic UUIDs mirror the real string ID shape and are
// never treated as postings; production never imports fixtures.
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const open = (over = {}) => ({
  orgId: 'huya',
  id: id(1),
  title: '数据开发工程师',
  status: 'open',
  description: '<p>岗位职责：</p><p>1. 负责数据体系建设 &amp; 治理</p><script>alert(1)</script>',
  publishedAt: '2026-09-10T03:17:12.000Z',
  locations: [{ id: 1, province: '广东', city: '深圳市', country: '中国' }],
  ...over,
});
const response = (jobs, total = jobs.length, code = 0) => ({ code, msg: 'success', total, jobs });

let calls = 0;
const jobs = await hooks.provider.fetch({}, { fetchJson: async (url, options) => {
  calls++;
  assert.equal(url, LIST_URL);
  assert.deepEqual(options, { redirect: 'error' });
  return response([open()]);
} });
assert.equal(calls, 1);
assert.equal(hooks.provider.id, 'company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5');
assert.deepEqual(jobs, [{
  id: id(1),
  title: '数据开发工程师',
  url: `${DETAIL_URL_PREFIX}${id(1)}`,
  company: '虎牙',
  location: '深圳市',
  postedAt: Date.parse('2026-09-10T03:17:12.000Z'),
  description: '岗位职责：\n1. 负责数据体系建设 & 治理',
}]);

// String UUIDs stay lossless; multi-city, province fallback, missing date and
// paused rows are all handled without inventing postings.
const rows = [
  open(),
  open({ id: id(2), title: '高级后台开发工程师', locations: [{ city: '深圳市' }, { city: '广州市' }] }),
  open({ id: id(3), title: '暂停岗位', status: 'pause' }),
  open({ id: id(4), title: '海外岗位', locations: [{ province: '广东', city: '' }] }),
  open({ id: id(5), title: '无日期岗位', publishedAt: null, openedAt: '' }),
];
const multi = parseJobs(response(rows, 107));
assert.deepEqual(multi.map(j => j.title), ['数据开发工程师', '高级后台开发工程师', '海外岗位', '无日期岗位']);
assert.ok(multi.every(j => typeof j.id === 'string' && j.id.length === 36));
assert.equal(multi[1].location, '深圳市、广州市');
assert.equal(multi[2].location, '广东');
assert.equal(multi[3].postedAt, undefined);
assert.equal(parseJobs(response([], 0)).length, 0);

for (const bad of [null, undefined, 'jobs', [], { ...response([]), code: 401 }, { ...response([]), jobs: {} },
  response([], 5), response([open()], -1), response([open()], 0),
  response([open(), open()]), response([open({ id: 123 })]), response([open({ id: 'not-a-uuid' })]),
  response([open({ id: '../4195ef65-a1c3-4c15-b186-ff231a9ab568' })]),
  response([open({ title: '' })]), response([open({ title: '  ' })]), response([null]),
  response(Array.from({ length: 101 }, (_, i) => open({ id: id(i + 1) })), 200)]) {
  assert.throws(() => parseJobs(bad), `expected failure: ${JSON.stringify(bad)?.slice(0, 90)}`);
}
await assert.rejects(hooks.provider.fetch({}, { fetchJson: async () => { throw new Error('network unavailable'); } }), /network unavailable/);

console.log('offline fixture passed: mapping, string UUIDs, paused rows, multi-city, empty, malformed, duplicates, limit and request failure');
