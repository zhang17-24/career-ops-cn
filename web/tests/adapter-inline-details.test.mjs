import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { existsSync } from 'node:fs';
import { chromium } from 'playwright';
import { publicCaptureScript, publicCapturePreload } from '../../adapter-network-capture.mjs';
import { inlineJobUrl, validateInlineSamples, verifyInlineDetail } from '../../adapter-inline-details.mjs';
import { normalizeUrl } from '../../url-key.mjs';
import { normalizeUrl as webNormalizeUrl } from '../src/lib/core/url-key.mjs';
import { buildPrompt } from '../src/lib/run-prompts.mjs';
import { postingRoleDedupKey, companyRoleDedupKey, normalizeUrlForDedup } from '../../scan.mjs';

test('public capture survives separate evaluations, observes one endpoint, restores hooks, and never replays', async () => {
  let calls = 0;
  class XHR extends EventTarget {
    open() {}
    send() { calls++; this.status = 200; this.responseText = '{"id":"12345678901234567890"}'; this.dispatchEvent(new Event('loadend')); }
  }
  const context = vm.createContext({ XMLHttpRequest: XHR, URL, Request, TextDecoder, location: { href: 'https://jobs.example.org/' }, fetch: async () => { calls++; return new Response('{"jobs":[]}'); } });
  context.window = context;
  const open = XHR.prototype.open;
  vm.runInContext(publicCaptureScript('https://jobs.example.org/list'), context);
  vm.runInContext(`var x=new XMLHttpRequest();x.open('POST','/other');x.send('{}')`, context);
  assert.equal(context.__careerPublicCapture.record, null);
  vm.runInContext(`x=new XMLHttpRequest();x.open('POST','/list');x.send('{"page":1}')`, context);
  assert.equal(context.__careerPublicCapture.record.response, '{"id":"12345678901234567890"}');
  assert.equal(context.__careerPublicCapture.record.body, '{"page":1}');
  assert.equal(calls, 2);
  context.__careerPublicCapture.stop(); assert.equal(XHR.prototype.open, open);
  assert.equal(context.__careerPublicCapture, undefined);
  vm.runInContext(publicCaptureScript('https://jobs.example.org/list'), context);
  await vm.runInContext(`fetch('https://jobs.example.org/list')`, context);
  assert.equal(context.__careerPublicCapture.record.response, '{"jobs":[]}');
  context.__careerPublicCapture.stop();
  assert.throws(() => publicCaptureScript('http://jobs.example.org/list'));
});

const config = { listUrl: 'https://jobs.example.org/#/list/', itemSelector: 'tbody.job', idAttribute: 'data-id', titleSelector: 'td:first-child', toggleSelector: 'tr.toggle', bodySelector: 'div.jd' };
test('tracking exceptions retain actual request, strict scope, semantic queries and first-response bound', async () => {
  const endpoint='https://jobs.example.org/list?page=1&_ihr_log_trackId=old';
  const calls=[];
  class XHR { open() {} send() {} }
  const context=vm.createContext({XMLHttpRequest:XHR,URL,Request,TextDecoder,location:{href:'https://jobs.example.org/'},fetch:async (url,init)=>{calls.push({url,body:init?.body});return new Response('{"list":[]}');}});
  context.window=context;
  vm.runInContext(publicCaptureScript(endpoint,{ignoreQueryParams:['_ihr_log_trackId']}),context);
  const fetchUrl=async url=>vm.runInContext(`fetch(${JSON.stringify(url)}, {method:'POST',body:'page=1'})`,context);
  for(const url of [endpoint.replace('jobs.example.org','other.example.org'),endpoint.replace('/list','/other'),endpoint.replace('page=1','page=2'),endpoint+'&tenant=other',endpoint+'&_ihr_log_trackId=extra',endpoint.replace('&_ihr_log_trackId=old','')]) {
    await fetchUrl(url);assert.equal(context.__careerPublicCapture.record,null);
  }
  const actual=endpoint.replace('=old','=new');
  await fetchUrl(actual);
  assert.equal(context.__careerPublicCapture.record.url,actual);
  assert.equal(context.__careerPublicCapture.record.body,'page=1');
  assert.deepEqual(calls.at(-1),{url:actual,body:'page=1'});
  await fetchUrl(endpoint.replace('=old','=later'));
  assert.equal(context.__careerPublicCapture.record.url,actual);
  context.__careerPublicCapture.stop();
  vm.runInContext(publicCaptureScript(endpoint),context);
  await fetchUrl(actual);assert.equal(context.__careerPublicCapture.record,null);
  context.__careerPublicCapture.stop();
  for(const keys of [['page'],['missing'],['*'],['_ihr_log_trackId','_ihr_log_trackId']]) assert.throws(()=>publicCaptureScript(endpoint,{ignoreQueryParams:keys}));
});
test('preload captures the first XHR after navigation and reload, then removes cleanly', async () => {
  const browser = await chromium.launch({headless:true,...(existsSync(chromium.executablePath())?{}:{channel:'chrome'})});
  try {
    const page = await browser.newPage(); const endpoint='https://jobs.example.org/campus';
    await page.route('**/*', route => route.fulfill({contentType:route.request().method()==='POST'?'application/json':'text/html',body:route.request().method()==='POST'?'{"jobs":[{"id":"12345678901234567890"}]}':'<script>const x=new XMLHttpRequest();x.open("POST","/campus");x.send("page=1")</script>'}));
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.enable');
    const {identifier}=await cdp.send('Page.addScriptToEvaluateOnNewDocument',{source:publicCapturePreload(endpoint,endpoint)});
    for(let i=0;i<2;i++) {
      await page.goto(endpoint);
      await page.waitForFunction(()=>window.__careerPublicCapture?.record?.response, null, {timeout:5000});
      const record=await page.evaluate(()=>window.__careerPublicCapture.record);
      assert.equal(record.body,'page=1');assert.match(record.response,/12345678901234567890/);
      assert.equal(record.status,200);
    }
    await page.goto('https://jobs.example.org/other');
    assert.equal(await page.evaluate(()=>!!window.__careerPublicCapture),false);
    await cdp.send('Page.removeScriptToEvaluateOnNewDocument',{identifier});
    await page.goto(endpoint);
    assert.equal(await page.evaluate(()=>!!window.__careerPublicCapture),false);
    assert.throws(()=>publicCapturePreload(endpoint,'http://jobs.example.org/'));
  } finally {await browser.close();}
});
const job = { id: '12345678901234567890', title: '测试工程师', description: '岗位职责：负责测试。任职要求：熟悉测试。'.repeat(8), url: inlineJobUrl(config.listUrl, '测试工程师', '12345678901234567890') };
test('inline identities reject duplicates, guessed URLs, unsafe selectors and numeric IDs', () => {
  validateInlineSamples(config, [job], ['jobs.example.org'], JSON.stringify(job));
  for (const j of [{...job,id:123}, {...job,url:config.listUrl}, {...job,id:'missing'}]) assert.throws(() => validateInlineSamples(config,[j],['jobs.example.org'],JSON.stringify(job)));
  assert.throws(() => validateInlineSamples(config,[job,job],['jobs.example.org'],JSON.stringify(job)));
  assert.throws(() => validateInlineSamples({...config,toggleSelector:'button,form'},[job],['jobs.example.org'],JSON.stringify(job)));
  const sameTitle = {...job,id:'other-real-id',url:inlineJobUrl(config.listUrl,job.title,'other-real-id')};
  validateInlineSamples(config,[job,sameTitle],['jobs.example.org'],JSON.stringify([job,sameTitle]));
  for (const normalize of [normalizeUrl, webNormalizeUrl, normalizeUrlForDedup]) assert.notEqual(normalize(job.url), normalize(sameTitle.url));
  assert.notEqual(postingRoleDedupKey(job), postingRoleDedupKey(sameTitle));
  assert.equal(postingRoleDedupKey({...job,id:'mismatched'}),companyRoleDedupKey(job.company,job.title));
  assert.match(buildPrompt({kind:'adapt-provider',input:'测试企业',memory:'',today:'2026-09-12'}), /adapter-network-capture\.mjs/);
});

test('inline acceptance verifies visible ID-bound body, never application controls', async () => {
  const browser = await chromium.launch({ headless: true, ...(existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }) });
  try {
    const page = await browser.newPage();
    const html = `<table><tbody class="job" data-id="${job.id}"><tr class="toggle" onclick="document.querySelector('.jd').style.display='block'"><td>${job.title}</td></tr><tr><td><div class="jd" style="display:none">${job.description}</div></td></tr></tbody></table>`;
    await page.route('https://jobs.example.org/**', r=>r.fulfill({contentType:'text/html; charset=utf-8',body:html}));
    await page.goto(config.listUrl);
    // Title selector must be unique inside the item, not every td in the body.
    const c = config;
    assert.equal(await verifyInlineDetail(page,c,job),job.description);
    await assert.rejects(verifyInlineDetail(page,c,{...job,id:'wrong'}),/编号/);
    await page.locator('.jd').evaluate(e => { e.style.display = 'none'; });
    await assert.rejects(verifyInlineDetail(page,c,{...job,description:'错误正文'.repeat(30)}),/正文/);
    await page.locator('tr.toggle').evaluate(e => e.innerHTML='<td class="title">投递简历</td>');
    await assert.rejects(verifyInlineDetail(page,c,{...job,title:'投递简历'}),/只读/);
  } finally { await browser.close(); }
});
