import { strict as assert } from 'node:assert';
import hooks from '../index.mjs';

assert.equal(hooks.provider.id, 'company-366fdb82-50b1-44cf-880a-ff842560f54f');
const entry = { name: '得物', careers_url: 'https://campus.dewu.com/578078/position/list' };
// Isolated in-memory reader fixture; never imported by production.
const rows = [{ title: '测试职位', location: '上海、杭州', company: '得物',
  url: 'https://campus.dewu.com/578078/position/7684151037683681578/detail' }];
let calls = 0;
const result = await hooks.provider.fetch(entry, { browserJobs: async received => {
  calls++; assert.equal(received, entry); return rows;
} });
assert.equal(calls, 1); // no pagination or second reading
assert.equal(result, rows); // no renaming, invented description, filtering or precision loss
assert.equal(result[0].url.split('/').at(-2), '7684151037683681578');
for (const message of ['未读到岗位', '岗位名称、地点或官网链接结构变化', '同一岗位链接对应冲突内容', '页面要求登录或验证', '浏览器读取超过单页100条上限']) {
  const failure = new Error(message);
  await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => { throw failure; } }), e => e === failure);
}
await assert.rejects(hooks.provider.fetch(entry, {}), TypeError);
console.log('PASS: one reader call, exact fields/string URL, fail-closed reader errors; zero network');
