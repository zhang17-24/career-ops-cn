import { strict as assert } from 'node:assert';
import hooks, { parseJobs, ENDPOINT, REQUEST } from '../index.mjs';
// Synthetic minimal schema fixtures, deliberately isolated from production.
const row = { id: '90071992547409931234', fromId: 'MJ90071992547409931234', jobTitle: '测试岗位', cityName: '上海', requirements: '<p>测试职责</p>' };
const payload = rows => ({ retCode: '201', retValue: { total: rows.length, recruitJobAdList: rows } });
const jobs = parseJobs(payload([row]));
assert.equal(jobs[0].id, row.fromId);
assert.equal(jobs[0].url, `https://careers.ctrip.com/#/campus/job-detail/${row.fromId}`);
assert.equal(jobs[0].title, row.jobTitle);
assert.equal(jobs[0].location, '上海');
assert.equal(jobs[0].company, '携程');
assert.equal(jobs[0].description, row.requirements);
assert.deepEqual(parseJobs(payload([])), []);
for (const bad of [null, {}, {retCode:'401'}, payload([row,row]), payload([{...row,fromId:123}]), payload([{...row,id:123}]), payload([{...row,jobTitle:''}]), payload([{...row,requirements:null}]), {retCode:'201',retValue:{total:1,recruitJobAdList:[]}}, payload(Array(11).fill(row))]) assert.throws(()=>parseJobs(bad));
assert.equal(parseJobs(payload([row,{...row,fromId:'MJ2'}])).length,2);
let calls=0;
assert.deepEqual(await hooks.provider.fetch({}, {fetchJson:async(url,options)=>{
  calls++;assert.equal(url,ENDPOINT);assert.equal(options.method,'POST');assert.equal(options.redirect,'error');
  assert.deepEqual(JSON.parse(options.body),REQUEST);assert.deepEqual(REQUEST.pager,{index:'1',size:'10'});
  return payload([row]);
}}),jobs);
assert.equal(calls,1);
await assert.rejects(hooks.provider.fetch({}, {fetchJson:async()=>{throw new Error('network unavailable')}}),/network unavailable/);
console.log('PASS: mapping, string IDs, empty/error cases, duplicates, one-page cap, failure propagation; zero network');
