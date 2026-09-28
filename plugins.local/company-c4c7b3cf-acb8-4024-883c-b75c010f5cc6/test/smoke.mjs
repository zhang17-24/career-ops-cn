import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://hr.sohu.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://hr.sohu.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://hr.sohu.com/jobs/1', company: '搜狐', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
