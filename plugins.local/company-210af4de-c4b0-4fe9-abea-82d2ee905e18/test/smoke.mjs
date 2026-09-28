import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-210af4de-c4b0-4fe9-abea-82d2ee905e18');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://career.sina.com.cn/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://career.sina.com.cn/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://career.sina.com.cn/jobs/1', company: '新浪微博', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
