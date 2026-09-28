import { strict as assert } from 'node:assert';
import plugin, { bundleUrl, parseBundle } from '../index.mjs';

// Minimal synthetic data follows the observed public object structure. No network.
const entry = 'https://talent.deepseek.com/';
const main = entry + 'static/main.123.js';
const html = '<title>DeepSeek 招聘</title><script defer src="/static/main.123.js"></script>';
const id = '900719925474099312345';
const job = { id, title: 'Fixture engineer', locations: ['北京市'], descriptionHtml: '<p>Build &amp; test "systems". It\'s useful.</p>', detailUrl: 'https://app.mokahr.com/social-recruitment/high-flyer/140576#/job/' + id };
const base = { crawledAt: '2026-09-07T06:09:32.312Z', sourceUrl: 'https://app.mokahr.com/social-recruitment/high-flyer/140576#/', total: 1, jobs: [job] };
const bundle = data => "var x=JSON.parse('" + JSON.stringify(data).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "');";
const result = parseBundle(bundle(base));
assert.equal(result[0].id, id);
assert.equal(result[0].title, job.title);
assert.equal(result[0].url, job.detailUrl);
assert.equal(result[0].company, '深度求索DeepSeek');
assert.equal(result[0].location, '北京市');
assert.equal(result[0].description, 'Build & test "systems". It\'s useful.');
assert.equal(result[0].postedAt, undefined);
assert.deepEqual(parseBundle(bundle({ ...base, total: 0, jobs: [] })), []);
for (const data of [{ ...base, total: 2 }, { ...base, jobs: null }, { ...base, sourceUrl: 'https://example.com/' }, { ...base, crawledAt: '' }, { ...base, total: 2, jobs: [job, job] }]) assert.throws(() => parseBundle(bundle(data)));
for (const change of [{id:9007199254740992}, {title:''}, {locations:[]}, {descriptionHtml:''}, {detailUrl:'https://example.com/#/job/'+id}, {detailUrl:job.detailUrl+'/apply'}, {detailUrl:job.detailUrl.replace(id,'other')}, {detailUrl:job.detailUrl.replace('app.mokahr.com','user@app.mokahr.com')}]) assert.throws(() => parseBundle(bundle({...base,jobs:[{...job,...change}]})));
assert.throws(() => parseBundle('<html>Login</html>'));
assert.throws(() => parseBundle(bundle(base)+bundle(base)));
assert.throws(() => parseBundle(bundle({...base,total:501,jobs:Array(501).fill(job)})));
assert.equal(bundleUrl(html), main);
for (const bad of ['',html.replace('/static/main.123.js','https://evil.example/static/main.123.js'),html+html]) assert.throws(() => bundleUrl(bad));
let requests = [];
const ctx = { 'fetch': async (url, options) => {
  requests.push(url);
  assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
  assert.ok([entry,main].includes(url));
  return {ok:true,text:async()=>url===entry?html:bundle(base)};
}};
assert.deepEqual(await plugin.provider.fetch({name:'深度求索DeepSeek',max_pages:3},ctx), result);
assert.deepEqual(requests,[entry,main]); // one published list snapshot, no pagination/detail fan-out
await assert.rejects(plugin.provider.fetch({name:'Other'},ctx),/only DeepSeek/);
for (const status of [401,404,500]) await assert.rejects(plugin.provider.fetch({}, { 'fetch':async()=>({ok:false,status}) }),new RegExp('HTTP '+status));
await assert.rejects(plugin.provider.fetch({}, { 'fetch':async()=>{throw new Error('timeout');} }),/timeout/);
console.log('PASS: offline mapping, long string ID, escapes, empty/malformed data, pagination bound, URL safety, HTTP errors, two-request flow');
