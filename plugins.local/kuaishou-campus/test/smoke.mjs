import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'kuaishou-campus');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.kuaishou.cn/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.kuaishou.cn/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.kuaishou.cn/jobs/1', company: '快手', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
