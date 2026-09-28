import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { workbuddyStreamArgs } from "./run-cli-support.mjs";
import { readWorkbuddyPermissions } from "./codex-permissions.mjs";

// WorkBuddy's equivalent of codex-adapter-runtime.mjs: the preflight and argv
// that let the enterprise-adapter flow (adapt-provider) run on the CodeBuddy
// Code CLI that WorkBuddy ships inside its app bundle.
//
// Preflight never calls a model and never visits a recruitment site. It only
// proves the environment can run the agent at all, so a broken setup fails
// before any Token is spent.
//
// Two things differ from the Codex path, and both are load-bearing:
//
//   1. CONFIG-DIR ISOLATION. The bundled CLI defaults its config dir to the same
//      `~/.workbuddy` the desktop app uses. Measured 2026-09-19: an unisolated
//      run writes `wb-<cwd>__*.log` into the app's own log directory, and the
//      two processes end up refreshing the same credential — the CLI's first
//      call after idle returns 401 and the desktop app gets signed out. Pinning
//      CODEBUDDY_CONFIG_DIR to a project-local directory moved every byte of
//      state (69 MB across repeated runs) out of `~/.workbuddy`, whose file
//      count did not change at all.
//
//   2. A TOOL WHITELIST. The CLI exposes 34+ tools in a headless run, including
//      ComputerUse (drives the user's desktop), Agent/TeamCreate (unbounded
//      sub-agent fan-out), CronCreate (schedules work beyond this task) and
//      PowerShell (a second write-capable shell on Windows). `--tools` is
//      enforced: with Bash excluded the model reported it had no shell, with
//      Bash included it actually ran the command. Note the init event's `tools`
//      array is a REGISTRY, not the enabled set — it stays at 34 either way, so
//      a list-based assertion would pass vacuously.

/** The only tools an adapter run needs. Bash is required: ego-browser is a shell command. */
export const WORKBUDDY_ALLOWED_TOOLS = Object.freeze([
  "Read",
  "Write",
  "Edit",
  "Bash",
  "Glob",
  "Grep",
  "WebFetch",
  "WebSearch",
]);

/**
 * Where Ego Lite keeps its own API reference.
 *
 * Derived from `home` rather than hardcoded so it stays correct for any user,
 * and exposed so a test can pin the derivation.
 */
export function egoSkillPath(home = os.homedir()) {
  return path.join(home, ".local", "share", "ego", "ego-skills", "SKILL.md");
}

/**
 * The browser constraint appended to the prompt.
 *
 * The skill-path sentence is the whole point. Measured 2026-09-20: told only
 * "must use the ego-browser skill", the agent spent 13 minutes hunting for it —
 * `which ego-browser`, `ls ~/.agents/skills/`, `~/.codex/skills/`,
 * `~/.claude/skills/` — and never got as far as writing the adapter. Ego Lite's
 * docs live in its own directory, which is not on WorkBuddy's skill-discovery
 * path; Codex finds it, which is why that runtime never flails the same way.
 *
 * The path is only stated when the file actually exists: pointing at a missing
 * file would send the agent hunting again, just with a more specific dead end.
 *
 * @param {{skillPath?: string, skillExists?: boolean}} [opts]
 * @returns {string}
 */
export function buildBrowserConstraint({ skillPath = egoSkillPath(), skillExists = fs.existsSync(skillPath) } = {}) {
  const hint = skillExists
    ? `ego-browser 的完整 API 文档在 ${skillPath}，动手前先读它；不要到 ~/.agents/skills、~/.codex/skills、~/.claude/skills 等目录寻找浏览器技能——那里没有。`
    : "";
  return `浏览器必须使用 ego-browser 和 Ego Lite，不使用 Web DevHandler。${hint}每个候选使用独立任务空间，不操作用户常驻项目页；遇用户接管立即停止。任务范围仅允许修改本候选目录；不要改全局配置或自行投递。临时文件使用 TMPDIR。完成后清理本次任务空间。不要启动子 Agent。`;
}

/** Where the CLI keeps its own state, kept out of the desktop app's `~/.workbuddy`. */
export function isolatedConfigDir(root) {
  return path.join(root, ".workbuddy-cli-isolated");
}

/**
 * Host-shell sandbox shims that must NOT reach the adapter's child process.
 *
 * Measured 2026-09-19: with these inherited, the CLI could not install its own
 * built-in plugin marketplaces into a fresh config dir —
 * `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":3928,"threshold":50}`
 * — so `agent-browser` never became available and the adapter agent had no
 * browser to work with. The shim wraps `fs.rmSync` process-wide, and the CLI's
 * own install path deletes thousands of files.
 *
 * These are injected into an *agent shell* by WorkBuddy. A user starting the
 * server from a normal terminal would not have them, so this is not a
 * user-environment problem — it is the adapter leaking its host's environment
 * into a task that never asked for it.
 */
const DROPPED_ENV_KEYS = Object.freeze([
  "BASH_ENV", // injects rm/unlink/rmdir wrappers into every bash subprocess
  "GENIE_TRASH_DIR",
  // The host agent session's MCP config carries a session-scoped bearer token and
  // points at this session's connector proxy. Passing it down hands the adapter
  // task the host's whole tool surface — and `--tools` does NOT filter MCP tools
  // (measured: `mcp__*` entries survive a whitelist), so env is the only place
  // this can be stopped.
  "CODEBUDDY_MCP_CONFIG",
  "WORKBUDDY_EXTRA_PATHS",
]);
const DROPPED_ENV_PREFIXES = Object.freeze(["CODEBUDDY_SAFE_DELETE_"]);

/** Identifies the safe-delete preload inside NODE_OPTIONS. */
const NODE_OPTIONS_SHIM_MARKER = "genie-safe-delete";

/**
 * Split a command-line-ish string on whitespace, respecting quotes and keeping
 * each token's original text (quotes included).
 *
 * Keeping the quotes matters: NODE_OPTIONS is re-parsed by Node, and the real
 * shim path contains a space (`/Applications/WorkBuddy AI.app/...`). A tokenizer
 * that stripped quotes would silently corrupt any other quoted option it kept.
 */
function splitRespectingQuotes(value) {
  const tokens = [];
  let current = "";
  let quote = null;
  for (const ch of String(value)) {
    if (quote) {
      current += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (current) tokens.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

/**
 * Strip the host agent shell's sandbox shims from an inherited environment.
 *
 * `NODE_OPTIONS` is EDITED, not deleted. It can legitimately carry
 * `--use-system-ca` (TLS trust in corporate setups), so only the `--require`
 * entry pointing at the safe-delete shim is removed — deleting the whole
 * variable would trade "the plugin market won't install" for "the network
 * doesn't work".
 *
 * Returns a new object; the input is never mutated.
 *
 * @param {Record<string, string | undefined>} source
 * @returns {Record<string, string | undefined>}
 */
export function sanitizeInheritedEnv(source) {
  const out = { ...source };
  for (const key of Object.keys(out)) {
    if (DROPPED_ENV_KEYS.includes(key) || DROPPED_ENV_PREFIXES.some((p) => key.startsWith(p))) {
      delete out[key];
    }
  }
  if (typeof out.NODE_OPTIONS === "string") {
    const kept = splitRespectingQuotes(out.NODE_OPTIONS).filter((t) => !t.includes(NODE_OPTIONS_SHIM_MARKER));
    // An empty string is not equivalent to "unset" — Node rejects it outright,
    // so the key is removed rather than left blank.
    if (kept.length > 0) out.NODE_OPTIONS = kept.join(" ");
    else delete out.NODE_OPTIONS;
  }
  return out;
}

/**
 * Prove Ego Lite is reachable.
 *
 * Deliberately duplicated from codex-adapter-runtime.mjs rather than extracted
 * into a shared helper: the Codex path is audited and working, and the brief for
 * this change was to ADD a route without disturbing it. Four duplicated lines
 * are the cheaper half of that trade. If a third runtime ever needs this, the
 * extraction becomes worth the churn.
 */
async function egoPreflight(run, { cwd, env }) {
  const ready = await run(
    "/bin/zsh",
    ["-c", "ego-browser nodejs <<'EGO_PREFLIGHT'\ncliLog({ready: true, spaces: (await listTaskSpaces()).length});\nEGO_PREFLIGHT"],
    { cwd, env, timeout: 20000, maxBuffer: 100000 },
  );
  // Ego's cliLog writes to stderr, even on success.
  if (!/"?ready"?\s*:\s*true/.test(ready.stdout + ready.stderr)) throw new Error("Ego Lite 未返回连接成功标记");
}

/**
 * Preflight, then return the argv/env to spawn the adapter agent with.
 *
 * @param {{root: string, candidateId: string, binPath: string, prompt: string}} input
 * @param {Function} [run] - injected execFile for tests
 * @returns {Promise<{args: string[], env: NodeJS.ProcessEnv, dispose: () => void, warmup: (o?: object) => Promise<void>}>}
 */
export async function prepareWorkbuddyAdapter({ root, candidateId, binPath, prompt }, run = promisify(execFile)) {
  if (!readWorkbuddyPermissions().fullAccess) {
    throw new Error("请先在设置中开启 WorkBuddy 完全访问；企业适配需要此模式。未调用 AI。");
  }
  if (!/^company-[a-f0-9-]{36}$/.test(candidateId)) throw new Error("候选编号不正确");

  const realRoot = fs.realpathSync(root);
  const candidateDir = path.join(realRoot, "plugins.local", candidateId);
  if (fs.realpathSync(candidateDir) !== candidateDir) throw new Error("候选路径不能包含符号链接");

  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "career-adapter-wb-"));
  const configDir = isolatedConfigDir(realRoot);
  fs.mkdirSync(configDir, { recursive: true });

  let disposed = false;
  const dispose = () => {
    if (!disposed) {
      disposed = true;
      // The isolated config dir is NOT removed: deleting it would force a cold
      // credential refresh on every run, which is the 401 this whole setup
      // exists to avoid. It is project-local and safe to clear by hand.
      fs.rmSync(scratch, { recursive: true, force: true });
    }
  };

  const env = {
    // Sanitized, NOT a bare spread: the host agent shell's safe-delete shim
    // would otherwise break the CLI's own plugin installation. See
    // sanitizeInheritedEnv.
    ...sanitizeInheritedEnv(process.env),
    // Both names, because the CLI reads WORKBUDDY_CONFIG_DIR first and falls
    // back to CODEBUDDY_CONFIG_DIR — either one left pointing at ~/.workbuddy
    // would defeat the isolation.
    CODEBUDDY_CONFIG_DIR: configDir,
    WORKBUDDY_CONFIG_DIR: configDir,
    TMPDIR: scratch,
    TMP: scratch,
    TEMP: scratch,
    TMPPREFIX: path.join(scratch, "zsh"),
    // dirname(process.execPath): `bin/codebuddy`'s shebang is `#!/usr/bin/env node`,
    // so a PATH without node means the CLI never starts at all.
    // ~/.local/bin: ego-browser lives there.
    PATH: [path.dirname(process.execPath), path.join(os.homedir(), ".local/bin"), process.env.PATH || ""].join(path.delimiter),
  };

  try {
    const help = await run(binPath, ["--help"], { cwd: realRoot, env, timeout: 20000, maxBuffer: 400000 });
    for (const flag of ["--output-format", "--permission-mode"]) {
      if (!help.stdout.includes(flag)) throw new Error(`WorkBuddy CLI 版本不支持 ${flag} 参数`);
    }
    for (const dir of [candidateDir, scratch]) {
      const probe = path.join(dir, ".permission-probe-" + randomUUID());
      fs.writeFileSync(probe, "probe", { flag: "wx" });
      fs.unlinkSync(probe);
    }
    await egoPreflight(run, { cwd: realRoot, env });

    // Built from workbuddyStreamArgs so the plain-text/structured argv contract
    // stays in one place; the permission and tool flags are spliced in BEFORE
    // the trailing prompt, which must remain the last argument.
    const streamArgs = workbuddyStreamArgs(prompt + "\n\n" + buildBrowserConstraint());
    const args = [
      ...streamArgs.slice(0, -1),
      // The bypass permission mode is what makes ANY tool usable in headless
      // mode — measured: with an explicit tool whitelist including Bash but no
      // permission mode, Bash was refused outright. Gated behind the user's
      // WorkBuddy consent flag above, exactly as codexPermissionArgs gates
      // danger-full-access.
      "--permission-mode",
      "bypassPermissions",
      "--tools",
      WORKBUDDY_ALLOWED_TOOLS.join(","),
      streamArgs[streamArgs.length - 1],
    ];

    return { args, env, dispose, warmup: (overrides = {}) => warmupWorkbuddyAuth({ binPath, env, cwd: realRoot, run, ...overrides }) };
  } catch (error) {
    dispose();
    const reason = error.code || (error.message?.startsWith("Command failed") ? "命令执行失败" : error.message);
    throw new Error(`适配环境预检失败（未调用 AI）：${reason}。请检查候选目录写权限及 Ego Lite 是否已启动。`);
  }
}

/**
 * Absorb the cold-start credential refresh.
 *
 * Measured 2026-09-19: the first invocation after idle returns
 * `401 Authentication required` (or, with stream-json, an empty successful
 * result) and the second one works. The CLI refreshes its own token, so the
 * retry is not papering over a broken login — but only a 401 is retryable.
 * Any other failure (`unknown option`, a missing binary) is a real problem and
 * must surface immediately instead of being retried into a timeout.
 *
 * Safe to retry because the 401 happens at the auth layer: no file is written,
 * no recruitment site is visited.
 *
 * @param {{binPath: string, env: object, cwd: string, run: Function}} ctx
 * @param {number} [attempts]
 */
export async function warmupWorkbuddyAuth({ binPath, env, cwd, run }, attempts = 2) {
  const is401 = (text) => /401|authentication required|unauthorized|not authenticated/i.test(text);
  let lastDetail = "";
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await run(
        binPath,
        ["-p", "--output-format", "stream-json", "--no-session-persistence", "Reply with exactly: OK"],
        { cwd, env, timeout: 60000, maxBuffer: 200000 },
      );
      const text = `${result.stdout || ""}${result.stderr || ""}`;
      if (is401(text)) {
        lastDetail = text.trim().slice(0, 200);
        continue;
      }
      return;
    } catch (error) {
      const text = `${error?.stderr || ""}${error?.message || ""}`;
      if (!is401(text)) throw error;
      lastDetail = text.trim().slice(0, 200);
    }
  }
  throw new Error(`WorkBuddy 凭证刷新失败，请稍后重试（已尝试 ${attempts} 次）：${lastDetail}`);
}

export { missingAcceptanceReason } from "./codex-adapter-runtime.mjs";
