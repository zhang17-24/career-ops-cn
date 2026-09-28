import { strict as assert } from 'node:assert';
import p from '../index.mjs';
assert.equal(p.provider.id,'company-4a7cb652-4ea9-4487-a688-b4ff73e613b2');
const jobs=await p.provider.fetch({max_pages:1},{fetchJson:async()=>({success:true,body:{totalNumber:1,items:[{positionName:'测试工程师',publishId:'12345678901234567890',requirementVoList:[{workCity:'北京市-北京市'}]}]}})});
assert.equal(jobs.length,1); assert.equal(jobs[0].title,'测试工程师'); assert.ok(jobs[0].url.includes('12345678901234567890'));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>({})}));
await assert.rejects(p.provider.fetch({max_pages:1},{fetchJson:async()=>{throw new Error('offline-test-error')}}));
console.log('offline fixture passed');
