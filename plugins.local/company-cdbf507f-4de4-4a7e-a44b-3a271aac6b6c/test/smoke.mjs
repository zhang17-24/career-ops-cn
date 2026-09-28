import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks from '../index.mjs';
// Test the actual platform parser, read-only and without launching a browser.
import { extractBrowserListing, normalizeBrowserJobs, validateBrowserListing, assertBrowserJobsMatch } from '../../../adapter-browser-listing.mjs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const spec = manifest.browserListing;
assert.equal(spec.linkSelector, 'a[data-id][href^="/campus/position/"]');
assert.equal(spec.titleSelector, '.positionItem-title-text');
assert.equal(spec.locationSelector, '.positionItem-subTitle > span:first-child');
validateBrowserListing(spec, manifest.allowedHosts);
const entry = { name: 'Momenta', careers_url: spec.listUrl };
const fixture = [
  ['7670832645048125738', 'Data Infra Agent工程师(Mstar)', '北京'],
  ['7670832238527023370', '数据闭环研发工程师(Mstar)', '北京'],
  ['7660045500175632678', '训练推理优化工程师(Mstar)', '北京、上海、苏州'],
];
const node = text => ({ innerText: text, getClientRects: () => [1] });
const anchors = fixture.map(([id, title, location]) => ({
  ...node(''), tagName: 'A', href: `https://momenta.jobs.feishu.cn/campus/position/${id}/detail`,
  getAttribute: key => key === 'href' ? `/campus/position/${id}/detail` : id,
  querySelector: selector => selector === spec.titleSelector ? node(title) : selector === spec.locationSelector ? node(location) : null,
}));
let listed = anchors;
let gates = [];
globalThis.document = {
  title: 'Momenta Campus', body: { innerText: '开启新的工作（10）' },
  querySelectorAll: selector => selector === spec.linkSelector ? listed : gates,
};
globalThis.getComputedStyle = () => ({ visibility: 'visible' });
const rows = extractBrowserListing(spec);
const jobs = normalizeBrowserJobs(rows, manifest.allowedHosts, entry.name);
let calls = 0;
const result = await hooks.provider.fetch(entry, { browserJobs: async supplied => { assert.equal(supplied, entry); calls++; return jobs; } });
assert.equal(calls, 1); // one page, no pagination or HTTP fallback
assert.equal(result, jobs);
assertBrowserJobsMatch(result, jobs);
assert.deepEqual(result.map(j => j.url.split('/')[5]), fixture.map(j => j[0]));
assert.deepEqual(result.map(j => j.title), fixture.map(j => j[1]));
assert.deepEqual(result.map(j => j.location), fixture.map(j => j[2]));
assert.ok(result.every(j => !Object.hasOwn(j, 'id')));

listed = [];
assert.throws(() => extractBrowserListing(spec), /未读到岗位/);
listed = [ { ...anchors[0], querySelector: () => null } ];
assert.throws(() => extractBrowserListing(spec), /结构变化/);
listed = Array(101).fill(anchors[0]);
assert.throws(() => extractBrowserListing(spec), /100/);
listed = anchors;
gates = [{ ...node('验证码'), matches: () => true }];
assert.throws(() => extractBrowserListing(spec), /登录或验证/);
gates = [];
document.title = 'Unrelated tenant';
assert.throws(() => extractBrowserListing(spec), /身份不符/);
delete globalThis.document;
delete globalThis.getComputedStyle;

for (const invalid of [null, [], Array(101).fill(jobs[0]), [jobs[0], jobs[0]],
  [{...jobs[0], company:'Other'}], [{...jobs[0], location:''}],
  [{...jobs[0], title:null}], [{...jobs[0], url:'https://example.com/job'}],
  [{...jobs[0], url:jobs[0].url+'?changed=1'}]]) {
  await assert.rejects(() => hooks.provider.fetch(entry, {browserJobs: async () => invalid}));
}
const sameTitle = jobs.map(j => ({...j, title: jobs[0].title}));
assert.equal((await hooks.provider.fetch(entry, {browserJobs: async () => sameTitle})).length, 3);
await assert.rejects(() => hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('read timeout'); } }), /read timeout/);
assert.throws(() => normalizeBrowserJobs([{...rows[0], url:'https://example.com/job'}], manifest.allowedHosts, 'Momenta'), /批准/);
console.log('Momenta offline fixture passed: parser, fields, string IDs, errors, one-page delegation; zero network.');
