import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-93624505-4f0e-42a0-b080-3000ee807031');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.163.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.163.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.163.com/jobs/1', company: '网易', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
