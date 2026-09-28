import { strict as assert } from 'node:assert';
import hooks, { LIST_URL, parseJobs } from '../index.mjs';

// Minimal public field sample; all fixtures stay offline and outside production.
const sample = { id: 18450, code: 'A250382', title: '高速选址运营实习生', location_title: '北京' };
const envelope = items => ({ code: 0, data: { page: 1, page_size: 10, total_count: items.length, total_pages: items.length ? 1 : 0, items } });
const input = envelope([sample]);
let requests = 0;
const result = await hooks.provider.fetch({ max_pages: 3 }, { fetchJson: async (url, options) => {
  requests++;
  assert.equal(url, LIST_URL);
  assert.deepEqual(options, { redirect: 'error' });
  return input;
} });
assert.equal(requests, 1);
assert.deepEqual(result, [{ id: '18450', title: sample.title, company: '理想汽车', location: '北京', url: 'https://www.lixiang.com/employ/detail/18450.html?jobCode=A250382&fromJob=1' }]);
assert.deepEqual(parseJobs(envelope([])), []);
assert.equal(parseJobs(envelope([{ ...sample, id: '900719925474099312345' }]))[0].id, '900719925474099312345');
assert.equal(parseJobs(envelope([sample, { ...sample, id: 18451 }])).length, 2);
for (const bad of [null, {}, { ...input, code: 401 }, { code: 0, data: {} },
  { code: 0, data: { ...input.data, page: 2 } },
  { code: 0, data: { ...input.data, total_count: 11 } },
  envelope([sample, sample]), envelope([null]),
  ...[9007199254740992, 0, '1e4', '', null].map(id => envelope([{ ...sample, id }])),
  envelope([{ ...sample, code: '../bad' }]), envelope([{ ...sample, title: '' }]),
  envelope([{ ...sample, location_title: null }])]) assert.throws(() => parseJobs(bad));
const full = Array.from({ length: 10 }, (_, i) => ({ ...sample, id: 18450 + i }));
assert.equal(parseJobs({ code: 0, data: { ...envelope(full).data, total_count: 1031, total_pages: 104 } }).length, 10);
await assert.rejects(hooks.provider.fetch({}, { fetchJson: async () => { throw new Error('network unavailable'); } }), /network unavailable/);
console.log('offline parser, IDs, errors and single-page checks passed');
