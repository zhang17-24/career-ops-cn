import { strict as assert } from 'node:assert';
import hooks, { parseListing } from '../index.mjs';

// Synthetic, zero-network schema fixture; never imported by production.
const row = { id: '9886', job_name: '后端开发工程师（AI团队定向）', base: '南京, 成都, 无锡 ', duty: '参与业务 Agent 及 Agent 平台能力开发', requirement: '2027届本科及以上学历' };
const fixture = rows => ({ list: rows, pageTotal: Math.ceil(rows.length / 10), curPage: '1', pageSize: 10, dataTotal: String(rows.length) });
const [job] = parseListing(fixture([row]));
assert.deepEqual(job, { id: '9886', title: row.job_name, url: 'https://join.fanruan.com/campus/detail?id=9886', company: '帆软', location: '南京, 成都, 无锡', description: `${row.duty}\n\n${row.requirement}` });
const longId = '9007199254740993123456789';
assert.equal(parseListing(fixture([{ ...row, id: longId }]))[0].id, longId);
assert.equal(parseListing(fixture([{ ...row, id: '0009886' }]))[0].id, '0009886');
assert.equal(parseListing(fixture([row, { ...row, id: '9871' }])).length, 2);
assert.deepEqual(parseListing(fixture([])), []);
for (const invalid of [null, {}, { list: [] }, { ...fixture([]), dataTotal: '24' }, { ...fixture([row]), curPage: '2' }, { ...fixture([row]), pageTotal: 9 }, { ...fixture([row]), pageSize: 0 }, { ...fixture([row]), dataTotal: 'NaN' }, fixture([row, row]), fixture([null])]) {
  assert.throws(() => parseListing(invalid));
}
for (const patch of [{ id: 9886 }, { id: '' }, { id: 'a/b' }, { job_name: '' }, { base: null }, { duty: '' }, { requirement: {} }]) {
  assert.throws(() => parseListing(fixture([{ ...row, ...patch }])));
}
const firstPage = { ...fixture(Array.from({length:10}, (_, i) => ({...row, id:String(i)}))), dataTotal:'24', pageTotal:3 };
let calls = 0;
const entry = { name:'帆软', careers_url:'https://join.fanruan.com/campus', max_pages:3 };
const jobs = await hooks.provider.fetch(entry, { fetchJson: async (url, options) => {
  calls++;
  assert.equal(url, entry.careers_url);
  assert.deepEqual(options, { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body:'filter=1&page=1&w=' });
  return firstPage;
}});
assert.equal(calls, 1);
assert.equal(jobs.length, 10);
await assert.rejects(hooks.provider.fetch(entry, { fetchJson: async () => { throw new Error('HTTP failure'); } }), /HTTP failure/);
await assert.rejects(hooks.provider.fetch(entry, { fetchJson: async () => '<html>login</html>' }), /结构异常/);
await assert.rejects(hooks.provider.fetch({...entry, name:'其他公司'}, {}), /仅支持/);
await assert.rejects(hooks.provider.fetch({...entry, careers_url:'https://join.fanruan.com/'}, {}), /仅支持/);
console.log('帆软 parser fixture passed; zero network; mapping, IDs, malformed/empty data, errors and one-page limit verified.');
