import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-ea777bab-6a9d-4c6d-ba00-8d83311a3860');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.miniso.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.miniso.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.miniso.com/jobs/1', company: '名创优品', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
