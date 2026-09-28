import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';
import { validateBrowserListing, listingUrl, extractBrowserListing, normalizeBrowserJobs, assertBrowserJobsMatch } from '../../adapter-browser-listing.mjs';
import { buildCtx } from '../../plugins/_engine.mjs';

const hosts = ['example.com'];
const spec = {listUrl:'https://example.com/jobs', identityText:'示例企业', linkSelector:'a.job',titleSelector:'.title',locationSelector:'.location'};
test('accept verified URL IDs and property order, reject fabricated content, IDs and duplicates', () => {
  const row={title:'真实岗位',url:'https://example.com/#/job/12345678901234567890',location:'北京',company:'示例企业'};
  assertBrowserJobsMatch([{id:'12345678901234567890',company:row.company,location:row.location,url:row.url,title:row.title}],[row]);
  for (const patch of [{id:12345678901234567890},{id:'mock-id'},{title:'伪造岗位'},{description:'伪造描述'},{location:'上海'}]) assert.throws(()=>assertBrowserJobsMatch([{...row,...patch}],[row]),/独立读取/);
  assert.throws(()=>assertBrowserJobsMatch([], [row]),/独立读取/);
  const second={...row,url:'https://example.com/#/job/second'};
  assert.throws(()=>assertBrowserJobsMatch([row,row], [row,second]),/独立读取/);
  assertBrowserJobsMatch([second,row], [row,second]);
});
test('browser manifest and all returned links are scope checked', async () => {
  assert.equal(validateBrowserListing(spec, hosts), spec);
  for (const url of ['http://example.com','https://evil.com','https://user@example.com','https://example.com:8443','https://127.0.0.1']) assert.throws(()=>listingUrl(url,hosts));
  assert.throws(()=>validateBrowserListing({...spec,titleSelector:''}, hosts));
  assert.throws(()=>normalizeBrowserJobs([],hosts,'示例企业'));
  const row = {title:'真实岗位',location:'北京',url:'https://example.com/#/job/12345678901234567890'};
  assert.equal(normalizeBrowserJobs([row,row],hosts,'示例企业').length,1);
  assert.throws(()=>normalizeBrowserJobs([row,{...row,title:'不同岗位'}],hosts,'示例企业'));
  const ctx = buildCtx({requiredEnv:[],optionalEnv:[],allowedHosts:hosts,browserListing:spec}, {dryRun:true});
  await assert.rejects(ctx.browserJobs({careers_url:spec.listUrl}), /dry-run/);
});

test('fixed DOM extraction reads visible real hrefs; missing fields and empty shells fail', async () => {
  const browser=await chromium.launch({headless:true,...(fs.existsSync(chromium.executablePath())?{}:{channel:'chrome'})});
  try {
    const page=await browser.newPage();
    await page.setContent('<title>示例企业</title><a class="job" href="https://example.com/#/job/12345678901234567890"><span class="title">测试岗位</span><span class="location">北京</span></a><a class="job" style="display:none">隐藏模板</a>');
    const rows=await page.evaluate(extractBrowserListing,spec);
    assert.deepEqual(rows,[{title:'测试岗位',location:'北京',url:'https://example.com/#/job/12345678901234567890'}]);
    await page.evaluate(()=>{ const input=document.createElement('input');input.type='password';document.body.append(input); });
    await assert.rejects(page.evaluate(extractBrowserListing,spec),/用户操作/);
    await page.locator('input').evaluate(e=>e.remove());
    await page.locator('.location').evaluate(e=>e.remove());
    await assert.rejects(page.evaluate(extractBrowserListing,spec),/结构变化/);
    await page.setContent('<title>示例企业</title><p>请登录</p>');
    await assert.rejects(page.evaluate(extractBrowserListing,spec),/未读到岗位/);
    await assert.rejects(page.evaluate(extractBrowserListing,{...spec,identityText:'其他企业'}),/身份不符/);
  } finally {await browser.close();}
});
