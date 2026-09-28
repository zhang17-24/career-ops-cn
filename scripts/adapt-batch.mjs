#!/usr/bin/env node
// 批量企业适配驱动 —— 对 portals.yml 里「还没有 provider」的企业逐个跑企业适配。
//
// 为什么不靠浏览器点击：一次适配要 2-14 分钟，191 家企业串行要几十小时。
// 人工在页面上一个个点是撑不住的，这个脚本能无人值守跑完并把结果记下来，
// 中断后重跑会自动跳过已处理的。
//
// 用法：
//   node scripts/adapt-batch.mjs --dry-run              # 只列出待处理企业
//   node scripts/adapt-batch.mjs --limit 3              # 先跑 3 家看看
//   node scripts/adapt-batch.mjs                        # 跑全部待处理企业
//   node scripts/adapt-batch.mjs --retry                # 连之前失败的一起重试
//
// 前置：
//   1. 平台服务在跑（cd web && npm run dev）
//   2. 设置页已选中目标 AI 工具，并已开启它的「完全访问」
//      —— 脚本会先自检这两项，不满足就直接退出，不会白跑
//
// 注意：这会真实消耗 Token 并访问外部官网。适配失败的候选会留在
// plugins.local/ 下供人工检查，脚本不会自行删除任何东西。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
// 本项目的 YAML 依赖是 js-yaml（enterprise-adapters.mjs 用的是同一个），
// 包名不叫 yaml —— 写错会在启动时 ERR_MODULE_NOT_FOUND。
import * as yaml from "js-yaml";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.CAREER_OPS_BASE || "http://localhost:3000";
const CLI_ID = process.env.CAREER_OPS_CLI || "workbuddy";
const STATE_FILE = path.join(ROOT, ".career-ops-web", "adapt-batch-state.json");
// 单次上限比路由的 780s kill 计时器宽 60s：让平台自己超时并写下结论，
// 而不是由脚本先掐断、留下一个状态不明的候选。
const PER_COMPANY_TIMEOUT_MS = 840_000;

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const value = (f, d) => {
  const i = argv.indexOf(f);
  return i === -1 ? d : argv[i + 1];
};

const DRY_RUN = has("--dry-run");
const RETRY = has("--retry");
const LIMIT = Number(value("--limit", "0")) || 0;
/** 只跑指定企业（按 portals.yml 里的名字精确匹配）。适合先单独验证一家。 */
const ONLY = value("--company", "");
/**
 * 续接已有候选（候选编号 = ticket）。用于「代码已写好、只差验收记录」这种情况：
 * 平台会让 Agent 先读已有代码和阻塞记录，只补未完成步骤，不重建、不覆盖有效成果。
 * 这比整轮重跑省得多，也是在 780s 预算内真正收尾的唯一可行路径。
 */
const RESUME_TICKET = value("--resume-ticket", "");
const NOTE = value("--note", "代码已写好，请先读候选目录里已有的 index.mjs 与 manifest.json，只补上缺失的 ACCEPTANCE.md（一页列表与三个真实详情的核验记录），不要重建或覆盖已有成果。");

function log(...args) {
  console.log(`[${new Date().toLocaleTimeString("zh-CN", { hour12: false })}]`, ...args);
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return { attempted: {} };
  }
}

function writeState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
  const tmp = `${STATE_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, STATE_FILE);
}

/** 待适配企业：有名字、没有 provider。 */
function pendingCompanies() {
  const doc = yaml.load(fs.readFileSync(path.join(ROOT, "portals.yml"), "utf8"));
  const rows = [...(doc.tracked_companies || []), ...(doc.job_boards || [])];
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const name = typeof row?.name === "string" ? row.name.trim() : "";
    if (!name || row.provider) continue;
    if (seen.has(name)) continue; // 同名只跑一次
    seen.add(name);
    out.push({ name, url: row.careers_url || row.url || "" });
  }
  return out;
}

/** 开跑前的自检：服务在、CLI 选好了、完全访问开了。缺一项就直接退出。 */
async function preflight() {
  let clis;
  try {
    const r = await fetch(`${BASE}/api/clis`, { signal: AbortSignal.timeout(10_000) });
    clis = await r.json();
  } catch (e) {
    throw new Error(`平台服务连不上（${BASE}）——先跑 cd web && npm run dev。原始错误：${e.message}`);
  }
  const chosen = clis.clis?.find((c) => c.id === CLI_ID);
  if (!chosen) throw new Error(`/api/clis 里没有 ${CLI_ID} 这一项`);
  if (!chosen.installed) throw new Error(`${chosen.name} 未检测到（${chosen.run}）——先在设置页确认它已安装`);

  const perms = await (await fetch(`${BASE}/api/codex-permissions`, { signal: AbortSignal.timeout(10_000) })).json();
  // 每个 CLI 的授权是独立的，别把 Codex 的授权当成 WorkBuddy 的。
  const key = CLI_ID === "codex" ? "fullAccess" : `${CLI_ID}FullAccess`;
  if (perms[key] !== true) {
    throw new Error(`${chosen.name} 的「完全访问」没开——企业适配需要它。请到设置页开启后再跑。`);
  }
  return chosen;
}

/**
 * 跑一家企业。返回 { outcome, detail }。
 *
 * 路由用 JSON lines 推流；终态是 {type:"done"} 或 {type:"error"}。
 * 只认这两个，其余（status/tool/text）都只是过程日志。
 */
async function adaptOne(company) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_COMPANY_TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(`${BASE}/api/run`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        // 路由的 localPermissionRequest 要求 Origin 与 Host 严格配对 ——
        // 少了它 managedPublic 会被 403 挡掉。
        Origin: BASE,
      },
      body: JSON.stringify({
        kind: "adapt-provider",
        input: company.name,
        cliId: CLI_ID,
        managedPublic: true,
        // 带上 ticket 就是续接：平台走 resume 而不是 prepare，沿用同一个候选目录。
        ...(RESUME_TICKET ? { adapterTicket: RESUME_TICKET, recoveryNote: NOTE } : {}),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { outcome: "rejected", detail: `HTTP ${res.status} ${body.slice(0, 200)}` };
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let terminal = null;
    let lastStatus = "";
    let tokens = 0;
    let lastError = "";

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let ev;
        try {
          ev = JSON.parse(line);
        } catch {
          continue;
        }
        if (ev.type === "status" && ev.label) lastStatus = ev.label;
        if (ev.type === "tool" && ev.name) lastStatus = `工具 ${ev.name}`;
        if (ev.type === "error") lastError = String(ev.msg || "").slice(0, 300);
        if (typeof ev.tokens === "number") tokens = ev.tokens;
        if (ev.type === "done") terminal = "done";
        if (ev.type === "error" && !ev.msg?.includes("keepalive")) terminal = terminal || "error";
      }
      if (terminal) break;
    }

    const secs = Math.round((Date.now() - started) / 1000);
    if (terminal === "done") return { outcome: "done", detail: `${secs}s · ${tokens} tokens`, tokens, secs };
    if (terminal === "error") return { outcome: "error", detail: `${secs}s · ${lastError || lastStatus}`, secs };
    return { outcome: "unknown", detail: `${secs}s · 流结束但没收到终态（最后状态：${lastStatus || "无"}）`, secs };
  } catch (e) {
    const secs = Math.round((Date.now() - started) / 1000);
    if (e.name === "AbortError") return { outcome: "client-timeout", detail: `${secs}s · 脚本侧超时`, secs };
    return { outcome: "exception", detail: `${secs}s · ${e.message}`, secs };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  const chosen = await preflight();
  const state = readState();
  const all = pendingCompanies();
  let queue = all.filter((c) => RETRY || state.attempted[c.name] === undefined);
  if (ONLY) {
    const hit = queue.filter((c) => c.name === ONLY);
    if (!hit.length) throw new Error(`待适配队列里没有「${ONLY}」——它可能已经有适配器，或名字与 portals.yml 不一致`);
    queue = hit;
  }
  const run = LIMIT > 0 ? queue.slice(0, LIMIT) : queue;

  log(`AI 工具：${chosen.name}（${chosen.run}）`);
  log(`企业总数 ${all.length} 家待适配；本次队列 ${run.length} 家${LIMIT ? `（--limit ${LIMIT}）` : ""}${RETRY ? "（--retry 含重试）" : ""}`);
  if (!run.length) {
    log("没有要跑的企业。");
    return;
  }
  if (DRY_RUN) {
    run.forEach((c, i) => console.log(`  ${String(i + 1).padStart(3)}. ${c.name}  ${c.url}`));
    log("--dry-run：只列出，不执行。");
    return;
  }

  const tally = {};
  for (const [i, company] of run.entries()) {
    log(`▶ [${i + 1}/${run.length}] ${company.name} — 开始（单次最长 14 分钟）`);
    const r = await adaptOne(company);
    tally[r.outcome] = (tally[r.outcome] || 0) + 1;
    state.attempted[company.name] = { outcome: r.outcome, detail: r.detail, at: new Date().toISOString() };
    writeState(state);
    const mark = { done: "✅", error: "❌" }[r.outcome] || "⚠️";
    log(`  ${mark} ${company.name} → ${r.outcome}（${r.detail}）`);
  }

  log("");
  log("=== 本轮汇总 ===");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) log(`  ${k}: ${v}`);
  log(`  明细见 ${path.relative(ROOT, STATE_FILE)}`);
  log("");
  log("下一步：");
  log("  · 适配成功的候选会在页面上自动验收；没通过的看 plugins.local/<候选>/ACCEPTANCE.md");
  log("  · 出现「等待路线审核」的，要在页面里先批准新域名，再对同一企业重跑");
  log("  · 遇登录/验证码/CDN 拦截的企业，按 SOP 需要人工介入，脚本不会绕过");
}

main().catch((e) => {
  console.error(`\n中断：${e.message}\n`);
  process.exit(1);
});
