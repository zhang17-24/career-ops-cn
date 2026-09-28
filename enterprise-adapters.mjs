// Enterprise-owned candidate lifecycle. Runtime state is local, never shipped.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as yaml from 'js-yaml';
import { hashPluginTree } from './plugins/_lock.mjs';
import { readRouteProposal, routeIsApproved, verificationRoute } from './enterprise-routes.mjs';

const ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
export function lifecycle(root, { runPlugins, checkInstalled } = {}) {
  const base = path.join(root, '.career-ops-web', 'enterprise-adapters');
  fs.mkdirSync(base, { recursive: true });
  const write = (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${randomUUID()}.tmp`;
    fs.writeFileSync(tmp, value); fs.renameSync(tmp, file);
  };
  const save = (s) => write(path.join(base, `${s.ticket}.json`), JSON.stringify(s, null, 2));
  const read = (ticket) => {
    if (!ID.test(ticket || '')) throw new Error('记录编号不正确');
    return JSON.parse(fs.readFileSync(path.join(base, `${ticket}.json`), 'utf8'));
  };
  const list = () => fs.readdirSync(base).filter(x => x.endsWith('.json')).map(x => read(x.slice(0, -5)));
  const portals = () => yaml.load(fs.readFileSync(path.join(root, 'portals.yml'), 'utf8'));
  const company = (name) => {
    const doc = portals(); const row = doc.tracked_companies?.find(x => x.name === name);
    if (!row) throw new Error('企业不存在');
    return { doc, row };
  };
  const pluginDir = (id) => {
    if (!ID.test(id || '')) throw new Error('适配器编号不正确');
    const dir = path.join(root, 'plugins.local', id);
    if (fs.lstatSync(dir).isSymbolicLink()) throw new Error('不允许符号链接适配器');
    return dir;
  };
  // New evidence capabilities are a legitimate recovery change even if the
  // old candidate has not changed yet. Still never auto-start another AI run.
  const fingerprint = s => `adapter-evidence-v3-tracking:${s.approvedRoute?.digest || ''}:${hashPluginTree(pluginDir(s.id)).integrity}`;
  const resumeBlocked = s => s.status === 'failed' && s.failedFingerprint && s.failedFingerprint === fingerprint(s)
    ? '候选尚未变化。可重试修复（消耗 Token），或先零 Token 重新验收；不会自动循环重试。' : '';
  const run = runPlugins || ((...args) => execFileSync(process.execPath, [path.join(root, 'plugins.mjs'), ...args], { cwd: root, timeout: 20000, encoding: 'utf8' }));
  const checkLoaded = checkInstalled || ((id) => execFileSync(process.execPath, ['--input-type=module', '-e', 'const {loadPlugins}=await import("./plugins/_engine.mjs"); const loaded=await loadPlugins("provider",{root:process.cwd(),pluginId:process.argv[1]}); if(loaded.length!==1) throw new Error("插件未被实际加载");', id], { cwd: root, timeout: 20000, stdio: 'pipe' }));
  // All config changes are synchronous and serialized across worker processes.
  const locked = (fn) => {
    const lock = path.join(base, '.lock');
    try { fs.mkdirSync(lock); } catch { throw new Error('适配器配置正被修改，请稍后重试；异常退出遗留锁需人工检查'); }
    try { return fn(); } finally { fs.rmdirSync(lock); }
  };
  const transaction = (fn) => {
    const files = ['portals.yml', 'config/plugins.yml', 'plugins.lock'];
    const before = files.map(f => fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f)) : null);
    const journal = path.join(base, `backup-${randomUUID()}`);
    fs.mkdirSync(journal);
    files.forEach((f, i) => { if (before[i]) write(path.join(journal, f), before[i]); });
    try { return fn(); } catch (error) {
      files.forEach((f, i) => { const dest = path.join(root, f); if (before[i]) write(dest, before[i]); else if (fs.existsSync(dest)) fs.unlinkSync(dest); });
      throw error;
    }
  };
  return {
    list() { return list().map(s => {
      if (['trashed', 'installed', 'cancelled'].includes(s.status)) return s;
      try { const routeReview = readRouteProposal(pluginDir(s.id)); return { ...s, routeReview, routeApproved: routeIsApproved(routeReview, s), resumeBlocked: resumeBlocked(s) }; }
      catch (error) { return { ...s, routeError: error.message }; }
    }); },
    prepare(name, managedPublic = false) { return locked(() => {
      const { row } = company(name);
      if (list().some(s => s.company === name && ['developing', 'verifying'].includes(s.status))) throw new Error('该企业已有适配任务，请先完成或取消');
      const ticket = randomUUID(); const id = `company-${ticket}`;
      const host = new URL(row.careers_url).hostname;
      run('new-provider', id, '--host', host, '--company', name);
      const s = { ticket, id, company: name, host, originalUrl: row.careers_url, previous: row.provider || '', status: 'developing', createdAt: new Date().toISOString() };
      if (managedPublic === true) s.publicAdaptationAuthorizedAt = new Date().toISOString();
      save(s); return s;
    }); },
    approveRoute(name, ticket, digest) { return locked(() => {
      const s = read(ticket);
      if (s.company !== name || !['failed', 'awaiting_review'].includes(s.status)) throw new Error('只能审核本企业已停止的候选任务');
      if (list().some(x => x.company === name && ['developing', 'verifying'].includes(x.status))) throw new Error('该企业仍有运行中的任务');
      const proposal = readRouteProposal(pluginDir(s.id));
      if (!proposal || proposal.digest !== digest) throw new Error('路线申请已变化，请刷新后重新审核');
      s.approvedRoute = { ...proposal, approvedAt: new Date().toISOString() };
      s.status = 'failed'; s.reason = '路线已审核，尚未验收。可续接原候选，或在代码已完成时仅重新验收。';
      save(s); return s;
    }); },
    resume(name, ticket, recoveryNote = '', verificationOnly = false, managedPublic = false) { return locked(() => {
      const s = read(ticket); const { row } = company(name);
      const note = typeof recoveryNote === 'string' ? recoveryNote.trim() : '';
      if (note.length > 500) throw new Error('处理思路最多500字');
      if (s.company !== name || !['failed', 'awaiting_review'].includes(s.status)) throw new Error('只能续接本企业已停止的候选');
      if (list().some(x => x.company === name && ['developing', 'verifying'].includes(x.status))) throw new Error('该企业已有适配任务');
      if (managedPublic === true) s.publicAdaptationAuthorizedAt ||= new Date().toISOString();
      let proposal;
      try { proposal = readRouteProposal(pluginDir(s.id)); }
      catch (error) { if (verificationOnly || !s.publicAdaptationAuthorizedAt) throw error; }
      if (!proposal && s.approvedRoute && (verificationOnly || !s.publicAdaptationAuthorizedAt)) throw new Error('已批准的路线文件缺失');
      if (proposal && !routeIsApproved(proposal, s)) throw new Error('请先在企业设置中审核招聘入口及域名');
      if ((row.provider || '') !== s.previous || (s.originalUrl && row.careers_url !== s.originalUrl)) throw new Error('企业配置已变化，请重新适配');
      if (!s.originalUrl && new URL(row.careers_url).hostname !== s.host) throw new Error('企业入口域名已变化，请重新适配');
      s.originalUrl ||= row.careers_url;
      s.previousFailure = s.reason;
      s.status = 'developing'; s.reason = ''; s.recoveryNote = note; save(s); return s;
    }); },
    fail(ticket, reason) { return locked(() => { const s = read(ticket); if (!['installed', 'trashed', 'cancelled'].includes(s.status)) { s.status = 'failed'; s.reason = String(reason).slice(0, 500); s.failedFingerprint = fingerprint(s); save(s); } return s; }); },
    cancel(name, ticket) { return locked(() => {
      const s = read(ticket);
      if (s.company !== name || !['developing', 'verifying'].includes(s.status)) throw new Error('只能取消本企业正在进行的任务');
      s.status = 'cancelled'; s.reason = '用户取消安装资格。AI 进程可能仍在运行，此目录不可续接；重新适配会使用新目录。'; save(s); return s;
    }); },
    retry(ticket) { const s = read(ticket); return this.resume(s.company, ticket, '', true); },
    async finish(ticket, verify) {
      const s = locked(() => { const s = read(ticket); if (s.status !== 'developing') throw new Error('任务不在待验收状态'); s.status = 'verifying'; save(s); return s; });
      try {
        const proposal = readRouteProposal(pluginDir(s.id));
        if (proposal && !routeIsApproved(proposal, s)) return locked(() => {
          if (read(ticket).status !== 'verifying') throw new Error('任务已取消或删除');
          s.status = 'awaiting_review'; s.reason = '发现招聘入口或新域名，请在企业适配器设置中审核；未安装。'; save(s); return s;
        });
        if (proposal && s.publicAdaptationAuthorizedAt) {
          s.approvedRoute = { ...proposal, approvedAt: new Date().toISOString(), authorization: 'enterprise-public-delegation' };
          locked(() => { if (read(ticket).status !== 'verifying') throw new Error('任务已取消或删除'); save(s); });
        }
        const evidence = await verify(pluginDir(s.id), s, company(s.company).row);
        return locked(() => transaction(() => {
          if (read(ticket).status !== 'verifying') throw new Error('任务已取消或删除');
          const { doc, row } = company(s.company);
          if ((row.provider || '') !== s.previous) throw new Error('企业绑定已改变，取消自动替换');
          if (s.originalUrl && row.careers_url !== s.originalUrl) throw new Error('企业入口已改变，取消自动替换');
          if (hashPluginTree(pluginDir(s.id)).integrity !== evidence.integrity) throw new Error('验收后文件发生变化，禁止自动信任');
          run('enable', s.id, '--confirm');
          checkLoaded(s.id);
          row.provider = s.id; delete row.scan_method; delete row.scan_query;
          if (s.approvedRoute) row.careers_url = s.approvedRoute.entryUrl;
          write(path.join(root, 'portals.yml'), yaml.dump(doc, { lineWidth: 120, noRefs: true }));
          // Old files are retained. Do not disable an adapter shared by others.
          if (s.previous && !doc.tracked_companies.some(x => x.provider === s.previous)) run('disable', s.previous);
          s.status = 'installed'; s.reason = ''; s.evidence = evidence; save(s); return s;
        }));
      } catch (error) { this.fail(ticket, error.message); throw error; }
    },
    trash(name, id) { return locked(() => transaction(() => {
      const { doc, row } = company(name); const dir = pluginDir(id);
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
      const owned = list().some(s => s.id === id && s.company === name);
      const legacyName = String(manifest.name || '').replace(/\s*(校招)?\s*招聘源适配器$/, '').trim();
      if (row.provider !== id && !owned && legacyName !== name) throw new Error('该适配器不属于此企业');
      if (doc.tracked_companies.some(x => x.name !== name && x.provider === id)) throw new Error('其他企业仍在使用此适配器，不能删除');
      const ticket = randomUUID(); const dest = path.join(base, 'trash', ticket);
      const s = { ticket, company: name, id, status: 'trashed', createdAt: new Date().toISOString() };
      run('disable', id);
      if (row.provider === id) { delete row.provider; row.scan_method = 'websearch'; }
      write(path.join(root, 'portals.yml'), yaml.dump(doc, { lineWidth: 120, noRefs: true }));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.renameSync(dir, dest);
      try { save(s); for (const old of list().filter(x => x.id === id && x.ticket !== ticket && ['developing','verifying'].includes(x.status))) { old.status = 'cancelled'; save(old); } }
      catch (error) { fs.renameSync(dest, dir); throw error; }
      return s;
    })); },
    restore(ticket) { return locked(() => {
      const s = read(ticket); if (s.status !== 'trashed') throw new Error('记录不在回收区');
      if (!ID.test(s.id)) throw new Error('适配器编号不正确');
      const dest = path.join(root, 'plugins.local', s.id);
      if (fs.existsSync(dest)) throw new Error('同名适配器已存在，不覆盖');
      const source = path.join(base, 'trash', ticket);
      fs.renameSync(source, dest);
      try { s.status = 'restored'; save(s); } catch(error) { fs.renameSync(dest, source); throw error; }
      return s; // Restore files only; never reactivate stale code without checks.
    }); },
  };
}

// One declared, explicitly allowed anonymous initialization is allowed; never count it
// as listing evidence or permit it to turn into extra listing pages.
export function verificationRequests(fetch, bootstrapUrl, host, entryUrl) {
  const hosts = Array.isArray(host) ? host : [host];
  if (bootstrapUrl) {
    const u = new URL(bootstrapUrl);
    if (u.protocol !== 'https:' || !hosts.includes(u.hostname) || u.username || u.password || u.hash || u.port) throw new Error('初始化地址必须是官网同域或已审核域名的 HTTPS');
  }
  const state = { count: 0, bootstrapCount: 0, assetCount: 0, raw: '' };
  let entryAssets = new Set();
  return { state, request: async (url, options = {}) => {
    const bootstrap = bootstrapUrl && String(url) === bootstrapUrl;
    const asset = state.count === 1 && entryAssets.has(String(url));
    if (bootstrap) {
      if (state.count || ++state.bootstrapCount > 1 || (options.method || 'GET').toUpperCase() !== 'GET') throw new Error('仅允许列表前执行一次公开 GET 初始化');
    } else if (asset) {
      if (++state.assetCount > 1 || (options.method || 'GET').toUpperCase() !== 'GET' || options.body) throw new Error('仅允许一次首页实际引用的数据资源 GET');
    } else if (++state.count > 1) throw new Error('验收仅允许一页列表请求');
    const res = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!bootstrap) state.raw = await res.clone().text();
    // A SPA's HTML shell + one observed static data asset is one listing, not
    // two pages. No guessed endpoints, extra bootstrap, script execution or crawl.
    if (!bootstrapUrl && !asset && String(url) === entryUrl && res.ok &&
        (options.method || 'GET').toUpperCase() === 'GET' && /<html\b/i.test(state.raw)) {
      entryAssets = new Set([...state.raw.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].flatMap(m => {
        try {
          const u = new URL(m[1].replace(/&amp;/g, '&'), res.url || entryUrl);
          return u.protocol === 'https:' && hosts.includes(u.hostname) && !u.username && !u.password && !u.port && !u.hash && /\.(?:js|json)$/.test(u.pathname) ? [u.href] : [];
        } catch { return []; }
      }));
    }
    return res;
  } };
}

// This verifier runs in a bounded child process, not inside the UI request loop.
export async function verifyCandidate(dir, state, row) {
  const { auditPlugin } = await import('./plugin-audit.mjs');
  const { buildCtx } = await import('./plugins/_engine.mjs');
  if (fs.existsSync(path.join(dir, 'BLOCKED.md'))) throw new Error('候选仍有 BLOCKED.md 未解决，保持停用；请先查看具体阻塞原因');
  const route = verificationRoute(dir, state, row);
  const before = hashPluginTree(dir).integrity;
  const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
  if (m.id !== state.id || m.hooks?.length !== 1 || m.hooks[0] !== 'provider' || (m.requiredEnv || []).length || (m.optionalEnv || []).length || m.allowsLocalhost) throw new Error('适配器权限超出单企业自动安装范围，需人工审核');
  if (!m.allowedHosts?.length || m.allowedHosts.some(h => !route.allowedHosts.includes(h))) throw new Error('新增 API 域名需人工审核，不自动授予跨域权限');
  const audit = auditPlugin(dir); if (!audit.ok) throw new Error('静态检查未通过，保持停用');
  if (!fs.existsSync(path.join(dir, 'ACCEPTANCE.md'))) throw new Error('缺少验收记录');
  execFileSync(process.execPath, [path.join(dir, 'test/smoke.mjs')], { timeout: 20000, cwd: dir, stdio: 'pipe' });
  const ctx = buildCtx({ ...m, requiredEnv: [], optionalEnv: [] });
  const { request, state: requests } = verificationRequests(ctx.fetch, m.publicBootstrapUrl, route.allowedHosts, route.entryUrl);
  const { default: plugin } = await import(pathToFileURL(path.join(dir, 'index.mjs')).href);
  if (plugin?.provider?.id !== state.id || typeof plugin.provider.fetch !== 'function') throw new Error('provider 编号或入口不正确');
  let observedJobs; let browserCalls = 0;
  const httpRequest = (...args) => {
    if (m.browserListing) throw new Error('浏览器列表模式不能叠加 HTTP 请求');
    return request(...args);
  };
  const jobs = await plugin.provider.fetch({ ...row, careers_url: route.entryUrl, max_pages: 1 }, { ...ctx, browserJobs: async entry => {
    if (!m.browserListing || ++browserCalls > 1 || requests.count || m.inlineDetails || m.publicBootstrapUrl) throw new Error('浏览器验收只允许一页列表，不叠加 HTTP 或展开模式');
    observedJobs = await ctx.browserJobs(entry);
    return structuredClone(observedJobs);
  }, fetch: httpRequest, fetchJson: async (...args) => (await httpRequest(...args)).json(), fetchText: async (...args) => (await httpRequest(...args)).text() });
  if (m.browserListing ? browserCalls !== 1 || requests.count : requests.count !== 1) throw new Error('适配器结果不能对应平台独立读取的列表');
  if (m.browserListing) {
    const { assertBrowserJobsMatch } = await import('./adapter-browser-listing.mjs');
    assertBrowserJobsMatch(jobs, observedJobs);
  }
  if (!Array.isArray(jobs) || jobs.length < 3) throw new Error('真实列表不足三个样本，不能自动启用');
  let raw = requests.raw;
  if (m.browserListing) raw = JSON.stringify(observedJobs);
  try { raw = JSON.stringify(JSON.parse(raw)); } catch { /* HTML source */ }
  const samples = jobs.slice(0, 3);
  const { validateInlineSamples, verifyInlineDetail } = await import('./adapter-inline-details.mjs');
  if (m.inlineDetails) validateInlineSamples(m.inlineDetails, jobs, route.allowedHosts, raw);
  if (new Set(samples.map(j => j.url)).size !== 3 || samples.some(j => typeof j.title !== 'string' || !j.title.trim() || !raw.includes(j.title) || !route.allowedHosts.includes(new URL(j.url).hostname))) throw new Error('岗位不能对应真实官网列表或已审核域名');
  const { chromium } = await import('playwright');
  const { newLivenessPage, checkUrlLiveness, canVerifyStaticDetail } = await import('./liveness-browser.mjs');
  const browser = await chromium.launch({ headless: true, ...(fs.existsSync(chromium.executablePath()) ? {} : { channel: 'chrome' }) });
  try {
    const page = await newLivenessPage(browser, { locale: 'zh-CN' });
    for (const job of samples) {
      if (m.inlineDetails) {
        // Load once, preserving the existing SSRF, redirect and access guards.
        if (job === samples[0]) {
          const result = await checkUrlLiveness(page, m.inlineDetails.listUrl, { expectedTitle: job.title, allowedNavigationHosts: route.allowedHosts });
          if (result.result !== 'active' && result.code !== 'no_apply_control') throw new Error(`展开列表未确认：${result.code}`);
        }
        await verifyInlineDetail(page, m.inlineDetails, job);
        continue;
      }
      const options = { expectedTitle: job.title, requireJobBody: true, allowedNavigationHosts: route.allowedHosts };
      let detailPage = page;
      let result = await checkUrlLiveness(page, job.url, options);
      if (canVerifyStaticDetail(result, page.url())) {
        // Read the current public server-rendered document without executing
        // its scripts. Same URL, fresh anonymous context and all URL guards.
        detailPage = await newLivenessPage(browser, { locale: 'zh-CN', javaScriptEnabled: false });
        result = await checkUrlLiveness(detailPage, job.url, options);
      }
      // A readable JD need not expose a semantic Apply button (JD uses divs).
      // All access, expiry and redirect failures remain blocking.
      if (result.result !== 'active' && result.code !== 'no_apply_control') throw new Error(`详情未确认：${job.title}；${result.code}：${result.reason}；${job.url}`);
      const text = await detailPage.locator('body').innerText();
      if (detailPage !== page) await detailPage.context().close();
      if (!text.includes(job.title) || !/职责|描述|要求|资格|responsibilit|qualification|requirements|description/i.test(text)) throw new Error(`详情名称或职责正文未核对通过：${job.title}；${job.url}`);
    }
  } finally { await browser.close(); }
  if (hashPluginTree(dir).integrity !== before) throw new Error('验收期间插件文件发生变化');
  return { checkedAt: new Date().toISOString(), count: jobs.length, samples: samples.map(({ title, url }) => ({ title, url })), integrity: before };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.dirname(fileURLToPath(import.meta.url)); const manager = lifecycle(root);
  try {
    const [action, json = '{}'] = process.argv.slice(2); const arg = JSON.parse(json);
const result = action === 'list' ? manager.list() : action === 'prepare' ? manager.prepare(arg.company, arg.managedPublic) : action === 'resume' ? manager.resume(arg.company, arg.ticket, arg.recoveryNote, false, arg.managedPublic) : action === 'cancel' ? manager.cancel(arg.company, arg.ticket) : action === 'approve-route' ? manager.approveRoute(arg.company, arg.ticket, arg.digest) : action === 'retry' ? (manager.retry(arg.ticket), await manager.finish(arg.ticket, verifyCandidate)) : action === 'finish' ? await manager.finish(arg.ticket, verifyCandidate) : action === 'fail' ? manager.fail(arg.ticket, arg.reason) : action === 'trash' ? manager.trash(arg.company, arg.id) : action === 'restore' ? manager.restore(arg.ticket) : null;
    if (result === null) throw new Error('不支持的操作');
    console.log(JSON.stringify(result));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
