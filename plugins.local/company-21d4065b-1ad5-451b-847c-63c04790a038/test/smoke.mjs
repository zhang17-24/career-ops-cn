import { strict as assert } from 'node:assert';
import providerHooks from '../index.mjs';

// Synthetic, in-memory fixtures only; never imported by production.
const entry = { name: '阿里巴巴' };
const sample = { title: '测试岗位', location: '杭州', company: '阿里巴巴', url: 'https://campus-talent.alibaba.com/campus/position/90071992547409931234?deptCodes=' };
const run = rows => providerHooks.provider.fetch(entry, { browserJobs: async received => { assert.equal(received, entry); return rows; } });
assert.equal(providerHooks.provider.id, 'company-21d4065b-1ad5-451b-847c-63c04790a038');
assert.deepEqual(await run([sample]), [{ ...sample, id: '90071992547409931234' }]);
assert.equal((await run([sample, {...sample, url: 'https://campus-talent.alibaba.com/campus/position/2?deptCodes='}])).length, 2);
for (const rows of [[], null, {}, [sample, sample], Array(101).fill(sample), [{...sample,title:''}], [{...sample,location:null}], [{...sample,company:'其他'}], [{...sample,url:'https://example.com/campus/position/1'}], [{...sample,url:'https://campus-talent.alibaba.com/other/1'}]]) {
  await assert.rejects(() => run(rows));
}
await assert.rejects(() => providerHooks.provider.fetch(entry, {browserJobs: async () => { throw new Error('unconfirmed'); }}), /unconfirmed/);
console.log('provider offline fixtures passed: mapping, string IDs, duplicates, empty/malformed data, one-page cap, propagated errors');
