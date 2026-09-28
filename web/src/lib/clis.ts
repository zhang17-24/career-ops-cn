import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { codexStreamArgs, isFatalClaudeStderr, isFatalCodexStderr, isTerminalClaudeLine, isTerminalCodexLine, parseClaudeEvent, parseCodexEvent, workbuddyStreamArgs } from "./run-cli-support.mjs";
import { workbuddyCliDirs } from "./cli-search-dirs.mjs";

// Server-only (node imports). The agnostic runtimes career-ops can delegate to
// in headless mode (AGENTS.md). Install URLs from career-ops-docs.
export type CliSpec = {
  id: string;
  name: string;
  bin: string;
  run: string;
  url: string;
  /** headless invocation args for a single prompt, emitting PLAIN TEXT on stdout.
   * Every caller that reads the output itself (the `<<offer:>>`/`<<cv:>>` envelope
   * routes, the apply planners) uses this, so it must stay unstructured. */
  args: (prompt: string) => string[];
  /** Structured-output CLIs only: args for a run whose stdout the caller parses
   * with `parseEvent` — i.e. /api/run's dashboard stream, the one consumer that
   * understands events. Absent → that caller falls back to `args`.
   *
   * INVARIANT: `parseEvent` only applies to output produced by THIS argv (for
   * claude, by claude-invocation.mjs's `claudeCliArgs`, which spells its own
   * `--output-format stream-json`). Pairing one CLI's parser with a plain-text
   * invocation yields a silent stream of unparseable lines. */
  streamArgs?: (prompt: string) => string[];
  /** Structured-output CLIs only: parse one stdout line into dashboard events.
   * Absent → the route streams stdout as raw text (the default for every CLI
   * without its own structured output format). */
  parseEvent?: (line: string) => import("./run-cli-support.mjs").ParsedEvent | null;
  /** Structured-output CLIs only: decide whether a stderr line is fatal.
   * Absent → the route falls back to the shared generic error regex. */
  stderrIsFatal?: (line: string) => boolean;
  /** Structured-output CLIs only: whether a stdout line marks the END of the run.
   *
   * Absent → the route waits for stdout EOF, which is what every non-structured
   * CLI does anyway. Present → the route stops waiting shortly after this line,
   * so a CLI that leaves a child process holding the pipe can't turn a finished
   * run into a 780s "timeout" (see LINGER_GRACE_MS in api/run/route.ts).
   *
   * A separate hook rather than a field on ParsedEvent: the parsers answer "what
   * payload is this", and parseClaudeEvent returns null for a payload-free
   * `result` — a contract pinned by exact-shape assertions in
   * run-cli-support.test.mjs. Widening ParsedEvent would have rewritten those
   * assertions for no functional gain. */
  isTerminal?: (line: string) => boolean;
};

/**
 * NO RUNTIME HERE MAY GRANT ITSELF MORE PERMISSION THAN THE AUDITED ONE.
 *
 * The permission model is per-worker AND per-CLI, but only one axis is written
 * down: WRITE_CAPABLE_TOOLS and the per-kind deny lists live in
 * claude-invocation.mjs — i.e. on Claude's path. A new CLI arriving with a
 * blanket auto-approve flag (`--always-approve`, `--yolo`,
 * `--dangerously-skip-permissions`, `--yes`) is not breaking that rule; it is
 * entering where the rule does not exist.
 *
 * Concretely: the `pdf` worker has Bash explicitly denied and must never regain
 * it. Pair Grok with `--always-approve` and that same worker gets Write and
 * Bash auto-approved — so the user's choice of runtime silently changes what a
 * worker may do to their files, while both paths look identical in the UI.
 *
 * If a CLI has no per-tool deny list to pair with, the answer is NOT to
 * auto-approve: it is to withhold the workers that write. Needing such a flag
 * to make a runtime work is a core architecture issue, not a line inside a
 * CLI-support PR.
 *
 * Enforced by tests/lib/clis-permissions.test.mjs, because a rule that only
 * lives in a comment is a rule the next contributor may never read.
 */
export const KNOWN: CliSpec[] = [
  { id: "claude", name: "Claude Code", bin: "claude", run: "claude -p", url: "https://claude.ai/code", args: (p) => ["-p", p], parseEvent: parseClaudeEvent, stderrIsFatal: isFatalClaudeStderr, isTerminal: isTerminalClaudeLine },
  // WorkBuddy ships the CodeBuddy Code CLI inside its app bundle, so `bin` is
  // `codebuddy`, not `workbuddy`. Same structured-output shape as Claude (it is
  // a Claude Code fork), hence parseClaudeEvent/stderrIsFatal are shared —
  // measured 2026-09-19 against real captured events: stream_event,
  // content_block_delta, cache_creation_input_tokens and is_error all match.
  //
  // No permission flag here on purpose. Headless runs need the bypass
  // permission mode before ANY tool works (measured: with an explicit tool
  // whitelist that included Bash but no permission mode, Bash was refused),
  // but that flag belongs behind the consent toggle in
  // workbuddy-adapter-runtime.mjs — see the KNOWN header above and
  // claude-invocation.mjs. Spelling it out here would trip
  // clis-permissions.test.mjs, which is the guard doing its job.
  { id: "workbuddy", name: "WorkBuddy", bin: "codebuddy", run: "codebuddy -p", url: "https://www.workbuddy.cn", args: (p) => ["-p", p], streamArgs: workbuddyStreamArgs, parseEvent: parseClaudeEvent, stderrIsFatal: isFatalClaudeStderr, isTerminal: isTerminalClaudeLine },
  { id: "codex", name: "Codex", bin: "codex", run: "codex exec", url: "https://github.com/openai/codex", args: (p) => ["exec", p], streamArgs: codexStreamArgs, parseEvent: parseCodexEvent, stderrIsFatal: isFatalCodexStderr, isTerminal: isTerminalCodexLine },
  { id: "gemini", name: "Gemini CLI", bin: "gemini", run: "gemini -p", url: "https://github.com/google-gemini/gemini-cli", args: (p) => ["-p", p] },
  { id: "opencode", name: "OpenCode", bin: "opencode", run: "opencode run", url: "https://opencode.ai", args: (p) => ["run", p] },
  { id: "copilot", name: "GitHub Copilot CLI", bin: "copilot", run: "copilot -p", url: "https://docs.github.com/en/copilot/github-copilot-in-the-cli", args: (p) => ["-p", p] },
  { id: "qwen", name: "Qwen CLI", bin: "qwen", run: "qwen -p", url: "https://qwen.ai/qwencode", args: (p) => ["-p", p] },
  { id: "antigravity", name: "Antigravity CLI", bin: "agy", run: "agy -p", url: "https://antigravity.google", args: (p) => ["-p", p] },
  // Grok Build also speaks `--output-format streaming-json`, but that is its own
  // schema, not Claude's `stream-json` — and the run route only parses the
  // latter. Plain `-p` streams text, which is what every other non-Claude entry
  // here does.
  { id: "grok", name: "Grok Build CLI", bin: "grok", run: "grok -p", url: "https://docs.x.ai/build/overview", args: (p) => ["-p", p] },
];

function searchDirs(): string[] {
  const home = os.homedir();
  const extra = [
    path.join(home, ".local/bin"),
    path.join(home, ".grok/bin"), // Grok Build CLI
    path.join(home, ".npm-global/bin"),
    path.join(home, ".bun/bin"),
    path.join(home, ".deno/bin"),
    path.join(home, ".opencode/bin"),
    // App-bundled CLIs. WorkBuddy ships `codebuddy` inside its own .app, where
    // no PATH entry will ever point — see cli-search-dirs.mjs for why only
    // macOS is listed.
    ...workbuddyCliDirs(process.platform),
    "/opt/homebrew/bin",
    "/usr/local/bin",
    "/usr/bin",
  ];
  if (process.platform === "win32") {
    // Windows CLIs frequently install under per-user AppData roots and don't
    // reliably add themselves to PATH (e.g. Antigravity → %LOCALAPPDATA%\agy\bin).
    const localAppData = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    const appData = process.env.APPDATA || path.join(home, "AppData", "Roaming");
    extra.push(
      path.join(localAppData, "agy", "bin"), // Antigravity CLI
      path.join(localAppData, "grok", "bin"), // Grok Build CLI
      path.join(localAppData, "Microsoft", "WindowsApps"), // winget/Store shims
      path.join(appData, "npm"), // npm global prefix on Windows
    );
  }
  const fromPath = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  return [...new Set([...fromPath, ...extra])];
}

// On Windows, executables carry an extension (claude.exe, claude.cmd, ...).
// Mirror the shell's PATHEXT resolution so a native-installer claude.exe is
// found, not just an extensionless npm shim. On POSIX, "" keeps the bare name.
function binCandidates(bin: string): string[] {
  if (process.platform !== "win32") return [bin];
  const pathext = process.env.PATHEXT || ".COM;.EXE;.BAT;.CMD";
  const exts = pathext
    .split(";")
    .map((e) => e.trim())
    .filter(Boolean)
    // Only include extensions that `child_process.spawn()` can execute directly.
    .filter((e) => [".com", ".exe", ".bat", ".cmd"].includes(e.toLowerCase()));

  // Try the bare name too (some environments provide an extensionless shim).
  return [bin, ...exts.map((ext) => bin + ext)];
}

export function findBin(bin: string, dirs = searchDirs()): string | null {
  for (const dir of dirs) {
    for (const candidate of binCandidates(bin)) {
      const p = path.join(dir, candidate);
      try {
        fs.accessSync(p, fs.constants.X_OK);
        return p;
      } catch {
        /* not here */
      }
    }
  }
  return null;
}

export function detectClis() {
  const dirs = searchDirs();
  return KNOWN.map((c) => {
    const found = findBin(c.bin, dirs);
    return { id: c.id, name: c.name, run: c.run, url: c.url, installed: !!found, path: found };
  });
}

export function resolveCli(id: string): { spec: CliSpec; binPath: string } | null {
  const spec = KNOWN.find((c) => c.id === id);
  if (!spec) return null;
  const binPath = findBin(spec.bin);
  if (!binPath) return null;
  return { spec, binPath };
}
