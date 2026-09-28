import assert from 'node:assert';
import providerHooks from '../index.mjs';

assert.equal(providerHooks.provider.id, 'company-ec6099d0-9c3a-4680-89b7-4133f2f16d10');
const jobs = await providerHooks.provider.fetch(
  { api: 'https://campus.zhipuai.cn/jobs' },
  { fetchJson: async () => ({ jobs: [{ title: '示例岗位', url: 'https://campus.zhipuai.cn/jobs/1', city: '上海' }] }) },
);
assert.deepEqual(jobs, [{ title: '示例岗位', url: 'https://campus.zhipuai.cn/jobs/1', company: '智谱AI', location: '上海', postedAt: undefined }]);
console.log('✓ provider fixture smoke ok');
