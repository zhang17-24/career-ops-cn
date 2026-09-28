import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkUrlLiveness, canVerifyStaticDetail } from '../../liveness-browser.mjs';

test('static HTML fallback is limited to an empty document, never access/expiry failures', () => {
  assert.equal(canVerifyStaticDetail({result:'uncertain',code:'blank_document'},'about:blank'),true);
  for (const code of ['bot_challenge','http_gone','navigation_error','access_blocked','redirected_off_posting']) {
    assert.equal(canVerifyStaticDetail({result:'uncertain',code},'about:blank'),false);
  }
  assert.equal(canVerifyStaticDetail({result:'uncertain',code:'blank_document'},'https://example.com/login'),false);
});

test('detail readiness waits for title AND description instead of title-only hydration', async () => {
  let predicate, arg;
  const page = { goto:async()=>({status:()=>200}),waitForTimeout:async()=>{},url:()=> 'https://example.com/job',
    waitForFunction:async(fn,value)=>{predicate=fn;arg=value;},evaluate:async()=> '测试岗位 职责要求'.repeat(50) };
  await checkUrlLiveness(page,page.url(),{expectedTitle:'测试岗位',requireJobBody:true});
  const previous=globalThis.document;
  try {
    globalThis.document={body:{innerText:'测试岗位 地点 发布时间'}};
    assert.equal(predicate(arg),false);
    globalThis.document.body.innerText+=' 职位描述：负责数据分析';
    assert.equal(predicate(arg),true);
  } finally { if(previous===undefined)delete globalThis.document;else globalThis.document=previous; }
});

test('wait for expected title and ignore blocked extension subresources, not navigation', async () => {
  for (const navigation of [false, true]) {
    let interceptor, aborted = false, waited = false, evaluations = 0;
    const page = {
      route: async (_, fn) => { interceptor = fn; },
      goto: async () => { await interceptor({ request: () => ({ url: () => 'chrome-extension://invalid/', isNavigationRequest: () => navigation }), abort: async () => { aborted = true; } }); return { status: () => 200 }; },
      waitForTimeout: async () => {},
      waitForFunction: async (_, args, options) => { assert.equal(args.title, '测试岗位'); assert.equal(options.timeout, 12000); waited = true; },
      url: () => 'https://example.com/job/123',
      evaluate: async () => ++evaluations === 1 ? '测试岗位 职责与要求'.repeat(50) : ['投递简历'],
    };
    const result = await checkUrlLiveness(page, page.url(), { expectedTitle: '测试岗位' });
    assert.equal(aborted, true); assert.equal(waited, !navigation);
    assert.equal(result.result, navigation ? 'uncertain' : 'active');
  }
});

test('candidate navigation is limited to approved domains including final redirects', async () => {
  const allowedNavigationHosts = ['jobs.example.org'];
  assert.equal((await checkUrlLiveness(null, 'https://other.example.org/job', {allowedNavigationHosts})).code, 'unapproved_host');
  for (const url of ['http://jobs.example.org/job', 'https://user:pass@jobs.example.org/job', 'https://jobs.example.org:444/job']) {
    assert.equal((await checkUrlLiveness(null, url, {allowedNavigationHosts})).code, 'unapproved_host');
  }
  let interceptor, aborted = false;
  const frame = {};
  const page = {
    mainFrame: () => frame,
    route: async (_, fn) => { interceptor = fn; },
    goto: async () => { await interceptor({request: () => ({url: () => 'https://other.example.org/job', isNavigationRequest: () => true, frame: () => frame}), abort: async () => {aborted = true;}}); return {status: () => 200}; },
    waitForTimeout: async () => {},
    url: () => 'https://other.example.org/job',
  };
  assert.equal((await checkUrlLiveness(page, 'https://jobs.example.org/job', {allowedNavigationHosts})).code, 'unapproved_host');
  assert.equal(aborted, true);
});
