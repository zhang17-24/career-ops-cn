// Text fragments are browser text locators, NOT invented company detail routes.
export function inlineJobUrl(listUrl, title, id) {
  const u = new URL(listUrl);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || listUrl.includes(':~:') || !title?.trim() || typeof id !== 'string' || !id.trim()) throw new Error('Invalid inline listing URL/title/ID');
  // careerops-id is our identity metadata in the fragment directive. It is NOT
  // an ATS query parameter, never reaches the HTTP server, and promises no UI expansion.
  return u.href + (u.hash ? '' : '#') + ':~:text=' + encodeURIComponent(title).replace(/-/g, '%2D') + '&careerops-id=' + encodeURIComponent(id);
}

export function validateInlineSamples(config, samples, allowedHosts, raw) {
  if (!config || !allowedHosts.includes(new URL(config.listUrl).hostname)) throw new Error('展开详情列表不在已审核域名内');
  for (const key of ['itemSelector', 'titleSelector', 'toggleSelector', 'bodySelector']) {
    if (typeof config[key] !== 'string' || !/^[a-z][a-z0-9-]*(?:\.[a-zA-Z_][\w-]*)*(?::first-child)?$/.test(config[key])) throw new Error('展开详情只支持实际观察到的简单标签/class选择器');
  }
  if (!/^data-[a-z][a-z0-9-]*$/.test(config.idAttribute)) throw new Error('展开详情需要公开 data 属性编号');
  const ids = new Set();
  for (const job of samples) {
    if (typeof job.id !== 'string' || !job.id || ids.has(job.id) || !raw.includes(job.id) || job.url !== inlineJobUrl(config.listUrl, job.title, job.id)) throw new Error('展开详情编号或文本定位链接未核对');
    ids.add(job.id);
  }
}

export async function verifyInlineDetail(page, config, job) {
  const items = page.locator(config.itemSelector);
  await items.first().waitFor({ state: 'visible', timeout: 10000 });
  let match;
  for (let i = 0; i < await items.count(); i++) {
    const item = items.nth(i);
    if (await item.getAttribute(config.idAttribute) === job.id) {
      if (match) throw new Error('重复的官网 DOM 岗位编号');
      match = item;
    }
  }
  if (!match) throw new Error('展开详情编号不匹配');
  const toggle = match.locator(config.toggleSelector);
  if (await toggle.count() !== 1) throw new Error('展开控件不唯一');
  const title = toggle.locator(config.titleSelector);
  if (await title.count() !== 1 || (await title.innerText()).trim() !== job.title) throw new Error('展开详情名称不匹配');
  // Never click an application link, submit button, or arbitrary candidate JS.
  if (!await toggle.evaluate(el => ['TR', 'SUMMARY'].includes(el.tagName) && !el.closest('form') && !/投递|申请|提交|登录|apply|submit|login/i.test(el.innerText))) throw new Error('不是只读展开控件');
  const body = match.locator(config.bodySelector);
  if (await body.count() !== 1) throw new Error('展开正文不唯一');
  // Start from the fresh list and click each sampled row once. A child of a
  // height:0/overflow:hidden panel can misleadingly report isVisible() = true.
  await toggle.click();
  await body.waitFor({ state: 'visible', timeout: 8000 });
  const text = await body.innerText();
  const normalize = value => value.replace(/\s+/g, '');
  if (!job.description || normalize(job.description).length < 50 || !/职责|描述|要求|资格/.test(text) || normalize(text) !== normalize(job.description)) throw new Error('展开正文与真实 API 描述不一致');
  if (page._blockedByGuard || page.url().split(':~:')[0] !== config.listUrl) throw new Error('展开后发生意外导航');
  return text;
}
