import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tencentJobUrl } from '../src/lib/tencent-job-url.mjs';
test('repair obsolete Tencent links without losing long IDs or touching other sources', () => {
  const correct = 'https://join.qq.com/post_detail.html?postid=1282707398326592512';
  assert.equal(tencentJobUrl('https://join.qq.com/jobdesc.html?postId=1282707398326592512'), correct);
  for (const url of [correct, 'https://example.com/jobdesc.html?postId=123', 'invalid', 'https://join.qq.com/jobdesc.html']) assert.equal(tencentJobUrl(url), url);
});
