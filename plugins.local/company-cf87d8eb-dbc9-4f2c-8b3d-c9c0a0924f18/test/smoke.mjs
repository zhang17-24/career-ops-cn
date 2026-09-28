import { strict as assert } from 'node:assert';
import hooks, { preserveIds } from '../index.mjs';

// In-memory fixtures only: the production module imports no test data.
const base = 'https://app.mokahr.com/campus-recruitment/catlhr/148948#/job/';
const row = { title: '人才与组织发展研究员', location: '福建·宁德市', company: '宁德时代', url: base + '9dc94ac4-e805-433c-934e-dc0c0cd51590' };
const entry = { name: '宁德时代' };
let calls = 0;
const result = await hooks.provider.fetch(entry, { browserJobs: async received => {
  assert.equal(received, entry); calls++; return [row];
}});
assert.equal(calls, 1);
assert.deepEqual(result, [{ ...row, id: '9dc94ac4-e805-433c-934e-dc0c0cd51590' }]);
const longId = '9007199254740993123456789';
assert.equal(preserveIds([{ ...row, url: base + longId }])[0].id, longId);
assert.equal(preserveIds([row, { ...row, url: base + longId }]).length, 2);
for (const invalid of [[], null, {}, [null], [{ ...row, title: '' }], [{ ...row, location: '' }], [{ ...row, url: 'invalid' }], [{ ...row, url: base }], [row, row], Array(101).fill(row)]) {
  assert.throws(() => preserveIds(invalid));
}
await assert.rejects(hooks.provider.fetch(entry, { browserJobs: async () => { throw new Error('未确认'); } }), /未确认/);
assert.deepEqual(row, { title: '人才与组织发展研究员', location: '福建·宁德市', company: '宁德时代', url: base + '9dc94ac4-e805-433c-934e-dc0c0cd51590' });
console.log('offline fixture: fields, string IDs, same-title IDs, empty/malformed/duplicate/limit and reader failure passed; no network');
