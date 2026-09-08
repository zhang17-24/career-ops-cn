import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchJobKeyword as match } from '../src/lib/job-keywords.mjs';
test('local related terms widen recall without arbitrary engineer or substring matches', () => {
  assert.equal(match('Agent开发工程师', ['人工智能']).kind, 'related');
  assert.equal(match('AI全栈工程师', ['大模型']).kind, 'related');
  assert.equal(match('Frontend Engineer', ['前端']).kind, 'related');
  assert.equal(match('后端研发工程师', ['前端']).kind, 'none');
  assert.equal(match('Retail Engineer', ['AI']).kind, 'none');
  assert.equal(match('机械工程师', ['软件工程师']).kind, 'none');
  assert.equal(match('AI产品经理', ['大模型', '产品经理']).kind, 'exact');
  assert.equal(match('任何岗位', []).kind, 'all');
  assert.equal(match('C++开发', ['C++']).kind, 'exact');
});
