import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import hooks from '../index.mjs';
// Test the actual platform parser; no browser, network, or fixture in production.
import { extractBrowserListing, normalizeBrowserJobs, validateBrowserListing } from '../../../adapter-browser-listing.mjs';

const manifest = JSON.parse(readFileSync(new URL('../manifest.json', import.meta.url)));
const { samples } = JSON.parse(readFileSync(new URL('./listing-observed.json', import.meta.url)));
const spec = manifest.browserListing;
validateBrowserListing(spec, manifest.allowedHosts);
const entry = { name: '金山办公', careers_url: spec.listUrl };
const fixture = samples.map(row => ({ ...row, company: entry.name }));
let calls = 0;
const result = await hooks.provider.fetch(entry, { browserJobs: async received => {
  assert.equal(received, entry); calls++; return fixture;
} });
assert.equal(calls, 1, 'one page only; no pagination or fallback');
assert.deepEqual(result.map(({ id, ...job }) => job), fixture);
assert.equal(result[0].id, '18e7ef00-1329-4766-baf0-b9f023c29e8b');
const run = rows => hooks.provider.fetch(entry, { browserJobs: async () => rows });
const long = '900719925474099312345678901';
const longJob = { ...fixture[0], url: fixture[0].url.replace(result[0].id, long) };
assert.equal((await run([longJob]))[0].id, long);
assert.equal((await run([fixture[0], longJob])).length, 2, 'same title with distinct IDs is valid');
await assert.rejects(run([fixture[0], fixture[0]]), /重复/);
await assert.rejects(run([]), /未确认/);
await assert.rejects(run({ data: 'opaque' }), /未确认/);
await assert.rejects(run(Array(101).fill(fixture[0])), /未确认/);
for (const change of [{title:''}, {location:''}, {company:'其他企业'}, {url:'https://unapproved.example/job/1'}, {url:spec.listUrl}]) {
  await assert.rejects(run([{...fixture[0], ...change}]), /结构变化/);
}
await assert.rejects(hooks.provider.fetch({name:'其他企业'}, {}), /身份/);
await assert.rejects(hooks.provider.fetch(entry, {browserJobs: async () => { throw new Error('页面验证未确认'); }}), /页面验证未确认/);

// A minimal DOM double checks the shared reader contract, not CSS layout.
// Exact selectors and browser layout were separately checked against the live page.
const visible = text => ({innerText:text, getClientRects:()=>[{}]});
let cards = samples.map(row => ({...visible(''), tagName:'A', href:row.url,
  getAttribute: key => key === 'href' ? new URL(row.url).hash : null,
  querySelector: selector => selector === spec.titleSelector ? visible(row.title) : selector === spec.locationSelector ? visible(row.location) : null,
}));
let gates=[];
globalThis.getComputedStyle = () => ({visibility:'visible'});
globalThis.document = {title:'金山办公软件 - 校园招聘', body:{innerText:'在招职位'},
  querySelectorAll: selector => selector === spec.linkSelector ? cards : gates};
assert.deepEqual(extractBrowserListing(spec), samples);
assert.deepEqual(normalizeBrowserJobs(samples, manifest.allowedHosts, entry.name), fixture);
const saved=cards;
cards=[]; assert.throws(()=>extractBrowserListing(spec), /未读到岗位/);
cards=Array(101).fill(saved[0]); assert.throws(()=>extractBrowserListing(spec), /上限/);
cards=[{...saved[0], querySelector:()=>null}]; assert.throws(()=>extractBrowserListing(spec), /结构变化/);
cards=saved; document.title='其他企业'; assert.throws(()=>extractBrowserListing(spec), /身份/);
document.title=spec.identityText;
gates=[{...visible('验证码'), matches:()=>true}]; assert.throws(()=>extractBrowserListing(spec), /登录或验证/);
assert.throws(()=>normalizeBrowserJobs([{...samples[0], url:'https://unapproved.example/'}], manifest.allowedHosts, entry.name), /未获批准/);
assert.throws(()=>normalizeBrowserJobs([samples[0], {...samples[0], title:'冲突'}], manifest.allowedHosts, entry.name), /冲突/);
delete globalThis.document; delete globalThis.getComputedStyle;
console.log('offline fixture passed: shared DOM reader, mapping, string IDs, duplicate rejection, gates, errors, single page; no network');
