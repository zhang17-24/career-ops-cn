import { strict as assert } from 'node:assert';
import hooks, { parseJobs } from '../index.mjs';

// In-memory synthetic fixture only. No network, browser, or production fallback.
const row = { title: 'fixture title', location: '北京市', company: '完美世界',
  url: 'https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/900719925474099312345' };
const expected = { ...row, id: '900719925474099312345' };
assert.deepEqual(parseJobs([row]), [expected]);
assert.deepEqual(parseJobs([row, {...row, url: row.url + '1'}]).map(j=>j.id), [expected.id, expected.id+'1']);
for (const bad of [null, {}, [], [null], [{...row,title:''}], [{...row,location:''}],
  [{...row,company:'other'}], [{...row,url:row.url.replace('pwrd','other')}],
  [{...row,url:row.url.replace('https:','http:')}], [{...row,url:'https://example.com/'}],
  [row,row], Array(101).fill(row)]) assert.throws(()=>parseJobs(bad));
let calls=0; const entry={name:'完美世界'};
assert.deepEqual(await hooks.provider.fetch(entry,{browserJobs:async actual=>{assert.equal(actual,entry);calls++;return [row];}}),[expected]);
assert.equal(calls,1); // One page; no pagination or alternate endpoint.
await assert.rejects(hooks.provider.fetch(entry,{browserJobs:async()=>{throw new Error('unconfirmed');}}),/unconfirmed/);
console.log('PASS: offline mapping, string IDs, duplicate/malformed/empty failure, single reader call, error propagation');
