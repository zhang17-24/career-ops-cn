import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks from '../index.mjs';
// Test the actual platform parser, offline; never invoke its browser launcher.
import { extractBrowserListing, normalizeBrowserJobs, validateBrowserListing } from '../../../adapter-browser-listing.mjs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url)));
const spec = validateBrowserListing(manifest.browserListing, manifest.allowedHosts);
assert.equal(hooks.provider.id, manifest.id);
assert.equal(new URL(spec.listUrl).searchParams.get('current'), '1');
assert.equal(new URL(spec.listUrl).searchParams.get('limit'), '10');
const sample = {
  title: '校招-NVH主动降噪工程师', location: '上海、合肥',
  url: 'https://nio.jobs.feishu.cn/campus/position/7683735115122510134/detail',
};
const visible = text => ({ innerText: text, getClientRects: () => [{}] });
const anchor = {
  ...visible(''), tagName: 'A', href: sample.url,
  getAttribute: key => key === 'href' ? '/campus/position/7683735115122510134/detail' : null,
  querySelector: selector => {
    if (selector === '.positionItem-title-text') return visible(sample.title);
    if (selector === '.positionItem-subTitle > span:first-child') return visible(sample.location);
    return null;
  },
};
let anchors = [anchor];
let gates = [];
globalThis.getComputedStyle = () => ({ visibility: 'visible' });
globalThis.document = {
  title: '蔚来校招', body: { innerText: '职位' },
  querySelectorAll: selector => selector === 'a[data-id]' ? anchors : gates,
};
try {
  const rows = extractBrowserListing(spec);
  assert.deepEqual(rows, [sample]);
  const jobs = normalizeBrowserJobs(rows, manifest.allowedHosts, '蔚来');
  const entry = { name: '蔚来', careers_url: spec.listUrl };
  let calls = 0;
  const result = await hooks.provider.fetch(entry, { browserJobs: async actual => {
    calls++; assert.equal(actual, entry); return jobs;
  }});
  assert.equal(calls, 1);
  assert.deepEqual(result, [{ ...sample, company: '蔚来' }]);
  assert.ok(result[0].url.includes('/7683735115122510134/'));
  assert.ok(!Object.hasOwn(result[0], 'id'));
  anchors = [];
  assert.throws(() => extractBrowserListing(spec), /未读到岗位/);
  anchors = [anchor];
  assert.throws(() => extractBrowserListing({ ...spec, titleSelector: '.changed' }), /结构变化/);
  gates = [{ ...visible('登录'), matches: () => true }];
  assert.throws(() => extractBrowserListing(spec), /登录或验证/);
  gates = []; anchors = Array(101).fill(anchor);
  assert.throws(() => extractBrowserListing(spec), /100/);
  assert.throws(() => normalizeBrowserJobs([], manifest.allowedHosts, '蔚来'), /未确认/);
  assert.throws(() => normalizeBrowserJobs([{ ...sample, location: '' }], manifest.allowedHosts, '蔚来'), /字段无效/);
  assert.throws(() => normalizeBrowserJobs([sample, { ...sample, title: '冲突' }], manifest.allowedHosts, '蔚来'), /冲突/);
  await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('未确认'); } }), /未确认/);
} finally {
  delete globalThis.document;
  delete globalThis.getComputedStyle;
}
console.log('offline platform DOM parser + provider contract: passed; no network');
