import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://talent.antgroup.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://talent.antgroup.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://talent.antgroup.com/jobs/1', company: '蚂蚁集团', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
