import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verificationRequests} from '../../enterprise-adapters.mjs';
test('anonymous bootstrap is same-host, GET-only, one-use and never counts as listing evidence', async()=>{
  const bootstrap='https://jobs.example.org/init';
  const create=()=>verificationRequests(async url=>new Response(url===bootstrap?'token-only':'real-list'),bootstrap,'jobs.example.org');
  const r=create();await r.request(bootstrap);assert.equal(r.state.count,0);assert.equal(r.state.raw,'');
  await r.request('https://jobs.example.org/list');assert.equal(r.state.count,1);assert.equal(r.state.raw,'real-list');
  await assert.rejects(r.request('https://jobs.example.org/list?page=2'));
  await assert.rejects(r.request(bootstrap));
  await assert.rejects(create().request(bootstrap,{method:'POST'}));
  assert.throws(()=>verificationRequests(()=>{},'https://other.example/init','jobs.example.org'));
  assert.throws(()=>verificationRequests(()=>{},'http://jobs.example.org/init','jobs.example.org'));
});
test('explicitly approved API bootstrap is allowed but an additional host is not', async()=>{
  const allowed=['jobs.example.org','api.example.org'];
  const r=verificationRequests(async()=>new Response('ok'),'https://api.example.org/init',allowed);
  await r.request('https://api.example.org/init');
  assert.equal(r.state.count,0);
  assert.throws(()=>verificationRequests(()=>{},'https://other.example.org/init',allowed));
});
test('one approved entry shell and its exact script data resource count as one listing', async()=>{
  const entry='https://jobs.example.org/'; const asset=entry+'static/main.abc.js';
  const html='<html><script src="/static/main.abc.js"></script><script src="https://other.example.org/main.js"></script></html>';
  const create=()=>verificationRequests(async url=>new Response(url===entry?html:'real-data'),null,['jobs.example.org'],entry);
  const r=create(); await r.request(entry); await r.request(asset);
  assert.equal(r.state.count,1); assert.equal(r.state.assetCount,1); assert.equal(r.state.raw,'real-data');
  await assert.rejects(r.request(asset), /一次/);
  for (const url of [entry+'page2', entry+'static/guessed.js','https://other.example.org/main.js']) {
    const x=create(); await x.request(entry); await assert.rejects(x.request(url),/一页/);
  }
  const post=create(); await post.request(entry); await assert.rejects(post.request(asset,{method:'POST'}),/GET/);
  const noEntry=verificationRequests(async()=>new Response(html),null,['jobs.example.org']);
  await noEntry.request(entry); await assert.rejects(noEntry.request(asset),/一页/);
});
