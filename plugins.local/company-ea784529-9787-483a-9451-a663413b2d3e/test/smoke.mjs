import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-ea784529-9787-483a-9451-a663413b2d3e');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://job.byd.com/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://job.byd.com/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://job.byd.com/jobs/1', company: '比亚迪', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
