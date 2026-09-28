import { strict as assert } from 'node:assert';
import hooks, { parseListing } from '../index.mjs';

// Synthetic test-only values in the observed schema; never production data.
const row = {
  positionId: '900719925474099312345678901234567890',
  projectRuleId: '055bb05d-1957-4ea0-bb21-873ca0164d84',
  projectPositionName: '测试岗位', workPlaceCode: '佛山市',
  projectPositionDto: { positionName: '测试岗位', jobResponsibility: '测试职责', jobRequirement: '测试要求' },
};
const page = (rows = [row], total = rows.length) => ({ code: '0', data: { data: rows, total } });
const [job] = parseListing(page());
assert.equal(job.id, row.positionId);
assert.equal(job.title, row.projectPositionName);
assert.equal(job.company, '美的集团');
assert.equal(job.location, '佛山市');
assert.equal(job.description, '测试职责\n\n岗位要求\n测试要求');
assert.equal(new URL(job.url).searchParams.get('positionId'), row.positionId);
assert.deepEqual(parseListing(page([])), []);
assert.equal(parseListing(page([row, { ...row, positionId: 'second-id' }])).length, 2);
for (const bad of [null, {}, { code: '401' }, { code: '0', data: {} },
  page([], 1), page([row], 0), page([row], '1'), page([row, row]),
  page([{ ...row, positionId: 9007199254740992 }]),
  page([{ ...row, positionId: ' ' }]), page([{ ...row, projectRuleId: 'other' }]),
  page([{ ...row, workPlaceCode: null }]), page([{ ...row, projectPositionDto: {} }]),
  page(Array.from({ length: 11 }, (_, i) => ({ ...row, positionId: String(i) })))]) {
  assert.throws(() => parseListing(bad));
}
const entry = { name: '美的集团', careers_url: 'https://careers.midea.com/schoolOut/home', max_pages: 99 };
let calls = 0;
const ctx = { fetch: async (url, options) => {
  calls++;
  assert.equal(new URL(url).hostname, 'careers.midea.com');
  assert.equal(options.method, 'POST');
  assert.deepEqual(JSON.parse(options.body), { keyword: null, superiorIds: [], recruitCategoryIds: [], workPlaceCodes: [], projectRuleId: row.projectRuleId, pageIndex: 1, pageSize: 10 });
  assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
  return { ok: true, json: async () => page([row], 148) };
} };
assert.deepEqual(await hooks.provider.fetch(entry, ctx), [job]);
assert.equal(calls, 1);
await assert.rejects(hooks.provider.fetch({ ...entry, name: '其他企业' }, ctx));
assert.equal(calls, 1);
await assert.rejects(hooks.provider.fetch(entry, { fetch: async () => { throw new Error('timeout'); } }), /timeout/);
await assert.rejects(hooks.provider.fetch(entry, { fetch: async () => ({ ok: false, status: 401 }) }), /HTTP 401/);
await assert.rejects(hooks.provider.fetch(entry, { fetch: async () => ({ ok: true, json: async () => { throw new Error('non-JSON'); } }) }), /non-JSON/);
console.log('PASS: fixed fields, string IDs, empty/error/duplicate cases, one-page cap; zero network.');
