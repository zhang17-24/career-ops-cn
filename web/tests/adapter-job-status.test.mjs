import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adapterPendingHint, jobErrorHint } from '../src/lib/job-error-hint.mjs';
import { buildPrompt } from '../src/lib/run-prompts.mjs';
import fs from 'node:fs';

test('adapter acceptance is not a rating or proof of activation', () => {
  const job = { kind: 'adapt-provider', status: 'done', result: { score: 1, summary: 'xiaohongshu-campus; awaiting activation acceptance' } };
  assert.equal(adapterPendingHint(job).title, '待验收 · 未启用');
  assert.equal(adapterPendingHint({ ...job, kind: 'evaluate' }), null);
  assert.equal(adapterPendingHint({ ...job, status: 'error' }), null);
  assert.equal(job.result.score, 1);
});

test('policy refusal is explained from terminal error, not assistant prose', () => {
  const label = 'API Error: Claude Code is unable to respond to this request, which appears to violate our Usage Policy';
  assert.equal(jobErrorHint({ status: 'error', steps: [{ label }] }).kind, 'policy');
  assert.equal(jobErrorHint({ status: 'done', text: label }), null);
  assert.equal(jobErrorHint({ status: 'error', steps: [{ label: '连接失败' }] }).kind, 'connection');
});

test('route review is pending for structured and legacy terminal states, never inferred from prose', () => {
  const job = {kind:'adapt-provider',input:'金山办公',status:'awaiting_review',steps:[]};
  assert.equal(adapterPendingHint(job).title,'等待路线审核 · 未安装');
  assert.equal(adapterPendingHint(job).href,'/portals?adapter='+encodeURIComponent(job.input));
  assert.ok(adapterPendingHint({...job,status:'error',steps:[{label:'待审核 · 未安装：请审核'}]}));
  assert.equal(adapterPendingHint({...job,status:'error',text:'待审核 · 未安装：请审核',steps:[{label:'连接失败'}]}),null);
  assert.equal(adapterPendingHint({...job,kind:'evaluate'}),null);
  const prompt=buildPrompt({kind:'adapt-provider',input:'金山办公',memory:'',today:'2026-09-12'});
  assert.match(prompt,/absence of that backlink alone is NOT a blocker/);
  assert.match(prompt,/In per-route review mode, new domains require explicit platform approval/);
  assert.match(prompt,/server-confirmed enterprise public delegation/);
});

test('server and client retain an explicit review event and require a completion receipt', () => {
  const server=fs.readFileSync(new URL('../src/app/api/run/route.ts',import.meta.url),'utf8');
  const client=fs.readFileSync(new URL('../src/components/jobs/job-store.tsx',import.meta.url),'utf8');
  assert.match(server,/type: "awaiting_review"/);
  assert.match(client,/finish\("awaiting_review"/);
  assert.match(client,/if \(receivedDone\) finish\("done"/);
  assert.match(client,/j.status === "running" \|\| adapterPendingHint\(j\)/);
});
