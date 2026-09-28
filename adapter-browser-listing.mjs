// Platform-owned, declarative, one-page DOM reader. No plugin script execution,
// clicks, user session, model, pagination, or guessed detail URLs.
import fs from 'node:fs';
import { rejectPrivateOrInvalid, validateUrlSecurity } from './liveness-browser.mjs';

export function listingUrl(value, hosts) {
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.port || rejectPrivateOrInvalid(value) || !hosts.includes(u.hostname)) throw new Error(`浏览器地址未获批准：${u.hostname}`);
  return u.href;
}

export function validateBrowserListing(spec, hosts) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Error('browserListing 配置无效');
  listingUrl(spec.listUrl, hosts);
  for (const key of ['linkSelector', 'titleSelector', 'locationSelector']) {
    if (typeof spec[key] !== 'string' || !spec[key].trim() || spec[key].length > 200) throw new Error(`缺少固定 DOM 选择器：${key}`);
  }
  if (typeof spec.identityText !== 'string' || spec.identityText.trim().length < 2 || spec.identityText.length > 100) throw new Error('缺少列表企业身份文字');
  return spec;
}

// Runs unchanged in the browser and in DOM fixture tests. Only visible anchors.
export function extractBrowserListing(spec) {
  const visible = e => e && e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
  const gates = [...document.querySelectorAll('input[type="password"], input[autocomplete="one-time-code"], iframe[src*="captcha"], [role="dialog"]')].filter(visible);
  if (gates.some(e => e.matches('input, iframe') || /登录|验证码|验证身份|安全验证/.test(e.innerText))) throw new Error('页面要求登录或验证，请用户操作；不自动重试');
  if (!document.body.innerText.includes(spec.identityText) && !document.title.includes(spec.identityText)) throw new Error('招聘页面企业身份不符');
  const links = [...document.querySelectorAll(spec.linkSelector)].filter(visible);
  if (!links.length) throw new Error('未读到岗位：可能加载失败、登录/验证码、空列表或选择器变化，不能判定为零岗位');
  if (links.length > 100) throw new Error('浏览器读取超过单页100条上限');
  return links.map(a => {
    const title = a.querySelector(spec.titleSelector);
    const location = a.querySelector(spec.locationSelector);
    if (a.tagName !== 'A' || !a.getAttribute('href') || !visible(title) || !visible(location)) throw new Error('岗位名称、地点或官网链接结构变化');
    return { title: title.innerText.trim(), location: location.innerText.trim(), url: a.href };
  });
}

export function normalizeBrowserJobs(rows, hosts, company) {
  const unique = new Map();
  for (const row of rows) {
    const url = listingUrl(row.url, hosts);
    if (!row.title || row.title.length > 500 || !row.location || row.location.length > 500) throw new Error('浏览器岗位字段无效');
    const old = unique.get(url);
    if (old && (old.title !== row.title || old.location !== row.location)) throw new Error('同一岗位链接对应冲突内容');
    unique.set(url, { title: row.title, url, location: row.location, company });
  }
  if (!unique.size || unique.size > 100) throw new Error('浏览器列表未确认或超出上限');
  return [...unique.values()];
}

// Compare source fields, not JSON serialization/order. A provider may preserve
// an ID taken verbatim from an observed URL segment, but cannot invent content.
export function assertBrowserJobsMatch(jobs, observed) {
  const fail = () => { throw new Error('适配器结果不能对应平台独立读取的列表'); };
  if (!Array.isArray(jobs) || !Array.isArray(observed) || jobs.length !== observed.length) fail();
  const byUrl = new Map(observed.map(j => [j.url, j]));
  const ids = new Set();
  for (const job of jobs) {
    const source = job && byUrl.get(job.url);
    if (!source || ['title', 'url', 'location', 'company'].some(k => job[k] !== source[k]) ||
        Object.keys(job).some(k => !['title', 'url', 'location', 'company', 'id'].includes(k))) fail();
    if (Object.hasOwn(job, 'id')) {
      const u = new URL(source.url);
      const route = u.hash.startsWith('#/') ? u.hash.slice(1).split(/[?&]/)[0] : u.pathname;
      const urlId = route.split('/').filter(Boolean).at(-1);
      if (typeof job.id !== 'string' || !job.id || job.id !== urlId || ids.has(job.id)) fail();
      ids.add(job.id);
    }
    byUrl.delete(job.url);
  }
}

export async function readBrowserListing(spec, hosts, company) {
  validateBrowserListing(spec, hosts);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }) });
  const deadline = setTimeout(() => { void browser.close(); }, 45000);
  try {
    const context = await browser.newContext({ locale: 'zh-CN', serviceWorkers: 'block', acceptDownloads: false });
    let blocked = '';
    // Every resource and redirect is checked, including scripts/CDNs. New hosts
    // need route approval, not a blanket exception for ATS vendors.
    await context.route('**/*', async route => {
      try {
        const url = route.request().url();
        listingUrl(url, hosts); await validateUrlSecurity(url);
        if (!['GET', 'POST', 'HEAD', 'OPTIONS'].includes(route.request().method())) throw new Error('非只读页面请求');
        await route.continue();
      } catch (e) { blocked ||= e.message; await route.abort(); }
    });
    const page = await context.newPage();
    context.on('page', p => { if (p !== page) void p.close(); });
    const response = await page.goto(spec.listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    if (!response?.ok()) throw new Error(`浏览器列表 HTTP ${response?.status() || '无响应'}`);
    try { await page.locator(spec.linkSelector).first().waitFor({ state: 'visible', timeout: 15000 }); }
    catch { throw new Error(blocked || '未读到岗位，请检查登录/验证码或页面结构；不自动重试'); }
    // A denied analytics request must not poison an otherwise readable list.
    // It stays blocked; missing required scripts still fail the DOM checks.
    listingUrl(page.url(), hosts);
    const rows = await page.evaluate(extractBrowserListing, spec);
    return normalizeBrowserJobs(rows, hosts, company);
  } finally { clearTimeout(deadline); await browser.close(); }
}
