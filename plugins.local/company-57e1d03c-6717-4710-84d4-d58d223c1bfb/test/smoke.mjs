import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-57e1d03c-6717-4710-84d4-d58d223c1bfb');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://360campus.zhiye.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://360campus.zhiye.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://360campus.zhiye.com/jobs/1', company: '三六零', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
