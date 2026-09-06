import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, '{{NAME}}');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://{{HOST}}/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://{{HOST}}/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://{{HOST}}/jobs/1', company: '{{COMPANY}}', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
