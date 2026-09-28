import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-b8bd62c1-c77f-421a-a565-63ffb577ed40');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://jobs.bilibili.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://jobs.bilibili.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://jobs.bilibili.com/jobs/1', company: '哔哩哔哩', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
