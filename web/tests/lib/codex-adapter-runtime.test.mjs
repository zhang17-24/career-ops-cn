import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareCodexAdapter, missingAcceptanceReason } from "../../src/lib/codex-adapter-runtime.mjs";
test("Ego preflight accepts stderr, cleans scratch, and preserves incomplete status", async () => {
  const cwd = process.cwd();
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "career-preflight-test-")));
  const candidateId = "company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9";
  const dir = path.join(root, "plugins.local", candidateId);
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(root, ".codex-permissions.local.json"), '{"fullAccess":true}');
  process.chdir(root);
  try {
    let scratch;
    const run = async (bin, args, options) => {
      scratch = options.env.TMPDIR;
      return bin === "/bin/zsh" ? {stdout:"", stderr:'{"ready":true}'} : {stdout:"danger-full-access",stderr:""};
    };
    const result = await prepareCodexAdapter({root,candidateId,binPath:"codex",prompt:"test"},run);
    assert.match(result.args.at(-1), /Ego Lite/);
    assert.ok(fs.existsSync(scratch)); result.dispose(); result.dispose();
    assert.equal(fs.existsSync(scratch), false);
    assert.match(missingAcceptanceReason(dir), /未产出/);
    fs.writeFileSync(path.join(dir, "BLOCKED.md"), "浏览器不可用");
    assert.match(missingAcceptanceReason(dir), /浏览器不可用/);
    fs.writeFileSync(path.join(dir, "ACCEPTANCE.md"), "尚未核验");
    assert.match(missingAcceptanceReason(dir), /浏览器不可用/);
    await assert.rejects(prepareCodexAdapter({root,candidateId,binPath:"codex",prompt:"test"}, async () => {throw new Error("failure");}), /未调用 AI/);
    fs.writeFileSync(path.join(root, ".codex-permissions.local.json"), '{"fullAccess":false}');
    let called = false;
    await assert.rejects(prepareCodexAdapter({root,candidateId,binPath:"codex",prompt:"test"}, async () => { called = true; }), /未调用 AI/);
    assert.equal(called, false);
  } finally { process.chdir(cwd); fs.rmSync(root, {recursive:true,force:true}); }
});
