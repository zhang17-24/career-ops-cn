import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { codexStreamArgs } from "./run-cli-support.mjs";
import { readCodexPermissions } from "./codex-permissions.mjs";

// Preflight never calls a model or visits a recruitment website.
export async function prepareCodexAdapter({ root, candidateId, binPath, prompt }, run = promisify(execFile)) {
  if (!readCodexPermissions().fullAccess) throw new Error("请先在设置中开启 Codex 完全访问；当前 Ego Lite 自动适配需要此模式。未调用 AI。");
  if (!/^company-[a-f0-9-]{36}$/.test(candidateId)) throw new Error("候选编号不正确");
  const realRoot = fs.realpathSync(root);
  const candidateDir = path.join(realRoot, "plugins.local", candidateId);
  if (fs.realpathSync(candidateDir) !== candidateDir) throw new Error("候选路径不能包含符号链接");
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "career-adapter-"));
  let disposed = false;
  const dispose = () => { if (!disposed) { disposed = true; fs.rmSync(scratch, { recursive: true, force: true }); } };
  const env = { ...process.env, TMPDIR: scratch, TMP: scratch, TEMP: scratch, TMPPREFIX: path.join(scratch, "zsh"),
    PATH: [path.dirname(process.execPath), path.join(os.homedir(), ".local/bin"), process.env.PATH || ""].join(path.delimiter) };
  try {
    const help = await run(binPath, ["exec", "--help"], { cwd: realRoot, env, timeout: 10000, maxBuffer: 100000 });
    if (!help.stdout.includes("danger-full-access")) throw new Error("Codex 版本不支持完全访问参数");
    for (const dir of [candidateDir, scratch]) {
      const probe = path.join(dir, ".permission-probe-" + randomUUID());
      fs.writeFileSync(probe, "probe", { flag: "wx" }); fs.unlinkSync(probe);
    }
    const ready = await run("/bin/zsh", ["-c", "ego-browser nodejs <<'EGO_PREFLIGHT'\ncliLog({ready: true, spaces: (await listTaskSpaces()).length});\nEGO_PREFLIGHT"], { cwd: realRoot, env, timeout: 20000, maxBuffer: 100000 });
    // Ego's cliLog writes to stderr, even on success.
    if (!/"?ready"?\s*:\s*true/.test(ready.stdout + ready.stderr)) throw new Error("Ego Lite 未返回连接成功标记");
    const args = codexStreamArgs(prompt + "\n\n浏览器必须使用 ego-browser 技能和 Ego Lite，不使用 Web DevHandler。每个候选使用独立任务空间，不操作用户常驻项目页；遇用户接管立即停止。系统权限为用户授权的完全访问，但任务范围仍仅允许修改本候选目录；不要改全局配置或自行投递。临时文件使用 TMPDIR。完成后清理本次任务空间。");
    return { args, env, dispose };
  } catch (error) {
    dispose();
    const reason = error.code || (error.message?.startsWith("Command failed") ? "命令执行失败" : error.message);
    throw new Error(`适配环境预检失败（未调用 AI）：${reason}。请检查候选目录写权限及 Ego Lite 是否已启动。`);
  }
}

export function missingAcceptanceReason(dir) {
  const blocked = path.join(dir, "BLOCKED.md");
  if (fs.existsSync(blocked)) {
    const stat = fs.lstatSync(blocked);
    if (!stat.isSymbolicLink() && stat.isFile() && stat.size <= 8000) {
      return "Agent 报告阻塞，未安装：" + fs.readFileSync(blocked, "utf8").trim().slice(0, 500);
    }
  }
  if (fs.existsSync(path.join(dir, "ACCEPTANCE.md"))) return null;
  return "Agent 未产出 ACCEPTANCE.md，开发未完成；请查看任务输出中的权限或浏览器错误。未安装，旧版保留。";
}
