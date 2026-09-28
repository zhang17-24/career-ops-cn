import assert from 'node:assert/strict';
import hooks from '../index.mjs';

// Offline safety check only. This is NOT parser or live acceptance.
let requests = 0;
globalThis.fetch = () => { throw new Error('Offline test forbids network'); };
assert.equal(hooks.provider.id, 'company-fb43b12a-c64c-4c78-bfa2-71b1834fca49');
await assert.rejects(
  hooks.provider.fetch({}, { fetchJson() { requests++; throw new Error('Unexpected request'); } }),
  /网易候选阻塞/,
);
assert.equal(requests, 0);
console.log('PASS: blocked candidate rejects without network or fabricated jobs; parser not implemented');
