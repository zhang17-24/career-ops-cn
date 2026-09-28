import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import hooks from '../index.mjs';
import { extractBrowserListing, normalizeBrowserJobs, assertBrowserJobsMatch } from '../../../adapter-browser-listing.mjs';

const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.json', import.meta.url)));
const spec = manifest.browserListing;
const entry = { name: '博世中国', careers_url: spec.listUrl };
// Minimal observed DOM shape; no network and no production fixture import.
const sample = { title: '端到端算法工程师（XC）', location: '江苏·苏州市 上海市', url: 'https://app.mokahr.com/campus-recruitment/bosch/168626?locale=zh-CN#/job/153e145f-3516-467b-93e2-aabe30ac8c5b' };
const visible = text => ({ innerText: text, getClientRects: () => [{}] });
const anchor = { ...visible(''), tagName: 'A', href: sample.url,
  getAttribute: key => key === 'href' ? '#/job/153e145f-3516-467b-93e2-aabe30ac8c5b' : null,
  querySelector: selector => ({ '.title-u2qk9xX9Ie': visible(sample.title), '.info-tPG_0QGbhl .sd-foundation-body-secondary-v3EXx:last-child .no-adaptive-tooltip': visible(sample.location) })[selector] };
let anchors = [anchor];
globalThis.getComputedStyle = () => ({ visibility: 'visible' });
globalThis.document = { title: '2027 博世中国校园招聘', body: { innerText: '' },
  querySelectorAll: selector => selector === '.jobs-AkItzswt6b a.link-txmgVOCVz9[href]' ? anchors : [] };
try {
  assert.deepEqual(extractBrowserListing(spec), [sample]);
  anchors = []; assert.throws(() => extractBrowserListing(spec), /未读到岗位/);
  anchors = Array(101).fill(anchor); assert.throws(() => extractBrowserListing(spec), /100条/);
  anchors = [{ ...anchor, querySelector: () => null }]; assert.throws(() => extractBrowserListing(spec), /结构变化/);
  anchors = [anchor]; document.title = '其他企业'; assert.throws(() => extractBrowserListing(spec), /身份不符/);
} finally { delete globalThis.document; delete globalThis.getComputedStyle; }
const observed = normalizeBrowserJobs([sample], manifest.allowedHosts, entry.name);
let calls = 0;
const jobs = await hooks.provider.fetch(entry, { browserJobs: async e => { assert.equal(e, entry); calls++; return observed; } });
assert.equal(calls, 1); assertBrowserJobsMatch(jobs, observed);
assert.equal(jobs[0].id, '153e145f-3516-467b-93e2-aabe30ac8c5b');
const long = { ...observed[0], url: sample.url.replace(jobs[0].id, '900719925474099312345') };
assert.equal((await hooks.provider.fetch(entry, { browserJobs: async () => [long] }))[0].id, '900719925474099312345');
for (const rows of [[], null, {}, Array(101).fill(observed[0]), [observed[0], observed[0]]]) {
  await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => rows }));
}
await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('登录或网络未确认'); } }), /未确认/);
assert.throws(() => normalizeBrowserJobs([{ ...sample, location: '' }], manifest.allowedHosts, entry.name));
assert.throws(() => normalizeBrowserJobs([{ ...sample, url: 'https://unapproved.example/job/1' }], manifest.allowedHosts, entry.name));
console.log('PASS: zero-network DOM contract, fields, ID, empty/malformed, duplicate, limit, failure propagation');
