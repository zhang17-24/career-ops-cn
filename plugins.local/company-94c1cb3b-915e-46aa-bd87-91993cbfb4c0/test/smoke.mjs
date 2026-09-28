import { strict as assert } from 'node:assert';
import hooks from '../index.mjs';
let calls = 0;
const ctx = { fetchJson: async () => { calls++; throw new Error('Network forbidden in offline test'); } };
await assert.rejects(hooks.provider.fetch({}, ctx), /HTTP adapter blocked/);
assert.equal(calls, 0);
console.log('Offline fail-closed check passed; real parser fixture remains blocked.');
