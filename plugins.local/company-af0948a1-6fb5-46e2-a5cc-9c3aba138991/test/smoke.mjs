import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-af0948a1-6fb5-46e2-a5cc-9c3aba138991');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://talent.baidu.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://talent.baidu.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://talent.baidu.com/jobs/1', company: '百度', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
