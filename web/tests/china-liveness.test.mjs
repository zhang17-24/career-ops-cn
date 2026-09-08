import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLiveness } from '../../liveness-core.mjs';
test('Chinese expired banners win over apply buttons; captcha remains uncertain', () => {
  const base = { status: 200, requestedUrl: 'https://join.qq.com/post_detail.html?postid=123', finalUrl: 'https://join.qq.com/post_detail.html?postid=123' };
  for (const bodyText of ['该职位已下线', '您访问的页面没有找到']) assert.equal(classifyLiveness({ ...base, bodyText, applyControls: ['投递简历'] }).result, 'expired');
  assert.equal(classifyLiveness({ ...base, bodyText: '请先登录后查看' }).result, 'uncertain');
  assert.equal(classifyLiveness({ ...base, bodyText: '岗位描述：负责软件研发与技术架构。'.repeat(40), applyControls: ['投递简历'] }).result, 'active');
});
