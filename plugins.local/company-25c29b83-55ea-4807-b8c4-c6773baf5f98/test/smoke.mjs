import { strict as assert } from 'node:assert';
import hooks, { parseJobs, ENDPOINT, LIST_URL } from '../index.mjs';

// Minimal public sample; synthetic variants below exercise failure handling only.
const row = { id: '43b706c2-9d86-47de-a99d-fcd35405799f', name: 'AI Infra研发工程师',
  workLocationName: '上海', jobDuty: '大模型训练与推理基础设施研发', releaseTime: 1788315871000 };
const payload = (list, total = String(list.length)) => ({ success: true, errorCode: 1000000, result: { list, total } });
let calls = 0;
const jobs = await hooks.provider.fetch({ name: '拼多多', max_pages: 99 }, {
  fetchJson: async (url, options) => {
    calls++;
    assert.equal(url, ENDPOINT);
    assert.deepEqual(options, { method: 'POST', headers: { 'content-type': 'application/json' },
      body: '{"page":1,"pageSize":10,"t":null}', redirect: 'error' });
    return payload([row], '36');
  },
});
assert.equal(calls, 1);
assert.deepEqual(jobs, [{ id: row.id, title: row.name, url: `${LIST_URL}/detail?positionId=${row.id}`,
  company: '拼多多', location: '上海', description: row.jobDuty, postedAt: row.releaseTime }]);
assert.deepEqual(parseJobs(payload([])), []);
const long = '900719925474099312345678901234567890';
assert.equal(parseJobs(payload([{ ...row, id: long }]))[0].id, long);
assert.equal(parseJobs(payload([row, { ...row, id: long }])).length, 2); // Same title, distinct IDs.
for (const bad of [null, {}, { success: false }, { ...payload([]), errorCode: 401 },
  payload([], '36'), payload([row], '0'), payload([row], 'x'), payload([row, row]),
  payload(Array.from({ length: 11 }, (_, i) => ({ ...row, id: String(i) }))),
  ...[{ id: 123 }, { id: '' }, { id: '../bad' }, { name: '' }, { workLocationName: null },
    { jobDuty: '' }, { releaseTime: NaN }, { releaseTime: '1788315871000' }]
    .map(patch => payload([{ ...row, ...patch }]))]) assert.throws(() => parseJobs(bad), /PDD:/);
await assert.rejects(hooks.provider.fetch({ name: '拼多多' }, { fetchJson: async () => { throw new Error('network failed'); } }), /network failed/);
await assert.rejects(hooks.provider.fetch({ name: 'other' }, {}), /restricted/);
console.log('PDD offline fixture: mapping, string IDs, duplicates, empty/error/schema and one-page checks passed');
