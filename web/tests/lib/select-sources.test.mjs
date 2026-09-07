import { test } from 'node:test';
import assert from 'node:assert/strict';
import { selectCompanies } from '../../src/lib/core/select-sources.mjs';

test('new enabled plugins are selectable without adding their ids to core sources', () => {
  const companies = [{ name: '腾讯', provider: 'tenxun' }, { name: '另一家', provider: 'mokahr' }, { name: '手动', scan_method: 'websearch' }];
  assert.deepEqual(selectCompanies(companies, ['tenxun'], ['tenxun', 'mokahr']), [companies[0]]);
  assert.deepEqual(selectCompanies(companies, ['tenxun'], ['mokahr']), []);
  assert.deepEqual(selectCompanies(companies, [], ['tenxun']), []);
  assert.deepEqual(selectCompanies([{ ...companies[0], enabled: false }], ['tenxun'], ['tenxun']), []);
});
