import { strict as assert } from 'node:assert';
import plugin, { parseListing } from '../index.mjs';

// Minimal offline schema fixture, never imported by production.
const row = { postId: '545e6823-28d2-4cb5-aba2-3c520a31b4e0', name: '北京-网络研发工程师(J100700)',
  workPlace: '北京市', publishDate: '2026-07-08', workContent: '负责网络平台研发\\n负责网络协议研发', serviceCondition: '本科及以上学历' };
const data = { recruitType: 'GRADUATE', pageNum: 1, pageSize: 10, total: 158, keyWord: '', projectType: '', listDetailData: [row] };
const html = value => '<title>百度校园招聘</title><script>window.__USE_SSR__=true; window.__INITIAL_DATA__ ={"detailData":{"projectType":undefined},"listData":' + JSON.stringify(value) + ',"indexData":{}}; window.prefix="/jobs";undefined</script>';
const jobs = parseListing(html(data));
assert.deepEqual(jobs, [{ id: row.postId, title: row.name, url: 'https://talent.baidu.com/jobs/detail/GRADUATE/' + row.postId,
  company: '百度', location: '北京市', postedAt: Date.parse('2026-07-08'), description: '工作职责：\n负责网络平台研发\n负责网络协议研发\n职责要求：\n本科及以上学历' }]);
const longId = '90071992547409931234567890';
assert.equal(parseListing(html({ ...data, listDetailData: [{ ...row, postId: longId }] }))[0].id, longId);
assert.equal(parseListing(html({ ...data, listDetailData: [row, { ...row, postId: longId }] })).length, 2);
assert.deepEqual(parseListing(html({ ...data, total: 0, listDetailData: [] })), []);
for (const bad of [null, {}, { ...data, listDetailData: null }, { ...data, listDetailData: [] },
  { ...data, listDetailData: [row, row] }, { ...data, listDetailData: [{ ...row, postId: 123 }] },
  { ...data, listDetailData: [{ ...row, postId: '../escape' }] }, { ...data, listDetailData: [{ ...row, name: '' }] },
  { ...data, listDetailData: [{ ...row, workContent: '' }] }, { ...data, pageNum: 2 }, { ...data, pageSize: 100 },
  { ...data, recruitType: 'INTERN' }, { ...data, total: 0 }, { ...data, keyWord: 'AI' }]) assert.throws(() => parseListing(html(bad)));
for (const bad of ['', '<title>登录</title>', html(data).replace('"listData":', '"changed":'), html(data) + html(data)]) assert.throws(() => parseListing(bad));
let calls = 0;
const ctx = { 'fetch': async (url, options) => {
  calls++;
  assert.equal(url, 'https://talent.baidu.com/jobs/list');
  assert.deepEqual(options, { redirect: 'error' });
  return { ok: true, text: async () => html(data) };
} };
assert.deepEqual(await plugin.provider.fetch({ name: '百度', max_pages: 100 }, ctx), jobs);
assert.equal(calls, 1);
await assert.rejects(plugin.provider.fetch({ name: '其他企业' }, ctx));
await assert.rejects(plugin.provider.fetch({}, { 'fetch': async () => ({ ok: false, status: 401 }) }), /HTTP 401/);
await assert.rejects(plugin.provider.fetch({}, { 'fetch': async () => { throw new Error('timeout'); } }), /timeout/);
console.log('百度 SSR fixture passed: fields, string IDs, duplicates, empty/error, one-page bound; zero network');
