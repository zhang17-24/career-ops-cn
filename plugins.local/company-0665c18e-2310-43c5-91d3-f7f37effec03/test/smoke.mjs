import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-0665c18e-2310-43c5-91d3-f7f37effec03');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.jd.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.jd.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.jd.com/jobs/1', company: '京东', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
