import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://app-tc.mokahr.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://app-tc.mokahr.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://app-tc.mokahr.com/jobs/1', company: '唯品会', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
