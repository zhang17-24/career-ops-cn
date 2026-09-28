import { strict as assert } from 'node:assert';
import hooks, { parseBeisen } from '../index.mjs';

// Synthetic, zero-network schema fixture; never imported by production.
const row = {
  Id: '900719925474099312345-abc',
  JobAdName: '测试岗位',
  CategoryId: '2',
  Status: 1,
  LocNames: ['广东省·广州市'],
  Duty: '测试职责',
  Require: '测试要求',
  PostDate: '0001-01-01T00:00:00',
};
const data = { Code: 200, Count: 30, Data: [row] };

let requests = 0;
const jobs = await hooks.provider.fetch(
  {},
  {
    fetchJson: async (url, options) => {
      requests++;
      assert.equal(url, 'https://miniso.zhiye.com/api/Jobad/GetJobAdPageList');
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.deepEqual(JSON.parse(options.body), {
        PageIndex: 0,
        PageSize: 20,
        Category: ['2'],
        KeyWords: '',
        SpecialType: 0,
        PortalId: '',
        DisplayFields: ['Category', 'Kind', 'LocId', 'WorkWeChatQrCode'],
      });
      return data;
    },
  }
);

assert.equal(requests, 1);
assert.deepEqual(jobs, [
  {
    id: row.Id,
    title: row.JobAdName,
    url: `https://miniso.zhiye.com/campus/detail?jobAdId=${encodeURIComponent(row.Id)}`,
    company: '名创优品',
    location: '广东省·广州市',
    description: '测试职责\n\n测试要求',
  },
]);

assert.deepEqual(parseBeisen({ Code: 200, Count: 0, Data: [] }), []);

for (const invalid of [
  null,
  {},
  { Code: 401, Count: 0, Data: [] },
  { Code: 200, Count: 1, Data: [] },
  { Code: 200, Count: 0, Data: null },
  { ...data, Data: [row, row] },
  { ...data, Data: Array(21).fill(row) },
]) {
  assert.throws(() => parseBeisen(invalid));
}

for (const patch of [
  { Id: 9007199254740992 },
  { Id: '' },
  { JobAdName: '' },
  { LocNames: null },
  { Duty: null },
  { Status: 0 },
  { CategoryId: '1' },
]) {
  assert.throws(() => parseBeisen({ ...data, Data: [{ ...row, ...patch }] }));
}

assert.equal(parseBeisen({ ...data, Data: [row, { ...row, Id: 'different-id' }] }).length, 2);

await assert.rejects(
  hooks.provider.fetch(
    {},
    { fetchJson: async () => { throw new Error('network unavailable'); } }
  ),
  /network unavailable/
);

console.log('PASS: mapping, string IDs, duplicates, empty/error, one-page limit, no network fallback');
