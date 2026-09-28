import { strict as assert } from 'node:assert';
import hooks, { ENDPOINT, parseJobs } from '../index.mjs';
// Minimal public sample; synthetic long ID exercises string preservation only.
const row = { fromId: 'MJ036670', jobTitle: '数据分析师（技术方向）（2027届秋招）(MJ036670)', cityName: '上海' };
const payload = (rows, total = rows.length) => ({ retCode: '201', retValue: { total, recruitJobAdList: rows } });
let calls = 0;
const jobs = await hooks.provider.fetch({ name: '携程', max_pages: 99 }, {
  fetchJson: async (url, options) => {
    calls++;
    assert.equal(url, ENDPOINT);
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), {
      condition: { fromId: [], keyword: '', kind: [], country: [], city: [], bucode: [], jobFamilyCode: [], jobFamilyGroupCode: [], category: 2 },
      pager: { index: '1', size: '10' }, head: { language: 'zh_CN', version: '1' },
    });
    return payload([row], 56);
  },
});
assert.equal(calls, 1);
assert.deepEqual(jobs, [{ id: row.fromId, title: row.jobTitle, url: 'https://careers.ctrip.com/#/campus/job-detail/MJ036670', company: '携程', location: '上海' }]);
assert.deepEqual(parseJobs(payload([])), []);
const longId = 'MJ9007199254740993123456789';
assert.equal(parseJobs(payload([{ ...row, fromId: longId }]))[0].id, longId);
assert.equal(parseJobs(payload([row, { ...row, fromId: longId }])).length, 2);
for (const bad of [null, {}, { retCode: '401' }, payload([], 56), payload([row, row]), payload([{ ...row, fromId: 12 }]), payload([{ ...row, jobTitle: '' }]), payload([{ ...row, cityName: null }]), payload([{ ...row, fromId: '../x' }]), payload(Array(11).fill(row))]) assert.throws(() => parseJobs(bad));
await assert.rejects(hooks.provider.fetch({ name: '携程' }, { fetchJson: async () => { throw new Error('network unavailable'); } }), /network unavailable/);
console.log('PASS: mappings, string IDs, empty/error responses, duplicate IDs, one-page limit, no fallback; zero network');
