// WorkBuddy CLI 的 argv 契约与解析器兼容性。
//
// 两个模块级契约在这里被锁死：
//   1. workbuddyStreamArgs 产出的 argv，必须让 parseClaudeEvent 认得出文本。
//      `--include-partial-messages` 缺失时 CLI 只发整条 `assistant` 消息，
//      解析器不认识该类型 → 页面一个字都看不到 → 诚实门判成"未产出"。
//   2. parseClaudeEvent 必须吃得下 WorkBuddy 特有的噪声事件（ai-title、
//      file-history-snapshot、user 等 Claude 不发的类型）。对未知类型抛错
//      会让整个运行在 stdout 处理器里炸掉。
//
// fixture 是 2026-09-19 从本机真实运行抓取并脱敏的，不是手写样本：
// 手写样本只能证明"我以为它长这样"。
//
// Run:  node --test tests/lib/workbuddy-cli.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { workbuddyStreamArgs, parseClaudeEvent } from "../../src/lib/run-cli-support.mjs";
import { workbuddyCliDirs } from "../../src/lib/cli-search-dirs.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(HERE, "..", "fixtures", "workbuddy-events.jsonl");
const events = readFileSync(FIXTURE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));

/** 用真实 fixture 里第一条匹配的事件喂解析器。 */
function parseFirst(pred) {
  const ev = events.find(pred);
  assert.ok(ev, "fixture 里缺少该形态的事件 — fixture 被改瘦了？");
  return { raw: ev, parsed: parseClaudeEvent(JSON.stringify(ev)) };
}

test("UT-01 workbuddyStreamArgs 的 argv 契约", () => {
  const args = workbuddyStreamArgs("PROMPT");

  assert.equal(args[0], "-p", "必须是 -p（无头单轮）");
  const fmt = args.indexOf("--output-format");
  assert.ok(fmt !== -1, "缺 --output-format");
  assert.equal(args[fmt + 1], "stream-json", "--output-format 必须是 stream-json");

  // 缺它 → 没有 content_block_delta → 解析器收不到文本 → 误报"无输出"。
  assert.ok(args.includes("--include-partial-messages"), "缺 --include-partial-messages");

  // 隔离要求：会话不落盘，避免与桌面端 App 争抢 ~/.workbuddy。
  assert.ok(args.includes("--no-session-persistence"), "缺 --no-session-persistence");

  assert.equal(args[args.length - 1], "PROMPT", "prompt 必须是最后一个位置参数且逐字保留");

  // 放行参数只允许出现在适配器运行时，绝不能出现在通用 argv 里。
  for (const forbidden of ["--permission-mode", "bypassPermissions", "-y", "--dangerously-skip-permissions"]) {
    assert.ok(!args.includes(forbidden), `通用 argv 不得携带放行参数 ${forbidden}`);
  }
});

test("UT-02-1 system/init → Agent ready", () => {
  const { parsed } = parseFirst((e) => e.type === "system" && e.subtype === "init");
  assert.deepEqual(parsed, { status: "Agent ready" });
});

test("UT-02-2 content_block_delta → 文本增量", () => {
  const { parsed } = parseFirst((e) => e.event?.type === "content_block_delta" && e.event.delta?.text);
  assert.equal(typeof parsed?.text, "string");
  assert.ok(parsed.text.length > 0);
});

test("UT-02-3 content_block_start(tool_use) → 工具名", () => {
  const { raw, parsed } = parseFirst(
    (e) => e.event?.type === "content_block_start" && e.event.content_block?.type === "tool_use",
  );
  assert.equal(parsed?.tool, raw.event.content_block.name);
});

test("UT-02-4 result 的 token 用加法（Claude 约定，不是 Codex 的减法）", () => {
  const { raw, parsed } = parseFirst((e) => e.type === "result" && e.is_error === false && e.usage);
  const u = raw.usage;
  assert.equal(
    parsed.tokens,
    u.input_tokens + u.output_tokens + u.cache_creation_input_tokens,
    "input+output+cache_creation —— 用 Codex 的减法会在这里露馅",
  );
});

test("UT-02-5 total_cost_usd 为 0 是已报告的值，不是缺失", () => {
  const { raw, parsed } = parseFirst((e) => e.type === "result" && e.total_cost_usd === 0);
  assert.equal(raw.total_cost_usd, 0);
  assert.equal(parsed.costUsd, 0, "0 必须原样上报，不能被当成缺失而丢掉");
});

test("UT-02-6 真实错误 result → error，且仍上报已消耗的 token", () => {
  const { raw, parsed } = parseFirst((e) => e.type === "result" && e.is_error === true);
  assert.match(raw.subtype, /^error/);
  assert.equal(typeof parsed.error, "string");
  assert.ok(parsed.error.length > 0, "错误诊断不能是空串");
  assert.ok(parsed.tokens > 0, "失败也要记消耗 —— 丢掉会少算用户最想看的那些运行");
});

test("UT-02-7/8 未知与噪声事件必须返回 null，且绝不抛错", () => {
  // WorkBuddy 会发 Claude 不发的类型。抛错 = 整个运行在 stdout 处理器里炸掉。
  const noise = events.filter(
    (e) => e.type !== "result" && !(e.type === "system" && e.subtype === "init") && e.type !== "stream_event",
  );
  assert.ok(noise.length >= 2, "fixture 里应至少有两种非 stream_event 噪声事件");
  for (const e of noise) {
    assert.doesNotThrow(() => parseClaudeEvent(JSON.stringify(e)), `类型 ${e.type} 抛错了`);
  }
  // 整条 assistant 消息（非增量）不产出事件 —— 文本只走 delta 通道。
  const assistant = events.find((e) => e.type === "assistant");
  assert.equal(parseClaudeEvent(JSON.stringify(assistant)), null, "assistant 整条消息不应产出事件");
});

test("UT-02-9 畸形输入返回 null，不抛错", () => {
  for (const junk of ["null", "123", '"str"', "[]", "{}", "not json", ""]) {
    assert.doesNotThrow(() => parseClaudeEvent(junk), `输入 ${JSON.stringify(junk)} 抛错了`);
    assert.equal(parseClaudeEvent(junk), null);
  }
});

test("UT-08 workbuddyCliDirs 只在本平台给出路径", () => {
  const mac = workbuddyCliDirs("darwin");
  assert.ok(mac.some((d) => d.includes("WorkBuddy.app") && d.endsWith("/cli/bin")), "darwin 应给出应用包 cli/bin");

  // 跨平台泄漏 = 在 Linux 上指向一个不存在的 macOS 路径，选项会假显示为"未安装"。
  for (const other of ["win32", "linux", "freebsd"]) {
    const dirs = workbuddyCliDirs(other);
    assert.ok(!dirs.some((d) => d.includes("WorkBuddy.app")), `${other} 不应包含 macOS 路径`);
  }

  // 未验证的平台必须返回空数组（诚实：宁可选项不出现，也不要假的可用性）。
  assert.deepEqual(workbuddyCliDirs("linux"), [], "linux 路径未验证，应返回空");
});
