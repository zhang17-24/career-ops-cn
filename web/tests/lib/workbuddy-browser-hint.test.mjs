// 浏览器约束里的 ego-browser 技能路径提示。
//
// 背景：2026-09-20 00:32 的端到端复测里，Agent 13 分钟几乎全花在摸索 ego-browser
// ——13 次 `ego-browser nodejs -e`、多次 `which ego-browser`、去
// ~/.agents/skills、~/.codex/skills、~/.claude/skills 找"ego-browser 技能"、dig、curl。
//
// 根因：prompt 说"必须使用 ego-browser 技能"，但 Ego Lite 的技能文档在
// ~/.local/share/ego/ego-skills/SKILL.md，不在 WorkBuddy 的技能发现路径上。
// Codex 那条路能直接找到，所以不会 flail；WorkBuddy 找不到就反复试。
//
// 修法：把技能文档的**绝对路径**写进约束，并明确说"不要去那几个目录找"。
// 关键设计：只有该文件确实存在时才写路径 —— 指向一个不存在的文件比不指更糟。
//
// Run:  node --test tests/lib/workbuddy-browser-hint.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import { egoSkillPath, buildBrowserConstraint } from "../../src/lib/workbuddy-adapter-runtime.mjs";

test("UT-B1 egoSkillPath 由 home 推导，不硬编码用户目录", () => {
  assert.equal(egoSkillPath("/Users/someone"), "/Users/someone/.local/share/ego/ego-skills/SKILL.md");
  assert.equal(egoSkillPath("/home/x"), "/home/x/.local/share/ego/ego-skills/SKILL.md");
});

test("UT-B2 技能存在时，约束里带上绝对路径与「别去别处找」的说明", () => {
  const c = buildBrowserConstraint({ skillPath: "/p/ego-skills/SKILL.md", skillExists: true });
  assert.ok(c.includes("/p/ego-skills/SKILL.md"), "必须给出技能文档的绝对路径");
  assert.match(c, /不要到/, "必须明确劝阻去其他技能目录翻找");
  // 既有约束不能被挤掉
  assert.match(c, /ego-browser/);
  assert.match(c, /Ego Lite/);
  assert.match(c, /Web DevHandler/);
  assert.match(c, /不要启动子 Agent/);
  assert.match(c, /TMPDIR/);
});

test("UT-B3 技能不存在时，不写路径（指向不存在的文件比不指更糟）", () => {
  const c = buildBrowserConstraint({ skillPath: "/p/ego-skills/SKILL.md", skillExists: false });
  assert.ok(!c.includes("/p/ego-skills/SKILL.md"), "文件不存在时不得给出该路径");
  // 其余约束照旧
  assert.match(c, /ego-browser/);
  assert.match(c, /Ego Lite/);
  assert.match(c, /不要启动子 Agent/);
});

test("UT-B4 无参数时用真实 home 推导（冒烟，不依赖文件是否存在）", () => {
  const c = buildBrowserConstraint();
  assert.equal(typeof c, "string");
  assert.ok(c.length > 0);
  assert.match(c, /ego-browser/);
});
