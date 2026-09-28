import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks from '../index.mjs';
import { extractBrowserListing, normalizeBrowserJobs, validateBrowserListing } from '../../../adapter-browser-listing.mjs';

// Zero-network DOM fixture; exercises the same fixed parser used in production.
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url), 'utf8'));
const spec = validateBrowserListing(manifest.browserListing, manifest.allowedHosts);
assert.equal(hooks.provider.id, manifest.id);
assert.equal(spec.listUrl, 'https://xiaopeng.jobs.feishu.cn/campus/position/list');
assert.deepEqual([spec.linkSelector, spec.titleSelector, spec.locationSelector],
  ['a[data-id]', '.positionItem-title-text', '.positionItem-subTitle > span:first-child']);
const sample = {title: '【27届校招】系统测试工程师', location: '广州、上海',
  url: 'https://xiaopeng.jobs.feishu.cn/campus/position/7684152748976523563/detail'};
const visible = (innerText) => ({innerText, getClientRects: () => [1]});
const anchor = (row) => ({...visible(''), tagName:'A', href:row.url,
  getAttribute: key => key === 'href' ? row.url : null,
  querySelector: selector => selector === spec.titleSelector ? visible(row.title)
    : selector === spec.locationSelector ? visible(row.location) : null});
let links = [anchor(sample)];
globalThis.getComputedStyle = () => ({visibility:'visible'});
globalThis.document = {title:'加入小鹏集团', body:{innerText:spec.identityText},
  querySelectorAll: selector => selector === spec.linkSelector ? links : []};
try {
  const rows = extractBrowserListing(spec);
  assert.deepEqual(rows, [sample]);
  const jobs = normalizeBrowserJobs(rows, manifest.allowedHosts, '小鹏汽车');
  assert.deepEqual(jobs, [{...sample, company:'小鹏汽车'}]);
  assert.equal(jobs[0].url.split('/').at(-2), '7684152748976523563');
  const entry = {name:'小鹏汽车', careers_url:spec.listUrl, max_pages:3};
  let calls = 0;
  assert.equal(await hooks.provider.fetch(entry, {browserJobs: async actual => {
    assert.equal(actual, entry); calls++; return jobs;
  }}), jobs);
  assert.equal(calls, 1); // No pagination even when entry asks for several pages.
  await assert.rejects(hooks.provider.fetch(entry, {browserJobs: async () => {
    throw new Error('unconfirmed');
  }}), /unconfirmed/);
  assert.throws(() => normalizeBrowserJobs([], manifest.allowedHosts, '小鹏汽车'));
  assert.throws(() => normalizeBrowserJobs([{...sample,title:''}], manifest.allowedHosts, '小鹏汽车'));
  assert.throws(() => normalizeBrowserJobs([{...sample,url:'https://unapproved.invalid/job'}], manifest.allowedHosts, '小鹏汽车'));
  links = [];
  assert.throws(() => extractBrowserListing(spec), /未读到岗位/);
  links = [anchor(sample)];
  links[0].querySelector = () => null;
  assert.throws(() => extractBrowserListing(spec), /结构变化/);
  links = Array.from({length:101}, () => anchor(sample));
  assert.throws(() => extractBrowserListing(spec), /上限/);
  document.body.innerText = '其他企业';
  assert.throws(() => extractBrowserListing(spec), /身份不符/);
} finally {
  delete globalThis.document;
  delete globalThis.getComputedStyle;
}
console.log('Feishu DOM fixture and provider delegation: passed (zero network)');
