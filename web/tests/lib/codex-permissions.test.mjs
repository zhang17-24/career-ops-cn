import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readCodexPermissions, saveCodexPermissions, codexPermissionArgs, localPermissionRequest } from "../../src/lib/codex-permissions.mjs";
test("consent persists and only Codex exec changes; malformed settings fail closed", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "career-permissions-test-"));
  const file = path.join(dir, "settings.json");
  try {
    assert.equal(readCodexPermissions(file).fullAccess, false);
    saveCodexPermissions(true, file);
    assert.equal(readCodexPermissions(file).fullAccess, true);
    const args = ["exec", "--json", "hello"];
    assert.deepEqual(codexPermissionArgs("/bin/codex", args, true), ["exec", "--sandbox", "danger-full-access", "-c", 'approval_policy="never"', "--json", "hello"]);
    assert.equal(codexPermissionArgs("claude", args, true), args);
    assert.equal(codexPermissionArgs("codex", args, false), args);
    assert.deepEqual(args, ["exec", "--json", "hello"]);
    saveCodexPermissions(false, file);
    assert.equal(readCodexPermissions(file).fullAccess, false);
    fs.writeFileSync(file, "broken");
    assert.throws(() => saveCodexPermissions(true, file));
    assert.equal(fs.readFileSync(file, "utf8"), "broken");
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test("permission API rejects cross-origin and non-loopback writes", () => {
  const request = (host, origin) => new Request("http://localhost/api/codex-permissions", {headers:{host, origin, "content-type":"application/json"}});
  assert.equal(localPermissionRequest(request("localhost:3187", "http://localhost:3187")), true);
  assert.equal(localPermissionRequest(request("localhost:3187", "https://evil.example")), false);
  assert.equal(localPermissionRequest(request("evil.example", "http://evil.example")), false);
});
