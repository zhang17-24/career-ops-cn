import { strict as assert } from 'node:assert';
import p from '../index.mjs';
assert.equal(p.provider.id,'company-dbbe8943-7e93-449c-bef8-1e820597a1e2');
const jobs=await p.provider.fetch({max_pages:1},{fetchJson:async()=>({success:true,statusCode:200,data:{total:1,list:[{positionName:'测试工程师',positionId:'12345678901234567890',recruitStatus:'in_recruitment',workplace:'北京'}]}})});
assert.equal(jobs.length,1); assert.equal(jobs[0].title,'测试工程师'); assert.ok(jobs[0].url.includes('12345678901234567890'));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>({})}));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>{throw new Error('offline-test-error')}}));
console.log('offline fixture passed');
