// prepareWorkbuddyAdapter 的预检、argv 构造、隔离环境与资源清理。
//
// 镜像 codex-adapter-runtime.test.mjs 的注入式 run：不启动真实 CLI、不调模型、
// 不访问招聘站。所有断言都打在"返回的 argv/env"上，而不是源码文本上——
// 一条只在注释里成立的规则，下一个人不会读。
//
// 三件必须被测试钉死的事：
//   1. 未授权时一次都不许调用 run（"未调用 AI"不是口号，是断言）。
//   2. env.CODEBUDDY_CONFIG_DIR 必须指向隔离目录 —— 与桌面端 App 共用
//      ~/.workbuddy 会导致两边争抢 token 刷新权，用户被踢下线。
//   3. 放行参数（--permission-mode bypassPermissions）只在这里注入，
//      并且必须与工具白名单同时出现。
//
// Run:  node --test tests/lib/workbuddy-adapter-runtime.test.mjs

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prepareWorkbuddyAdapter, warmupWorkbuddyAuth, WORKBUDDY_ALLOWED_TOOLS } from "../../src/lib/workbuddy-adapter-runtime.mjs";

const CANDIDATE_ID = "company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9";

/** 建一个临时 root，含候选目录与权限文件；返回清理函数。 */
function makeRoot({ workbuddyFullAccess, codexFullAccess } = {}) {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "wb-adapter-test-")));
  fs.mkdirSync(path.join(root, "plugins.local", CANDIDATE_ID), { recursive: true });
  const perms = {};
  if (codexFullAccess !== undefined) perms.fullAccess = codexFullAccess;
  if (workbuddyFullAccess !== undefined) perms.workbuddyFullAccess = workbuddyFullAccess;
  fs.writeFileSync(path.join(root, ".codex-permissions.local.json"), JSON.stringify(perms));
  return { root, dir: path.join(root, "plugins.local", CANDIDATE_ID) };
}

/** 在 root 里跑一段测试体，结束后恢复 cwd 并清理。 */
async function withRoot(opts, body) {
  const cwd = process.cwd();
  const { root, dir } = makeRoot(opts);
  process.chdir(root);
  try {
    await body({ root, dir });
  } finally {
    process.chdir(cwd);
    fs.rmSync(root, { recursive: true, force: true });
  }
}

/** 记录调用并返回成功响应的假 run。 */
function okRun({ helpStdout = "--output-format stream-json\n--permission-mode <mode>\n", ego = '{"ready":true}' } = {}) {
  const calls = [];
  const run = async (bin, args, options) => {
    calls.push({ bin, args, options });
    if (bin === "/bin/zsh") return { stdout: "", stderr: ego };
    return { stdout: helpStdout, stderr: "" };
  };
  return { run, calls };
}

test("UT-03-1 未开启 WorkBuddy 完全访问：抛错且一次都没调用 run", async () => {
  await withRoot({ codexFullAccess: true, workbuddyFullAccess: false }, async ({ root }) => {
    let called = false;
    await assert.rejects(
      prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, async () => {
        called = true;
      }),
      /未调用 AI/,
    );
    assert.equal(called, false, "未授权时不得启动任何命令");
  });
});

test("UT-03-2 只开了 Codex 的 fullAccess：WorkBuddy 仍被拒绝（授权不继承）", async () => {
  await withRoot({ codexFullAccess: true }, async ({ root }) => {
    let called = false;
    await assert.rejects(
      prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, async () => {
        called = true;
      }),
      /未调用 AI/,
    );
    assert.equal(called, false, "旧文件只有 fullAccess 时，不得被当成 WorkBuddy 的授权");
  });
});

test("UT-03-3/4 候选编号不合法、候选目录含符号链接：拒绝", async () => {
  await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
    const noop = async () => ({ stdout: "", stderr: "" });
    await assert.rejects(
      prepareWorkbuddyAdapter({ root, candidateId: "not-a-candidate", binPath: "codebuddy", prompt: "x" }, noop),
      /候选编号/,
    );

    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "wb-symlink-target-"));
    const linked = path.join(root, "plugins.local", "company-11111111-2222-3333-4444-555555555555");
    fs.symlinkSync(elsewhere, linked);
    try {
      await assert.rejects(
        prepareWorkbuddyAdapter(
          { root, candidateId: "company-11111111-2222-3333-4444-555555555555", binPath: "codebuddy", prompt: "x" },
          noop,
        ),
        /符号链接/,
      );
    } finally {
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
  });
});

test("UT-03-5/6 --help 缺所需参数：拒绝", async () => {
  for (const [missing, helpStdout] of [
    ["--permission-mode", "--output-format stream-json\n"],
    ["--output-format", "--permission-mode <mode>\n"],
  ]) {
    await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
      await assert.rejects(
        prepareWorkbuddyAdapter(
          { root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" },
          okRun({ helpStdout }).run,
        ),
        new RegExp(missing.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `--help 缺 ${missing} 时应拒绝`,
      );
    });
  }
});

test("UT-03-7/9/10 环境构造：配置目录隔离、scratch 三变量一致、不污染宿主", async () => {
  await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
    const before = { ...process.env };
    const { run } = okRun();
    const result = await prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, run);
    try {
      const cfg = result.env.CODEBUDDY_CONFIG_DIR;
      assert.ok(cfg, "必须设置 CODEBUDDY_CONFIG_DIR");
      assert.notEqual(cfg, path.join(os.homedir(), ".workbuddy"), "不得指向桌面端 App 的配置目录");
      assert.ok(!cfg.startsWith(path.join(os.homedir(), ".workbuddy") + path.sep), "不得位于桌面端配置目录之下");

      assert.equal(result.env.TMPDIR, result.env.TMP);
      assert.equal(result.env.TMPDIR, result.env.TEMP);

      // 宿主进程的 env 不得被改动。比较两份普通对象快照 —— 直接对 process.env
      // 用 deepEqual 会因它是特殊对象而误报，测的是对象性质而不是污染。
      assert.deepEqual({ ...process.env }, before, "不得污染宿主进程环境");
    } finally {
      result.dispose();
    }
  });
});

test("UT-03-8 PATH 前置 node 目录与 ~/.local/bin", async () => {
  await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
    const { run } = okRun();
    const result = await prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, run);
    try {
      const parts = result.env.PATH.split(path.delimiter);
      // bin/codebuddy 的 shebang 是 #!/usr/bin/env node —— PATH 上没有 node 就起不来。
      assert.equal(parts[0], path.dirname(process.execPath), "node 目录必须最前");
      // ego-browser 在 ~/.local/bin，适配器靠它拿浏览器能力。
      assert.ok(parts.includes(path.join(os.homedir(), ".local/bin")), "必须包含 ~/.local/bin（ego-browser）");
    } finally {
      result.dispose();
    }
  });
});

test("UT-03-11~15 argv：放行参数 + 工具白名单 + 浏览器约束 + 不落会话", async () => {
  await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
    const { run } = okRun();
    const result = await prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "BASE" }, run);
    try {
      const args = result.args;
      const pm = args.indexOf("--permission-mode");
      assert.ok(pm !== -1, "适配器必须注入权限模式");
      assert.equal(args[pm + 1], "bypassPermissions");

      const toolsIdx = args.indexOf("--tools");
      assert.ok(toolsIdx !== -1, "必须注入工具白名单");
      const allow = args[toolsIdx + 1].split(",").map((t) => t.trim());
      assert.deepEqual(allow.sort(), [...WORKBUDDY_ALLOWED_TOOLS].sort());
      assert.ok(allow.includes("Bash"), "Bash 必须保留 —— ego-browser 是通过它调用的");

      // 白名单必须挡掉这些：子 Agent 扇出、桌面接管、持久化调度、对外发消息、Windows 写能力。
      for (const denied of ["ComputerUse", "Agent", "TeamCreate", "TeamDelete", "SendMessage", "CronCreate", "PowerShell", "NotebookEdit", "WeChatReply", "WeComReply"]) {
        assert.ok(!allow.includes(denied), `白名单不得包含 ${denied}`);
      }

      assert.ok(args.includes("--no-session-persistence"), "必须不落会话");

      const last = args[args.length - 1];
      assert.match(last, /Ego Lite/);
      assert.match(last, /ego-browser/);
      assert.ok(last.includes("BASE"), "原始 prompt 必须保留");
    } finally {
      result.dispose();
    }
  });
});

test("UT-03-16~19 dispose 幂等、scratch 被清理、失败路径也清理、写探针失败即拒绝", async () => {
  await withRoot({ workbuddyFullAccess: true }, async ({ root }) => {
    const { run, calls } = okRun();
    const result = await prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, run);
    const scratch = result.env.TMPDIR;
    assert.ok(fs.existsSync(scratch));
    result.dispose();
    result.dispose(); // 幂等
    assert.equal(fs.existsSync(scratch), false, "dispose 必须删掉 scratch");

    // 写探针确实在两个目录各写过一次（残留探针文件 = 没清理干净）。
    const probeLeft = calls.length > 0 && fs.readdirSync(path.join(root, "plugins.local", CANDIDATE_ID)).some((f) => f.startsWith(".permission-probe-"));
    assert.equal(probeLeft, false, "写权限探针必须写后即删");

    // 预检失败路径也要清理 scratch。
    const failing = async (bin, args, options) => {
      if (bin === "/bin/zsh") return { stdout: "", stderr: '{"ready":false}' };
      return { stdout: "--output-format stream-json\n--permission-mode <mode>\n", stderr: "" };
    };
    let scratchOnFailure;
    const spy = async (bin, args, options) => {
      scratchOnFailure = options.env.TMPDIR;
      return failing(bin, args, options);
    };
    await assert.rejects(
      prepareWorkbuddyAdapter({ root, candidateId: CANDIDATE_ID, binPath: "codebuddy", prompt: "x" }, spy),
      /未调用 AI/,
    );
    assert.equal(fs.existsSync(scratchOnFailure), false, "失败路径也必须清理 scratch");
  });
});

test("UT-04 warmup：冷启动 401 有界重试，非 401 不重试", async () => {
  const ctx = { binPath: "codebuddy", env: {}, cwd: "/tmp", run: null };

  // 401 → 成功
  let n = 0;
  await warmupWorkbuddyAuth(
    { ...ctx, run: async () => (++n === 1 ? { stdout: "", stderr: "401 Authentication required" } : { stdout: "PONG", stderr: "" }) },
    2,
  );
  assert.equal(n, 2, "第一次 401 后应重试一次");

  // 连续 401 → 抛错且不无限重试
  let m = 0;
  await assert.rejects(
    warmupWorkbuddyAuth({ ...ctx, run: async () => { m++; return { stdout: "", stderr: "401 Authentication required" }; } }, 2),
    /凭证|重试/,
  );
  assert.equal(m, 2, "重试次数必须有界");

  // 非 401 错误 → 不重试
  let k = 0;
  await assert.rejects(
    warmupWorkbuddyAuth({ ...ctx, run: async () => { k++; throw new Error("error: unknown option '--x'"); } }, 2),
    /unknown option/,
  );
  assert.equal(k, 1, "非 401 错误不得重试");

  // 一次成功 → 只调用一次
  let j = 0;
  await warmupWorkbuddyAuth({ ...ctx, run: async () => { j++; return { stdout: "OK", stderr: "" }; } }, 2);
  assert.equal(j, 1);
});
