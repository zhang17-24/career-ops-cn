import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as yaml from 'js-yaml';
import { lifecycle } from '../../enterprise-adapters.mjs';
import { hashPluginTree } from '../../plugins/_lock.mjs';
import { readRouteProposal, verificationRoute } from '../../enterprise-routes.mjs';

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'enterprise-adapter-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'config'));
  fs.writeFileSync(path.join(root, 'portals.yml'), yaml.dump({ tracked_companies: [{ name: '示例企业', careers_url: 'https://example.com/jobs', provider: 'old' }] }));
  fs.writeFileSync(path.join(root, 'config/plugins.yml'), yaml.dump({ plugins: { old: { enabled: true } } }));
  const runPlugins = (action, id) => {
    if (action === 'new-provider') {
      const dir = path.join(root, 'plugins.local', id); fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({ id, name: '示例企业 招聘源适配器' }));
    } else {
      const file = path.join(root, 'config/plugins.yml'); const cfg = yaml.load(fs.readFileSync(file, 'utf8'));
      cfg.plugins[id] = { enabled: action === 'enable' }; fs.writeFileSync(file, yaml.dump(cfg));
    }
  };
  const manager = lifecycle(root, { runPlugins, checkInstalled: () => {} });
  const bound = () => yaml.load(fs.readFileSync(path.join(root, 'portals.yml'), 'utf8')).tracked_companies[0].provider;
  const pass = async dir => ({ integrity: hashPluginTree(dir).integrity });
  return { root, manager, bound, pass, runPlugins };
}

test('explicit retry is allowed without making users write a technical plan', t => {
  const {root, manager} = setup(t); const s = manager.prepare('示例企业');
  manager.fail(s.ticket, 'HTTP封装不可读');
  assert.match(manager.list()[0].resumeBlocked, /不会自动循环/);
  assert.equal(manager.resume('示例企业', s.ticket).previousFailure, 'HTTP封装不可读');
  manager.fail(s.ticket, '仍未完成');
  const plan = '改用固定 DOM 浏览器读取真实岗位链接';
  manager.resume('示例企业', s.ticket, plan);
  manager.fail(s.ticket, '仍未完成');
  manager.resume('示例企业', s.ticket, plan);
  manager.fail(s.ticket, '仍未完成');
  fs.writeFileSync(path.join(root,'plugins.local',s.id,'ACCEPTANCE.md'), '新增公开证据');
  assert.equal(manager.list()[0].resumeBlocked, '');
  manager.resume('示例企业', s.ticket);
});

test('failed candidate preserves old binding; retry creates a new directory', async t => {
  const { manager, bound } = setup(t); const first = manager.prepare('示例企业');
  assert.throws(() => manager.prepare('示例企业'), /已有适配任务/);
  await assert.rejects(manager.finish(first.ticket, async () => { throw new Error('401'); }), /401/);
  assert.equal(bound(), 'old');
  assert.equal(manager.list()[0].status, 'failed');
  assert.notEqual(manager.prepare('示例企业').id, first.id);
});

test('passed candidate swaps binding; trash/restore preserves files without activation', async t => {
  const { root, manager, bound, pass } = setup(t); const s = manager.prepare('示例企业');
  await manager.finish(s.ticket, pass); assert.equal(bound(), s.id);
  const trash = manager.trash('示例企业', s.id); assert.equal(bound(), undefined);
  assert.equal(fs.existsSync(path.join(root, 'plugins.local', s.id)), false);
  manager.restore(trash.ticket);
  assert.ok(fs.existsSync(path.join(root, 'plugins.local', s.id, 'manifest.json')));
  assert.equal(yaml.load(fs.readFileSync(path.join(root, 'config/plugins.yml'), 'utf8')).plugins[s.id].enabled, false);
  assert.equal(bound(), undefined);
});

test('cancelled or changed candidates cannot activate', async t => {
  const { manager, bound, pass } = setup(t); const s = manager.prepare('示例企业');
  await assert.rejects(manager.finish(s.ticket, async dir => { manager.fail(s.ticket, 'cancelled'); return pass(dir); }), /取消/);
  assert.equal(bound(), 'old');
});

test('configuration failure rolls back all earlier writes', async t => {
  const { root, runPlugins, bound, pass } = setup(t);
  const manager = lifecycle(root, { checkInstalled: () => {}, runPlugins: (...args) => { if (args[0] === 'disable') throw new Error('模拟写入失败'); return runPlugins(...args); } });
  const s = manager.prepare('示例企业');
  await assert.rejects(manager.finish(s.ticket, pass), /模拟写入失败/);
  assert.equal(bound(), 'old');
  assert.equal(yaml.load(fs.readFileSync(path.join(root, 'config/plugins.yml'), 'utf8')).plugins[s.id], undefined);
});

test('foreign adapter and traversal deletion rejected', t => {
  const { manager } = setup(t);
  assert.throws(() => manager.trash('示例企业', '../config'), /编号/);
  assert.throws(() => manager.restore('../secret'), /编号/);
});

test('cancelled candidate cannot be resumed while its old AI process may still write', t => {
  const {manager} = setup(t); const s = manager.prepare('示例企业');
  assert.throws(() => manager.cancel('another', s.ticket), /本企业/);
  manager.cancel('示例企业', s.ticket);
  manager.fail(s.ticket, 'late exit from old worker');
  assert.equal(manager.list()[0].status, 'cancelled');
  assert.throws(() => manager.resume('示例企业', s.ticket), /已停止的候选/);
  assert.notEqual(manager.prepare('示例企业').id, s.id);
});

const route = { officialUrl: 'https://example.com/', entryUrl: 'https://jobs.example.org/campus', allowedHosts: ['jobs.example.org', 'api.example.org'], evidence: [
  { fromUrl: 'https://example.com/', toUrl: 'https://jobs.example.org/campus', kind: 'link', note: 'TEST ONLY: official careers link' },
  { fromUrl: 'https://jobs.example.org/campus', toUrl: 'https://api.example.org/list', kind: 'api', note: 'TEST ONLY: observed public request' },
] };

test('one explicit enterprise delegation survives failure and accepts connected public routes', async t => {
  const {root,manager,bound,pass} = setup(t);
  const s=manager.prepare('示例企业', true);
  const dir=path.join(root,'plugins.local',s.id);
  fs.writeFileSync(path.join(dir,'ROUTE_REVIEW.json'),JSON.stringify(route));
  await assert.rejects(manager.finish(s.ticket,()=>{throw new Error('详情未就绪')}),/详情未就绪/);
  assert.equal(bound(),'old');
  const resumed=manager.resume('示例企业',s.ticket);
  assert.ok(resumed.publicAdaptationAuthorizedAt);
  assert.equal(resumed.previousFailure,'详情未就绪');
  fs.appendFileSync(path.join(dir,'ROUTE_REVIEW.json'),'\n');
  await manager.finish(s.ticket,pass);
  assert.equal(bound(),s.id);
});

test('delegation cannot be granted by proposal and cannot change official source identity', async t => {
  const {root,manager,pass,bound}=setup(t);
  const s=manager.prepare('示例企业', true);
  const foreign={...route,officialUrl:'https://other.example.net/',evidence:[{...route.evidence[0],fromUrl:'https://other.example.net/'},route.evidence[1]]};
  fs.writeFileSync(path.join(root,'plugins.local',s.id,'ROUTE_REVIEW.json'),JSON.stringify(foreign));
  assert.equal((await manager.finish(s.ticket,pass)).status,'awaiting_review');
  assert.equal(bound(),'old');
});

test('legacy candidate can receive one-time delegation on explicit retry', async t => {
  const {root,manager,pass}=setup(t); const s=manager.prepare('示例企业');
  fs.writeFileSync(path.join(root,'plugins.local',s.id,'ROUTE_REVIEW.json'),JSON.stringify(route));
  await manager.finish(s.ticket,pass);
  assert.ok(manager.resume('示例企业',s.ticket,'',false,true).publicAdaptationAuthorizedAt);
  assert.equal((await manager.finish(s.ticket,pass)).status,'installed');
});

test('route proposal requires explicit approval, resumes same candidate and installs only after verification', async t => {
  const { root, manager, bound, pass } = setup(t); const s = manager.prepare('示例企业');
  const dir = path.join(root, 'plugins.local', s.id);
  fs.writeFileSync(path.join(dir, 'ROUTE_REVIEW.json'), JSON.stringify(route));
  assert.equal((await manager.finish(s.ticket, () => { throw new Error('must not verify unapproved proposal'); })).status, 'awaiting_review');
  assert.equal(bound(), 'old');
  assert.throws(() => manager.resume('示例企业', s.ticket), /先.*审核/);
  assert.throws(() => verificationRoute(dir, s, {}), /待用户审核/);
  const proposal = manager.list()[0].routeReview;
  assert.throws(() => manager.approveRoute('other', s.ticket, proposal.digest), /本企业/);
  assert.throws(() => manager.approveRoute('示例企业', s.ticket, 'stale'), /已变化/);
  manager.approveRoute('示例企业', s.ticket, proposal.digest);
  assert.equal(bound(), 'old'); // approval is not installation
  assert.equal(yaml.load(fs.readFileSync(path.join(root, 'portals.yml'), 'utf8')).tracked_companies[0].careers_url, 'https://example.com/jobs');
  const resumed = manager.resume('示例企业', s.ticket);
  assert.equal(resumed.id, s.id);
  assert.deepEqual(verificationRoute(dir, resumed, {}), {entryUrl: route.entryUrl, allowedHosts: [...route.allowedHosts].sort()});
  await manager.finish(s.ticket, pass);
  assert.equal(bound(), s.id);
  assert.equal(yaml.load(fs.readFileSync(path.join(root, 'portals.yml'), 'utf8')).tracked_companies[0].careers_url, route.entryUrl);
});

test('edited/deleted proposals invalidate approval and cannot affect another active candidate', async t => {
  const {root, manager, bound} = setup(t); const s = manager.prepare('示例企业');
  const dir = path.join(root, 'plugins.local', s.id); const file = path.join(dir, 'ROUTE_REVIEW.json');
  fs.writeFileSync(file, JSON.stringify(route)); manager.fail(s.ticket, 'route');
  const digest = readRouteProposal(dir).digest;
  manager.approveRoute('示例企业', s.ticket, digest);
  fs.appendFileSync(file, '\n');
  assert.throws(() => manager.resume('示例企业', s.ticket), /审核/);
  fs.unlinkSync(file);
  assert.throws(() => manager.resume('示例企业', s.ticket), /文件缺失/);
  assert.throws(() => verificationRoute(dir, manager.list()[0], {}), /文件缺失/);
  manager.prepare('示例企业');
  assert.throws(() => manager.retry(s.ticket), /已有适配任务/);
  assert.equal(bound(), 'old');
});

test('route approval keeps failed live checks and changed portal configuration fail-closed', async t => {
  const {root, manager, bound} = setup(t); const s = manager.prepare('示例企业');
  const dir = path.join(root, 'plugins.local', s.id);
  fs.writeFileSync(path.join(dir, 'ROUTE_REVIEW.json'), JSON.stringify(route)); manager.fail(s.ticket, 'route');
  manager.approveRoute('示例企业', s.ticket, readRouteProposal(dir).digest); manager.resume('示例企业', s.ticket);
  await assert.rejects(manager.finish(s.ticket, () => { throw new Error('real detail failed'); }), /real detail failed/);
  assert.equal(bound(), 'old');
  const file = path.join(root, 'portals.yml'); const doc = yaml.load(fs.readFileSync(file, 'utf8'));
  doc.tracked_companies[0].careers_url = 'https://example.com/changed'; fs.writeFileSync(file, yaml.dump(doc));
  assert.throws(() => manager.resume('示例企业', s.ticket), /配置已变化/);
});

test('route schema rejects wildcard, private, credentials, disconnected and oversized evidence', t => {
  const {root, manager} = setup(t); const s = manager.prepare('示例企业');
  const dir = path.join(root, 'plugins.local', s.id); const file = path.join(dir, 'ROUTE_REVIEW.json');
  for (const p of [
    {...route, entryUrl:'http://example.com/'}, {...route, officialUrl:'https://127.0.0.1/'},
    {...route, officialUrl:'https://user:secret@example.com/'}, {...route, allowedHosts:['*.example.org']},
    {...route, officialUrl:'https://metadata.google.internal/'}, {...route, officialUrl:'https://[::1]/'},
    {...route, officialUrl:'https://example.com:444/'}, {...route, allowedHosts:['jobs.example.org', 'unrelated.example.org']},
    {...route, evidence:[route.evidence[1]]}, {...route, evidence:[]},
  ]) { fs.writeFileSync(file, JSON.stringify(p)); assert.throws(() => readRouteProposal(dir)); }
  fs.writeFileSync(file, 'x'.repeat(24001)); assert.throws(() => readRouteProposal(dir), /24KB/);
  fs.unlinkSync(file); fs.symlinkSync(path.join(dir, 'manifest.json'), file);
  assert.throws(() => readRouteProposal(dir), /普通 JSON/);
});
