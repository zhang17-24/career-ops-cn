# 修复方案：WorkBuddy 企业适配的两个缺陷

状态：**待审批**（未改代码）
日期：2026-09-20
上游文档：`docs/WorkBuddy企业适配执行方案-2026-09-19.md`、`docs/WorkBuddy企业适配测试验收-2026-09-19.md`
触发事件：2026-09-19 23:49 名创优品端到端实测失败（详见下方证据）

---

## 0. 硬性约束（用户明确要求）

**只修这两个缺陷，不得影响任何既有功能。**

具体含义：

- Codex 企业适配路径（`prepareCodexAdapter` / `codexPermissionArgs` / `spawn-cli.mjs`）行为**必须逐字节不变**。
- Claude 路径（`claudeCliArgs`）、`pdf` 路径、非结构化 CLI（gemini / opencode / copilot / qwen / antigravity / grok）的 argv 与超时行为**不变**。
- 不新增任何全局开关，不改任何默认值。
- 改动必须能被既有测试与新增测试同时锁住。

---

## 1. 证据

### 1.1 已通过的部分（不需要修）

| 项 | 证据 |
| --- | --- |
| 设置页选项、选中、持久化 | UI 实测，`localStorage` = `{"mode":"cli","cliId":"workbuddy"}` |
| 权限开关按 CLI 独立 | 文件写入 `{"fullAccess":true,"workbuddyFullAccess":true}` |
| 平台启动 WorkBuddy CLI | 候选创建 + 授权记录 + CLI 进程被拉起 |
| **配置目录隔离** | CLI 的 logs/sessions/plugins 全在 `.workbuddy-cli-isolated/`；`~/.workbuddy/logs/2026-09-19/` 无本项目文件 |
| **Agent 能驱动 Ego Lite** | 用户 23:34 运行（pid 89937）日志：`ego-browser nodejs -e ...` 真实执行、`exitCode=0`、`sandboxDenied=false`、`permissionMode=bypassPermissions` |
| CLI 相同参数下会正常退出 | 实验：同 argv 跑 `echo DONE`，**20 秒退出**，`result: "DONE"` |

### 1.2 Bug A：残留子进程 → 假超时

2026-09-19 23:49 名创优品运行：

```
23:49:14  模型请求发出（copilot.tencent.com/v2/chat/completions）
23:49:18  流完成（9 chunks / 6164 bytes）
23:49:19  AGENT_ENDED, lifecycle=idle, busy=false, FinalStop hooks completed
23:49:24  ending POST /internal/agent
23:49:28  sessions/95421.json 出现：kind="interactive"、本地端口、心跳持续到 23:58
00:02:45  status=failed, reason="任务超时，旧版未替换"
          dev 日志：POST /api/run 200 in 13.4min
```

**Agent 在 16 秒时已完成，路由却跑满 780 秒计时器。** 说明 `child.on("close")` 未触发——CLI 派生的某个子进程持有着 stdout 管道。

对照实验证明 CLI 主进程本身会正常退出（1.1 最后一行），所以残留的是它运行期派生出的子进程，**无法靠固定清单预先枚举**。

**后果比"慢"更严重**：运行在终态 `result` 事件被诚实门评估之前就被计时器杀掉，用户看到的 `任务超时` 是**假结论**——真实原因（Agent 没产出）被掩盖。用户 23:23 那次新浪微博的超时是同一根因。

### 1.3 Bug B：Agent 零工具调用

同一次运行：一次模型请求、9 chunks、6164 bytes，随后 `AGENT_ENDED`。**没有 BashTool、没有 ego-browser、没写任何文件。** 而用户 23:34 那轮正常调用了工具 → 行为不一致，存在阻断条件。

### 1.4 Bug B 的怀疑对象：继承来的沙箱垫片

CLI 日志里插件市场安装失败：

```
[PluginManager] Failed to install built-in marketplace 'codebuddy-plugins-official'
  → [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":3928,"threshold":50}
[PluginManager] Failed to install built-in marketplace 'cb_teams_marketplace'
  → [safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED] {"count":1483,"threshold":50}
[Warning] Failed to install product-declared plugins: agent-browser@codebuddy-plugins-official:
          Marketplace 'codebuddy-plugins-official' is not ready
[Warning] [PluginRuntime] background plugin management degraded
```

后果：**`agent-browser` 插件不可用**。

根因推断：`prepareWorkbuddyAdapter` 的 env 是 `{ ...process.env }`，**继承了我这个 agent shell 被 WorkBuddy 注入的变量**：

```
NODE_OPTIONS=--require=".../genie-safe-delete.cjs" --use-system-ca
BASH_ENV=.../safe-bin/safe-delete-bash-env.sh
CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD=50
CODEBUDDY_SAFE_DELETE_BULK_GUARD=...
CODEBUDDY_SAFE_DELETE_SANDBOX=1
GENIE_TRASH_DIR=...
```

那个 `--require` 垫片全局包装 `fs.rmSync`，阈值 50。CLI 首次往空配置目录装插件市场要删几千个文件 → 被拦 → 市场装不上 → 浏览器插件缺失。

**这与 Bug B 高度吻合**：浏览器工具不可用 → Agent 回一段文字（6KB，符合"解释/放弃"的形态）就结束。

用户从普通终端启动服务时不会有这些变量，所以这条在用户环境下可能不出现——但**修掉它是对的**：适配器不应该继承宿主 agent shell 的沙箱垫片。

### 1.5 附带风险：继承的 MCP 配置

`CODEBUDDY_MCP_CONFIG` 也被继承，它指向**我这个 agent 会话的 MCP 代理**（含会话级 bearer token）。适配器 Agent 不该拿到它：那是把宿主会话的工具面泄漏进候选任务。

另外实测发现：`--tools` 白名单**不裁剪 MCP 工具**（未隔离运行时 init 事件里仍出现 `mcp__weixinpay__*`）。所以不能指望白名单挡住它，必须从 env 层面剥离。

---

## 2. 修复 1：适配器 env 净化

### 2.1 做法

在 `web/src/lib/workbuddy-adapter-runtime.mjs` 里，构造 env 时**先净化再从零拼装**，而不是直接 `{ ...process.env }`。

新增一个导出的纯函数，便于单测：

```js
/**
 * Remove the host agent shell's sandbox shims from an inherited environment.
 *
 * NODE_OPTIONS is EDIT-AND-KEEP, not delete: it can legitimately carry
 * --use-system-ca (TLS trust in corporate setups), so only the safe-delete
 * --require entry is dropped. Deleting the whole variable would trade a
 * plugin-install failure for a network failure.
 */
export function sanitizeInheritedEnv(source) { ... }
```

净化清单：

| 变量 | 处理 | 理由 |
| --- | --- | --- |
| `NODE_OPTIONS` | **删掉 `--require=...genie-safe-delete.cjs` 那一项，保留其余** | 垫片包装 `fs.rmSync`，破坏 CLI 自身的插件安装 |
| `BASH_ENV` | 删除 | 它给每个 bash 子进程注入 `rm/unlink/rmdir` 包装 |
| `CODEBUDDY_SAFE_DELETE_BULK_THRESHOLD` | 删除 | 阈值 50，CLI 装插件必然触发 |
| `CODEBUDDY_SAFE_DELETE_BULK_GUARD` | 删除 | 同上 |
| `CODEBUDDY_SAFE_DELETE_BULK_STATE_DIR` | 删除 | 同上 |
| `CODEBUDDY_SAFE_DELETE_SANDBOX` | 删除 | 同上 |
| `CODEBUDDY_SAFE_DELETE_BIN_DIR` | 删除 | 同上 |
| `CODEBUDDY_SAFE_DELETE_REPORT_PATH` | 删除 | 同上 |
| `GENIE_TRASH_DIR` | 删除 | 垫片的回收站目录 |
| `CODEBUDDY_MCP_CONFIG` | 删除 | 不把宿主会话的 MCP 工具面泄漏进候选任务 |
| `WORKBUDDY_EXTRA_PATHS` | 删除 | 宿主会话的 PATH 注入，与本任务无关 |

**保留不动**：`PATH`（仍按现有逻辑前置 `dirname(process.execPath)` 与 `~/.local/bin`）、`HOME`、`TMPDIR`（仍指向 scratch）、以及所有与沙箱垫片无关的变量。

### 2.2 边界

- 净化只作用于 **WorkBuddy 适配器**的子进程 env。`spawn-cli.mjs` 与 Codex 路径完全不动。
- `NODE_OPTIONS` 的编辑必须是**逐项解析**，不能字符串替换 `--require=...`（路径含空格与引号，见实测值 `--require="/Applications/WorkBuddy AI.app/..."`）。
- 净化后若 `NODE_OPTIONS` 为空串，**删除该键**而不是留空值——空值会让 Node 报错。

---

## 3. 修复 2：终态事件 → 优雅终止

### 3.1 为什么不能靠"找出那个子进程"

对照实验证明 CLI 主进程正常退出，残留的是运行期派生的子进程，身份随任务变化（ego-browser 服务、插件进程等）。**按固定清单杀是不可靠的**，也会引入新风险。

正确做法：**不再死等 stdout EOF**。CLI 已经在 stream-json 里给出了终态信号（实测 `result` 事件在每次运行中恰好出现一次），用它作完成依据。

### 3.2 做法（三步，全部是加法）

**第一步：`run-cli-support.mjs` 给 `ParsedEvent` 加一个 `terminal` 标记。**

```js
/**
 * @typedef {{status?: string, tool?: string, text?: string, tokens?: number,
 *   costUsd?: number | null, error?: string, terminal?: boolean}} ParsedEvent
 */
```

置 `terminal: true` 的事件：

| CLI | 事件 | 为什么 |
| --- | --- | --- |
| Claude | `result` | 每次运行恰好一次，是终态 |
| WorkBuddy | `result`（复用 `parseClaudeEvent`） | 同上，实测每次一次 |
| Codex | `turn.failed` / `error` | 终态失败 |
| Codex | ~~`turn.completed`~~ **不置** | **它是 per-turn 的**，多轮运行会出现多次；置了会中途误杀 |

**第二步：`route.ts` 在 `processParsedLine` 里，遇到 `ev.terminal` 时启动一个宽限计时器。**

```ts
// 宽限期：给子进程一个自然退出的窗口。正常路径上它远早于此就退出了，
// 计时器只会被 close 处理器清掉。它唯一的用途是兜住"Agent 已完成但某个
// 派生进程仍握着 stdout"的情况——实测这种残留会让路由空转到 780s 超时，
// 并把"Agent 没产出"误报成"任务超时"。
const LINGER_GRACE_MS = 20_000;
```

行为要求：

- 计时器**只启动一次**（重复的 terminal 事件不重置）。
- `close` 处理器里 `clearTimeout`，正常路径完全无感。
- 到点后 `child.kill("SIGTERM")`，走既有的 close 流程与诚实门——**不是**直接判失败，仍由诚实门根据 `emittedText` / `sawError` / `cleanExit` / `wroteReport` 决定结论。
- 超时（`killedByTimeout`）路径**优先级不变**：只有 780s 计时器才算真超时。宽限终止不设 `killedByTimeout`。

**第三步：不改任何 CLI 的 argv、不改 `killMsForKind`、不改既有超时语义。**

### 3.3 为什么这对既有 CLI 安全

| CLI | 影响 |
| --- | --- |
| Claude | `result` 后子进程立即退出 → 计时器被 clear，**行为不变** |
| Codex | `turn.completed` 不置 terminal → **完全无影响**；失败路径多一个 20s 兜底，无害 |
| gemini / opencode / copilot / qwen / antigravity / grok | 无 `parseEvent` → 永不启动计时器 → **完全无影响** |
| pdf / evaluate / 其他 kind | 逻辑与 kind 无关，正常路径不变 |

**净效果**：只在"子进程该退没退"的异常路径上多一个 20 秒兜底，其余路径零变化。

---

## 4. 逐文件改动

| 文件 | 改动 | 性质 |
| --- | --- | --- |
| `web/src/lib/workbuddy-adapter-runtime.mjs` | 新增导出 `sanitizeInheritedEnv()`；env 构造改为先净化 | 改 |
| `web/src/lib/run-cli-support.mjs` | `ParsedEvent` 加 `terminal`；`parseClaudeEvent` 的 `result`、`parseCodexEvent` 的 `turn.failed`/`error` 置 `true` | 改（加法） |
| `web/src/app/api/run/route.ts` | `processParsedLine` 里遇到 `ev.terminal` 启动宽限计时器；`close` 里 clear | 改（加法） |
| `web/tests/lib/workbuddy-adapter-runtime.test.mjs` | 新增 env 净化用例 | 改（加法） |
| `web/tests/lib/run-cli-support.test.mjs` | 新增 `terminal` 标记用例（含"Codex turn.completed 不得标记"） | 改（加法） |
| `web/tests/lib/workbuddy-cli.test.mjs` | fixture 断言 `result` 事件带 `terminal` | 改（加法） |

**不改**：`clis.ts`、`codex-adapter-runtime.mjs`、`codex-permissions.mjs`、`spawn-cli.mjs`、`claude-invocation.mjs`、`clis-permissions.test.mjs`、`clis-coverage.test.mjs`、任何 `modes/`、任何用户数据。

---

## 5. 测试计划

### 5.1 新增单测

**`sanitizeInheritedEnv`（UT-S1～S6）**

| # | 用例 | 预期 |
| --- | --- | --- |
| S1 | 输入含 `NODE_OPTIONS='--require="/a b/genie-safe-delete.cjs" --use-system-ca'` | 输出 `NODE_OPTIONS='--use-system-ca'`，**保留** `--use-system-ca` |
| S2 | `NODE_OPTIONS` 只含垫片 require | 输出**不含 `NODE_OPTIONS` 键**（不是空串） |
| S3 | 输入含全部 `CODEBUDDY_SAFE_DELETE_*` / `GENIE_TRASH_DIR` / `BASH_ENV` / `CODEBUDDY_MCP_CONFIG` / `WORKBUDDY_EXTRA_PATHS` | 输出全部不含 |
| S4 | 输入含 `HOME` / `PATH` / `TMPDIR` / 普通业务变量 | 原样保留 |
| S5 | 不修改入参对象（纯函数） | 入参 `deepEqual` 前后一致 |
| S6 | 参数化边界：`--require` 出现在中间/末尾、带引号/不带引号、路径含空格 | 都只删该项，其余保留 |

**`terminal` 标记（UT-T1～T5）**

| # | 用例 | 预期 |
| --- | --- | --- |
| T1 | Claude `result` 事件（成功） | `terminal === true` |
| T2 | Claude `result` 事件（`is_error`） | `terminal === true`，且仍带 `error` |
| T3 | **Codex `turn.completed`** | `terminal` **不是** `true`（多轮不得中途误杀） |
| T4 | Codex `turn.failed` / `error` | `terminal === true` |
| T5 | 非终态事件（`stream_event` / `system/init` / `assistant` / 噪声） | `terminal` 不为 `true` |

**适配器 env（UT-E1～E2）**

| # | 用例 | 预期 |
| --- | --- | --- |
| E1 | `prepareWorkbuddyAdapter` 返回的 `env` | 不含任何 `CODEBUDDY_SAFE_DELETE_*` / `BASH_ENV` / `GENIE_TRASH_DIR` / `CODEBUDDY_MCP_CONFIG` |
| E2 | 同上，且注入含垫片的 `process.env` 后 | `NODE_OPTIONS` 里没有 `genie-safe-delete`，但 `--use-system-ca` 仍在 |

### 5.2 回归（必须全绿，且逐项确认零变化）

| # | 套件 | 关注点 |
| --- | --- | --- |
| R1 | `web/tests/lib/codex-adapter-runtime.test.mjs` | Codex 预检行为不变 |
| R2 | `web/tests/lib/spawn-cli.test.mjs` | `codexPermissionArgs` 不变 |
| R3 | `web/tests/lib/claude-invocation.test.mjs` | Claude argv 不变 |
| R4 | `web/tests/lib/run-cli-support.test.mjs` | 既有断言不因 `terminal` 破坏 |
| R5 | `web/tests/lib/clis-permissions.test.mjs` + `clis-coverage.test.mjs` | 权限与清单不变式 |
| R6 | `cd web && npm test` | 538 + 新增全绿 |
| R7 | `npx tsc --noEmit` | 类型不回归 |
| R8 | `NODE_OPTIONS="--use-system-ca" node test-all.mjs` | 失败数不高于基线 20（**注意：必须去掉 safe-delete 垫片，否则 harness 自身崩溃**） |

### 5.3 专项验证（证明修复真的生效）

| # | 验证 | 方法 |
| --- | --- | --- |
| V1 | 插件市场能装上 | 用净化后的 env 跑一次 `-p`，检查隔离目录日志里**不再**出现 `SAFE_DELETE_BULK_CONFIRM_REQUIRED`，且 `agent-browser` 出现在已装插件中 |
| V2 | 假超时消失 | 复跑同一次端到端，确认 `POST /api/run` 的耗时**远小于 780s**，且终态是诚实门给出的结论（如"未产出 ACCEPTANCE.md"）而不是"任务超时" |
| V3 | 其他 CLI 无影响 | 用 `claude` 跑一次常规 `evaluate`，确认行为与修复前一致 |

---

## 6. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| `NODE_OPTIONS` 净化误删有用选项 | 逐项解析、只删 `--require` 指向 safe-delete 的那一项；UT-S1/S2/S6 覆盖带引号、含空格、位置变化 |
| 宽限计时器误杀长任务 | 只在**终态事件**后启动；Codex `turn.completed` 明确排除；20s 远大于正常退出时间（实测 20s 内整个运行都结束了） |
| 宽限终止掩盖真实错误 | 终止走既有 close 流程，结论仍由诚实门决定；`killedByTimeout` 语义不变，780s 才是真超时 |
| 剥离 `CODEBUDDY_MCP_CONFIG` 影响某功能 | 适配器 Agent 的浏览器能力走 `ego-browser`（Bash），不依赖宿主 MCP；V1 验证 |

**回滚**：改动集中在 3 个源文件 + 3 个测试文件，纯加法。`git checkout` 这几个文件即回到当前状态。无数据迁移、无 schema 变更、不触碰用户数据与凭证。

---

## 7. 执行顺序

1. 先写 5.1 的新增测试 → 运行 → **确认红灯**（且失败原因是用例描述的缺失）
2. 实现 `sanitizeInheritedEnv` → UT-S 转绿
3. 实现 `terminal` 标记 → UT-T 转绿
4. 接 `route.ts` 的宽限计时器
5. 跑 5.2 全部回归，逐项确认零变化
6. 跑 5.3 的 V1（净化 env 下 CLI 日志无垫片报错）
7. **端到端复测**：同一路径（设置页 → 招聘源 → 名创优品 → 授权并开始适配），按 SOP 三段报告

**在第 7 步完成前，不声明企业适配可用。**

---

## 8. 明确不做

- 不改 Codex 路径的任何一行
- 不改 `clis.ts` 的 `KNOWN`、不改 `searchDirs`
- 不改任何 CLI 的 argv 与 `killMsForKind`
- 不改 `spawn-cli.mjs`
- 不为非 WorkBuddy 的 CLI 增加 env 净化
- 不处理那个悬挂的 `developing` 记录（属另一件事，等用户决定）
- 不动 `~/.workbuddy` 与任何用户数据

---

## 9. 一句话总结

**Bug A** 是"Agent 早已完成、路由却空转到 780s 并把真因误报成超时"——修法是给终态事件加一个 20 秒兜底终止，正常路径零影响。**Bug B** 很可能是适配器继承了宿主 shell 的 safe-delete 垫片，导致 CLI 装不上浏览器插件、Agent 无工具可用——修法是净化 env。两处都是加法，Codex 与其他 CLI 路径逐字节不变。
