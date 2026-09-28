import { strict as assert } from 'node:assert';
import hooks, { parseJobs } from '../index.mjs';
// Minimal public samples, exclusively offline. Never imported by production.
const base = 'https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/';
const rows = [
  ['27届秋招-数值策划（MMO）', '北京市', 'de498ba8-660d-4225-85cb-92a7fc892c0d'],
  ['27届秋招-角色原画（国风玄幻）', '北京市', '0e44b052-04aa-492e-a556-452bcc464c96'],
  ['27届秋招-品宣视觉设计师', '广东·广州市', 'aa63b164-3376-4ad1-a865-31eb772930b0'],
].map(([title, location, id]) => ({ title, location, url: base + id, company: '完美世界' }));
let calls = 0;
const entry = { name: '完美世界' };
const jobs = await hooks.provider.fetch(entry, { browserJobs: async value => { assert.equal(value, entry); calls++; return rows; } });
assert.equal(calls, 1);
assert.deepEqual(jobs, rows.map(row => ({ ...row, id: row.url.split('/').at(-1) })));
const longId = '900719925474099312345678901234567890';
assert.equal(parseJobs([{...rows[0], url: base + longId}])[0].id, longId);
assert.equal(parseJobs([{...rows[0], url: base + 'a'}, {...rows[0], url: base + 'b'}]).length, 2);
for (const invalid of [null, {}, [], [null], [rows[0], rows[0]], [{...rows[0], title:''}], [{...rows[0], location:''}], [{...rows[0], company:'other'}], [{...rows[0], url:base}], [{...rows[0], url:'https://example.com/job/1'}], Array(101).fill(rows[0])]) assert.throws(() => parseJobs(invalid));
await assert.rejects(hooks.provider.fetch(entry, {browserJobs: async () => {throw new Error('unconfirmed');}}), /unconfirmed/);
console.log('PASS: offline samples, field mapping, string IDs, same-title jobs, malformed/empty/duplicate/oversize failures, one-page delegation, error propagation');
