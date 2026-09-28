import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks, { preserveIds } from '../index.mjs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const spec = manifest.browserListing;
assert.equal(new URL(spec.listUrl).hostname, 'app-tc.mokahr.com');
assert.ok(manifest.allowedHosts.includes(new URL(spec.listUrl).hostname));
assert.equal(spec.identityText, '唯品会');
for (const key of ['linkSelector', 'titleSelector', 'locationSelector']) {
  assert.equal(typeof spec[key], 'string');
  assert.ok(spec[key].length && spec[key].length <= 200, key);
}
// 岗位详情路由必须与 preserveIds 校验的结构一致
assert.ok(spec.listUrl.includes('#/jobs'));

const base = 'https://app-tc.mokahr.com/campus-recruitment/vipshophr/10039#/job/';
const row = {
  title: '【2027届物流】物流总部校招生',
  url: base + '53bb03c1-8fcd-4cf2-bf80-b10af7ead4d0',
  company: '唯品会',
  location: '广东·广州市',
};

assert.equal(hooks.provider.id, 'company-56286487-d911-4432-9a84-da8a2a66dc74');

let calls = 0;
const entry = { name: '唯品会' };
const jobs = await hooks.provider.fetch(entry, {
  browserJobs: async (e) => { assert.equal(e, entry); calls += 1; return [row]; },
});
assert.equal(calls, 1);
assert.deepEqual(jobs, [{ ...row, id: '53bb03c1-8fcd-4cf2-bf80-b10af7ead4d0' }]);

// 长编号保持字符串，不经过 Number
assert.equal(
  preserveIds([{ ...row, url: base + '900719925474099312345' }])[0].id,
  '900719925474099312345',
);
assert.equal(preserveIds([row, { ...row, url: base + 'different-id' }]).length, 2);

for (const bad of [
  null,
  [],
  {},
  [row, row],
  Array(101).fill(row),
  [{ ...row, title: '' }],
  [{ ...row, location: '' }],
  [{ ...row, company: '其他' }],
  [{ ...row, url: 'https://example.com/job/1' }],
  [{ ...row, url: base }],
  [{ ...row, url: 'https://app-tc.mokahr.com/social-recruitment/vipshophr/1#/job/abc' }],
  [null],
]) assert.throws(() => preserveIds(bad));

await assert.rejects(
  hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('unconfirmed'); } }),
  /unconfirmed/,
);

console.log('PASS: offline fixture mapping, string IDs, duplicate IDs, empty/malformed data, single-page bound, error propagation. No network.');
