import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUrl as core } from '../../url-key.mjs';
import { normalizeUrl as web } from '../src/lib/core/url-key.mjs';

test('company hash routes retain distinct long job identities across core and web', () => {
  for (const prefix of ['https://campus.kuaishou.cn/#/campus/job-info/', 'https://campus.jd.com/#/details?id=']) {
    const a = prefix + '12345678901234567890', b = prefix + '12345678901234567891';
    assert.notEqual(core(a), core(b));
    assert.equal(core(a), web(a));
    assert.equal(core(a), core(a.replace('/#', '/?utm_source=test#')));
    assert.ok(core(a).includes('12345678901234567890'));
  }
  assert.equal(core('https://example.com/#/details?id=1'), core('https://example.com/#/details?id=2'));
});
