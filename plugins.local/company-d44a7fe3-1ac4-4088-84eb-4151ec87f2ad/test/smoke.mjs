import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.miniso.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.miniso.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.miniso.com/jobs/1', company: '名创优品', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
