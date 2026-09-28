import { strict as assert } from 'node:assert';
import hooks, { parseJobs, ENDPOINT, QUERY, LIST_URL } from '../index.mjs';

// Synthetic, in-memory fixtures only; no production response or network.
const row = (id, title = '测试岗位') => ({ id, postName: title, workCity: { desc: '厦门' }, jobStatus: '正常', description: '【岗位职责】负责系统开发和维护。'.repeat(6) });
const response = (list, count = list.length) => ({ success: true, status: 10010, data: { list, count } });
const input = response([row('900719925474099312345'), row('different-id')]);
const jobs = parseJobs(input);
assert.equal(jobs[0].id, '900719925474099312345');
assert.equal(jobs[0].title, jobs[1].title);
assert.notEqual(jobs[0].url, jobs[1].url);
assert.equal(jobs[0].company, '吉比特');
assert.equal(jobs[0].location, '厦门');
assert.equal(jobs[0].description, input.data.list[0].description);
assert.equal(jobs[0].url, LIST_URL + ':~:text=' + encodeURIComponent('测试岗位') + '&careerops-id=900719925474099312345');
assert.ok(parseJobs(response([row('x', 'A-B')]))[0].url.includes('A%2DB'));
assert.deepEqual(parseJobs(response([])), []);
for (const bad of [null, {}, { success: false }, { ...input, status: 401 }, response([], 2), response([], -1), response([], '0'), response(Array.from({length:21},(_,i)=>row(String(i)))), response([row('same'),row('same')]), response([row(123)]), response([row(' ')]), response([null])]) assert.throws(() => parseJobs(bad));
for (const change of [{ postName: '' }, { workCity: {} }, { description: '' }, { description: '<p>unexpected markup</p>' }, { jobStatus: '关闭' }]) assert.throws(() => parseJobs(response([{ ...row('x'), ...change }])));
let calls = 0;
const page = response(Array.from({length:20},(_,i)=>row(String(i))), 37);
const ctx = { fetchJson: async (url, options) => {
  calls++;
  assert.equal(url, ENDPOINT);
  assert.equal(options.method, 'POST');
  assert.equal(options.redirect, 'error');
  assert.equal(options.credentials, 'omit');
  assert.deepEqual(JSON.parse(options.body), QUERY);
  return page;
} };
assert.equal((await hooks.provider.fetch({ max_pages: 9 }, ctx)).length, 20);
assert.equal(calls, 1);
await assert.rejects(hooks.provider.fetch({}, { fetchJson: async () => { throw new Error('HTTP failure'); } }), /HTTP failure/);
console.log('PASS: mapping, string IDs, same titles, empty/errors, one-page limit; zero network');
