import assert from 'node:assert';
import plugin, { parsePage } from '../index.mjs';
const row = {id:'90071992547409931234',positionName:'离线字段样本',workLocation:'上海',positionDescription:'测试职责',pushTime:'2026-09-07 16:43:42'};
const data = rows => ({code:0,data:{list:rows,total:rows.length}});
assert.equal(parsePage(data([row]))[0].url, 'https://jobs.bilibili.com/campus/positions/90071992547409931234');
assert.equal(parsePage(data([row]))[0].postedAt, Date.parse('2026-09-07T16:43:42+08:00'));
assert.equal(parsePage(data([row,row])).length,1);
assert.deepEqual(parsePage(data([])), []);
for(const p of [{code:-101},{code:0,data:{}},data([{...row,id:9007199254740992}]),data([{...row,id:'../bad'}]),data([{...row,positionName:''}]),{code:0,data:{list:[],total:1}}])assert.throws(()=>parsePage(p));
let calls=0;
const jobs=await plugin.provider.fetch({max_pages:99},{fetch:async(url,options)=>{
  calls++;
  if(calls===1){assert.ok(url.endsWith('/api/auth/v1/csrf/token'));assert.equal(options.headers['X-UserType'],'2');return new Response(JSON.stringify({code:0,data:'offline-only'}),{headers:{'set-cookie':'X-CSRF=offline-only; Path=/'}});}
  assert.equal(calls,2);assert.equal(options.headers['X-CSRF'],'offline-only');assert.equal(options.headers.Cookie,'X-CSRF=offline-only');
  assert.equal(JSON.parse(options.body).pageSize,10);assert.equal(JSON.parse(options.body).pageNum,1);
  return new Response(JSON.stringify(data([row])));
}});
assert.equal(calls,2);assert.equal(jobs.length,1);
await assert.rejects(plugin.provider.fetch({}, {fetch:async()=>new Response('{}',{status:503})}));
await assert.rejects(plugin.provider.fetch({}, {fetch:async()=>new Response(JSON.stringify({code:0,data:'offline-only'}))}));
console.log('PASS: fields, empty/error, long IDs, dedupe, one-page bound, anonymous initialization; zero network');
