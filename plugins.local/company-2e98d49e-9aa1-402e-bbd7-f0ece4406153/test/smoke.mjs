import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks, { preserveIds } from '../index.mjs';
import { extractBrowserListing, normalizeBrowserJobs, assertBrowserJobsMatch, validateBrowserListing } from '../../../adapter-browser-listing.mjs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const spec = validateBrowserListing(manifest.browserListing, manifest.allowedHosts);
const base = 'https://campus.didiglobal.com/campus_apply/didiglobal/96064#/job/';
// Isolated synthetic fixture: never read by production, no network.
const rows = [
  { title: '同名测试岗位', location: '上海市', url: base + '900719925474099312345' },
  { title: '同名测试岗位', location: '北京市', url: base + 'fixture-second' },
];
const node = innerText => ({ innerText, getClientRects: () => [{}] });
let anchors = rows.map(row => ({
  ...node(''), tagName: 'A', href: row.url, getAttribute: () => row.url,
  querySelector: s => s === spec.titleSelector ? node(row.title) : s === spec.locationSelector ? node(row.location) : null,
}));
globalThis.getComputedStyle = () => ({ visibility: 'visible' });
globalThis.document = {
  body: { innerText: '滴滴 校园招聘' }, title: '滴滴 - 校园招聘',
  querySelectorAll: s => s === spec.linkSelector ? anchors : [],
};
try {
  assert.deepEqual(extractBrowserListing(spec), rows);
  const observed = normalizeBrowserJobs(rows, manifest.allowedHosts, '滴滴');
  let calls = 0;
  const entry = { name: '滴滴' };
  const jobs = await hooks.provider.fetch(entry, { browserJobs: async actual => {
    assert.equal(actual, entry); calls++; return observed;
  } });
  assert.equal(calls, 1); // No pagination or extra requests.
  assert.equal(jobs[0].id, '900719925474099312345');
  assertBrowserJobsMatch(jobs, observed);
  assert.equal(jobs[0].title, jobs[1].title);
  for (const bad of [null, {}, [], [...observed, observed[0]], Array(101).fill(observed[0]),
    [{ ...observed[0], title: '' }], [{ ...observed[0], location: '' }],
    [{ ...observed[0], url: 'https://example.com/#/job/1' }],
    [{ ...observed[0], url: base }], [{ ...observed[0], url: base + '1?page=2' }]]) {
    assert.throws(() => preserveIds(bad));
  }
  await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('列表未确认'); } }), /列表未确认/);
  anchors = [];
  assert.throws(() => extractBrowserListing(spec), /未读到岗位/);
  anchors = [{ ...node(''), tagName: 'A', getAttribute: () => '#/job/1', querySelector: () => null }];
  assert.throws(() => extractBrowserListing(spec), /结构变化/);
} finally {
  delete globalThis.document; delete globalThis.getComputedStyle;
}
console.log('fixture: mapping, string IDs, duplicates, empty/malformed, reader errors and one-page delegation passed (zero network)');
