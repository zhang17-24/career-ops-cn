import { strict as assert } from 'node:assert';
import plugin, { parseMokaHtml, HOME, DOCUMENT } from '../index.mjs';

// Minimal public fields only. Synthetic edge cases below are test-only.
const row = { id: 'c3404b3e-9cb8-456f-a0df-cc89384f7255', title: '2025届校招- C端产品实习生（有转正机会）', status: 'open', zhineng: { id: 160479 }, locations: [{ country: '中国', cityId: 110105, address: '望京广顺南大街利星行中心F座4层' }], publishedAt: '2026-08-12T08:49:12.000Z' };
const fixture = (jobs, extra = {}) => '<input id="init-data" type="hidden" value="' + JSON.stringify({ org: { id: 'fenbi', name: '猿辅导集团' }, siteId: '47742', jobs, ...extra }).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '">';
const expected = { id: row.id, title: row.title, url: DOCUMENT + '#/job/' + row.id, company: '猿辅导', location: '中国 望京广顺南大街利星行中心F座4层', postedAt: 1786524552000 };
assert.deepEqual(parseMokaHtml(fixture([row])), [expected]);
assert.deepEqual(parseMokaHtml(fixture([])), []);
assert.deepEqual(parseMokaHtml(fixture([{ ...row, status: 'closed' }])), []);
assert.deepEqual(parseMokaHtml(fixture([{ ...row, zhineng: { id: 194054 } }])), []);
assert.equal(parseMokaHtml(fixture([{ ...row, id: '900719925474099312345', title: '测试 & <边界> "实体"', locations: [] }]))[0].id, '900719925474099312345');
assert.equal(parseMokaHtml(fixture([{ ...row, title: '测试 & <边界> "实体"' }]))[0].title, '测试 & <边界> "实体"');
for (const bad of [null, {}, [{ ...row, id: 9007199254740992 }], [row, row], [{ ...row, title: '' }], [{ ...row, status: 'unknown' }], [{ ...row, locations: null }], [{ ...row, publishedAt: '2026-03-04' }]]) assert.throws(() => parseMokaHtml(fixture(bad)));
assert.throws(() => parseMokaHtml(fixture([row], { org: { id: 'other', name: '其他' } })));
assert.throws(() => parseMokaHtml(fixture([row], { siteId: '1' })));
assert.throws(() => parseMokaHtml('<html>登录</html>'));
assert.throws(() => parseMokaHtml(fixture([row]) + fixture([row])));
assert.equal(parseMokaHtml(fixture([row, {...row, id:'different-id'}])).length, 2);
let calls = [];
const ctx = { 'fetch': async (url, options) => {
  calls.push({url,options});
  if (url === HOME) return new Response('', {status:302, headers:{location:DOCUMENT,'set-cookie':'anonymous_fixture=1; Path=/; Secure'}});
  assert.equal(url, DOCUMENT); assert.equal(options.headers.cookie, 'anonymous_fixture=1');
  return new Response(fixture([row]));
} };
assert.deepEqual(await plugin.provider.fetch({max_pages:999},ctx), [expected]);
assert.deepEqual(calls.map(x=>x.url), [HOME,DOCUMENT]); // one initialization + one page, never paginate
await assert.rejects(plugin.provider.fetch({}, {'fetch':async()=>{throw new Error('timeout')}}), /timeout/);
await assert.rejects(plugin.provider.fetch({}, {'fetch':async()=>new Response('',{status:401})}), /entrance/);
await assert.rejects(plugin.provider.fetch({}, {'fetch':async url=>url===HOME ? new Response('',{status:302,headers:{location:DOCUMENT,'set-cookie':'anonymous_fixture=1'}}) : new Response('',{status:302})}), /unconfirmed/);
console.log('PASS: offline HTML mapping, identity, string IDs, duplicates, empty/invalid data, bounded requests and failure propagation');
