import { strict as assert } from 'node:assert';
import p from '../index.mjs';
assert.equal(p.provider.id,'company-8d6ac54e-88e0-44f1-a512-85b02e158346');
const jobs=await p.provider.fetch({max_pages:1},{fetchJson:async()=>({code:0,result:{total:1,list:[{name:'测试工程师',id:'12345678901234567890',code:'test',workLocationDicts:[{name:'北京'}],positionStatusCode:'Release'}]}})});
assert.equal(jobs.length,1); assert.equal(jobs[0].title,'测试工程师'); assert.ok(jobs[0].url.includes('12345678901234567890'));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>({})}));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>{throw new Error('offline-test-error')}}));
console.log('offline fixture passed');
