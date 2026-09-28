import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-7c6cead4-b646-4a36-9c35-a26ae021da9d');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://hr.sohu.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://hr.sohu.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://hr.sohu.com/jobs/1', company: '搜狐', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
