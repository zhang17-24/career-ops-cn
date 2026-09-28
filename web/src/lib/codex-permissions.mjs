import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Per-CLI consent for the one thing that needs more than a normal run: letting
// an agent CLI run with blanket write approval so the enterprise-adapter flow
// can create a plugin.
//
// The file is keyed BY CLI, and that is the point of the module. A user who
// ticked "Codex full access" consented to Codex running unrestricted — not to
// the same thing happening under a different runtime they picked later. A
// shared boolean would silently widen one grant into another, which is exactly
// the failure this module exists to prevent.
//
// Backward compatible in the only safe direction: a legacy `{ fullAccess: true }`
// file keeps Codex granted and leaves WorkBuddy ungranted. Compatibility may
// never ADD consent.

export const permissionFile = () => path.join(process.cwd(), ".codex-permissions.local.json");

/** Codex's key. Kept as `fullAccess` so existing files keep working. */
const KEY_CODEX = "fullAccess";
/** WorkBuddy's key. Absent in every file written before this existed. */
const KEY_WORKBUDDY = "workbuddyFullAccess";

/**
 * Read and shape-check the settings document.
 *
 * A missing file is an empty document (nothing granted). Anything unparseable
 * throws rather than degrading to "nothing granted" — the difference matters
 * because the save path calls this first, and a silent `{}` there would
 * overwrite a user's hand-edited file with a blank one.
 *
 * @param {string} file
 * @returns {Record<string, unknown>}
 */
function readDoc(file) {
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return {};
    throw new Error("无法读取 AI 工具权限设置，请修复配置文件");
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("AI 工具权限设置格式错误");
  }
  return value;
}

/**
 * Read one CLI's flag. Absent means not granted; a present-but-wrong type is a
 * corrupt file, not a `false` — quietly reading `"yes"` as falsy would report
 * "not granted" for a file the user believes says otherwise.
 */
function readFlag(file, key, label) {
  const doc = readDoc(file);
  const value = doc[key];
  if (value === undefined) return false;
  if (typeof value !== "boolean") throw new Error(`${label} 权限设置格式错误`);
  return value;
}

/**
 * Write one CLI's flag, preserving every other key.
 *
 * Read-modify-write on purpose: the two CLIs share one file, so a save that
 * wrote only its own key would revoke the other CLI's consent as a side effect
 * of an unrelated toggle.
 */
function saveFlag(key, value, file) {
  if (typeof value !== "boolean") throw new Error(`${key} 必须是布尔值`);
  const doc = readDoc(file); // Never overwrite malformed user settings.
  doc[key] = value;
  const temp = file + "." + randomUUID();
  try {
    fs.writeFileSync(temp, JSON.stringify(doc) + "\n", { flag: "wx", mode: 0o600 });
    fs.renameSync(temp, file);
  } finally {
    fs.rmSync(temp, { force: true });
  }
  return { [key]: value };
}

export function readCodexPermissions(file = permissionFile()) {
  return { fullAccess: readFlag(file, KEY_CODEX, "Codex") };
}
export function saveCodexPermissions(fullAccess, file = permissionFile()) {
  return saveFlag(KEY_CODEX, fullAccess, file);
}

/**
 * WorkBuddy's consent flag.
 *
 * Separate from `readCodexPermissions` on purpose — see the header. The
 * enterprise-adapter runtime refuses to run without it, so a user who only ever
 * enabled Codex gets a clear "enable WorkBuddy access first" rather than an
 * agent quietly writing files under a grant they never gave.
 */
export function readWorkbuddyPermissions(file = permissionFile()) {
  return { fullAccess: readFlag(file, KEY_WORKBUDDY, "WorkBuddy") };
}
export function saveWorkbuddyPermissions(fullAccess, file = permissionFile()) {
  return saveFlag(KEY_WORKBUDDY, fullAccess, file);
}

export function codexPermissionArgs(bin, args, fullAccess) {
  if (!fullAccess || !/^codex(?:\.exe)?$/.test(path.basename(bin)) || args[0] !== "exec") return args;
  return [args[0], "--sandbox", "danger-full-access", "-c", 'approval_policy="never"', ...args.slice(1)];
}

export function localPermissionRequest(req) {
  const host = req.headers.get("host");
  if (!host || !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host)) return false;
  return req.headers.get("origin") === `http://${host}` && req.headers.get("content-type")?.split(";")[0] === "application/json";
}
