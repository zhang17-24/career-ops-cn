# 执行方案：让 WorkBuddy 具备企业适配能力

状态：**方案已批准；测试验收文档已出；代码仍为零，待用户确认后按 TDD 开始**
日期：2026-09-19
前置文档：`docs/WorkBuddy接入可行性-2026-09-19.md`
配套测试文档：**`docs/WorkBuddy企业适配测试验收-2026-09-19.md`（编码的输入，先写测试再实现）**

**已拍板**（2026-09-19）

| 决策点 | 结论 |
| --- | --- |
| 2 · 工具裁剪 | ✅ `--tools` **白名单** |
| 3 · 冷启动 401 | ✅ 适配器内置**有界重试**（最多 2 次） |
| 5 · CLI 来源 | ✅ **内置 CLI + 隔离配置**（若仍干扰再转独立安装） |
| 1 · 权限文件名 | 按推荐执行：**保留 `web/.codex-permissions.local.json`**，仅在内容里加字段（零迁移风险） |
| 4 · Windows/Linux 路径 | 按推荐执行：**只写 macOS 路径**，另两平台留 TODO 并标注"未验证" |

用户额外要求：**先出测试验收文档（单元 + 端到端），再编码。** 该文档已完成。

---

## 0. 目标与范围

**目标**：让平台的企业适配流程（`adapt-provider`）可以用 WorkBuddy 作为运行时，能力对齐现有 Codex 路径——即"用 WorkBuddy 观察企业招聘官网、分析页面、写出可安装的零 Token 适配器"。

**不在范围内**：

- 不修改 `modes/` 下任何文件
- 不启用任何适配器、不绑定企业、不改 `portals.yml`
- 不运行真实扫描、不投递、不发送任何对外请求
- 不为了"让测试变绿"而削弱 `plugin-audit.mjs` 或任何验收器
- **不改动 `/Applications/WorkBuddy.app` 内部文件，不改 `~/.workbuddy` 的配置、会话与凭证**
- 不为常规流程（`evaluate`/`pdf`）接 WorkBuddy——那条路还缺按 kind 的工具分级（`route.ts` 注释记为 #2507），一并做会把范围撑大

---

## 1. 已完成的部分（探索与验证，代码零改动）

### 1.1 已交付

| 产出 | 路径 |
| --- | --- |
| 可行性探索报告 | `docs/WorkBuddy接入可行性-2026-09-19.md` |
| 本执行方案 | `docs/WorkBuddy企业适配执行方案-2026-09-19.md` |
| 工作区记忆 | `.workbuddy-ai/memory/2026-09-19.md` |

### 1.2 关键验证结论（均为本机实测）

| 验证项 | 结果 |
| --- | --- |
| WorkBuddy 是否内置 CLI | ✅ `/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin/codebuddy`，`--version` = `2.137.1` |
| 无头单轮调用 | ✅ `codebuddy -p "say PONG"` → 真实返回 `PONG`（纯文本） |
| 结构化事件流 | ✅ `--output-format stream-json` 产出 `system/init`、`stream_event`、`result` |
| 与 `parseClaudeEvent` 兼容 | ✅ `--include-partial-messages` 下产出 `content_block_delta`；`result.usage` 含 `input_tokens`/`output_tokens`/`cache_creation_input_tokens`/`total_cost_usd` |
| 权限模式参数 | ✅ `--permission-mode bypassPermissions` 被接受，`permissionMode` 出现在 init 事件 |
| 逐工具裁剪 | ⚠️ `--tools` 与 `--disallowedTools` 均被**接受**；**实际裁剪效果尚未验证**（见实施顺序第 1 步） |
| Ego Lite 浏览器通道 | ✅ `{ ready: true, spaces: 0 }`，**与 Codex 无关，是独立 shell 工具**（`~/.local/bin/ego-browser`） |
| 探测链路 | ✅ 把应用包 `cli/bin` 加入 `searchDirs()` 后 `findBin("codebuddy")` 命中 |

参数校验是严格的：伪造参数会报 `error: unknown option`，所以"被接受"是真实结论，不是被忽略。

### 1.3 推翻上一轮判断的重要更正

上一轮报告把 `401 Authentication required` 判定为"CLI 未登录"，**这是错的**。

实测行为：

```
第 1 次 => 401（token-length:1390）
第 2 次 => PONG 成功
第 3 次 => PONG 成功
第 4 次 => PONG 成功
```

token 长度从 1335 增长到 1390，说明 **CLI 会自行刷新凭证**。401 只出现在冷启动触发刷新的那一次，之后即恢复。这是**瞬时失败，不是未登录**。

**设计含义**：适配器运行时必须对这一次冷启动失败做有界重试，否则企业适配会随机地以误导性的"鉴权失败"报错。这是本方案里最容易被忽略、但一定会踩到的点。

---

## 2. 与桌面端的状态隔离（硬性前置要求）

### 2.1 问题

WorkBuddy 桌面端与它内置的 CLI **共用同一个 `~/.workbuddy`**：配置、会话、日志、token 都在里面。已确认的证据：我在 `/tmp/wb-cli-test` 跑 CLI 时，`~/.workbuddy/logs/2026-09-19/` 里出现了 `wb-cli-test__*.log`。

两边都会刷新 token，**谁后刷谁赢，另一个掉线**——这正好解释"第一次 401、第二次正常"。

### 2.2 已查明的崩溃事实（只读日志核对）

- **今天（2026-09-19）没有任何崩溃记录。** `~/.workbuddy/logs/Crash-Log/` 里最新一份是 `crash-report-sidecar-62201-20260916T233322.json`；其余为 9/10、9/16、9/17、9/18。
- **当前登录态正常**：`hasAccessToken=true`，uid `753719f3-…`，12:40 / 12:46 / 12:50 UTC 连续三次探测一致。

结论必须分开说清楚：**崩溃历史早于本次工作，不能归因于本次探索**；但"需要重新登录"与我反复调用该 CLI 存在合理的时间与机制关联，**不能排除我的测试加剧了它**。

### 2.3 隔离措施（本方案必做）

1. **独立配置目录**：运行时给子进程设 `CODEBUDDY_CONFIG_DIR=<项目>/.workbuddy-cli-isolated`，不写 `~/.workbuddy`。
2. **不落会话**：argv 固定带 `--no-session-persistence`（官方参数说明："sessions stay in memory and are not saved to disk"）。
3. **不并发**：适配运行时只在用户点击时启动，不做后台探测或轮询；预检只用 `--help`，不调模型。
4. **停止一切手动实验**：不再手动跑那个 CLI。第 3 节列出的"待验证"项，一律在隔离配置下、随一次任务顺带验证，不单独反复试。

### 2.4 若隔离后仍互相干扰

退路是改用**独立安装的 CodeBuddy CLI**（自带配置目录与独立登录），career-ops 只驱动那一份，与桌面端彻底解耦。代价是多一次安装，收益是零耦合。见决策点 5。

---

## 3. 改动清单（逐文件）

### 3.1 `web/src/lib/run-cli-support.mjs`（新增一个导出）

与 `codexStreamArgs` 并列，因为它是 `parseEvent` 的配对契约（该文件头部的既有约定）。

```js
/**
 * The argv that makes the WorkBuddy CLI emit the JSONL `parseClaudeEvent` reads.
 *
 * `--include-partial-messages` is NOT optional: without it the CLI emits only
 * whole `assistant` messages, which `parseClaudeEvent` does not read, so a
 * successful run would reach the route with zero text and be reported as
 * "produced no output — is it installed and authenticated?".
 *
 * `--no-session-persistence` keeps this process from writing session state into
 * the config dir the WorkBuddy desktop app also uses.
 */
export function workbuddyStreamArgs(prompt) {
  return ["-p", "--output-format", "stream-json", "--include-partial-messages", "--no-session-persistence", prompt];
}
```

### 3.2 `web/src/lib/clis.ts`

**a. `KNOWN` 新增一条**（放在 `claude` 之后，作为第二个结构化输出的 CLI）：

```ts
{ id: "workbuddy", name: "WorkBuddy", bin: "codebuddy", run: "codebuddy -p", url: "https://www.workbuddy.cn",
  args: (p) => ["-p", p], streamArgs: workbuddyStreamArgs, parseEvent: parseClaudeEvent, stderrIsFatal: isFatalClaudeStderr },
```

**b. `searchDirs()` 的 `extra` 增加应用包路径**：

- macOS：`/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/bin` 与 `/Applications/WorkBuddy AI.app/...`
- Windows / Linux：**本机无法验证**，见决策点 4

**c. `KNOWN` 里不放任何权限参数。** 这是分层设计，理由见 3.5。

**注意**：`bin` 是 `codebuddy` 而非 `workbuddy`，因为应用包内就是这个文件名。`findBin()` 先遍历 PATH 再遍历 extra，所以用户若装了独立 CodeBuddy CLI，PATH 里那份优先——这是期望行为。

### 3.3 `web/src/lib/workbuddy-adapter-runtime.mjs`（新文件）

镜像 `codex-adapter-runtime.mjs` 的结构，逐项对应：

| 环节 | Codex 的做法 | WorkBuddy 的做法 |
| --- | --- | --- |
| 权限闸门 | `readCodexPermissions().fullAccess` | `readWorkbuddyPermissions().fullAccess`（独立授权，见 3.4） |
| 候选编号校验 | `/^company-[a-f0-9-]{36}$/` | 同 |
| 符号链接拒绝 | `realpathSync` 比对 | 同 |
| 临时目录 | `mkdtempSync` + `TMPDIR`/`TMP`/`TEMP` | 同 |
| PATH 注入 | `dirname(process.execPath)` + `~/.local/bin` | 同（**`~/.local/bin` 是 `ego-browser` 所在，必需**；`dirname(process.execPath)` 也是硬需求，因为 `bin/codebuddy` 的 shebang 是 `#!/usr/bin/env node`） |
| 配置目录隔离 | 无（Codex 无此问题） | `CODEBUDDY_CONFIG_DIR` 指向项目内隔离目录（见第 2 节） |
| 参数支持预检 | `codex exec --help` 含 `danger-full-access` | `binPath --help` 含 `--output-format` 与 `--permission-mode` |
| 写权限探针 | 候选目录 + scratch 各写一次 | 同 |
| 浏览器预检 | Ego Lite `listTaskSpaces()` 探针 | **同一段代码，抽成共享函数**（它本来就与 CLI 无关） |
| 构造 args | `codexStreamArgs(prompt + 浏览器约束)` | `["--permission-mode","bypassPermissions", ...白名单参数..., ...workbuddyStreamArgs(prompt + 浏览器约束)]` |
| 完全访问等价物 | `--sandbox danger-full-access` | `--permission-mode bypassPermissions` |
| 返回 | `{ args, env, dispose }` | `{ args, env, dispose, warmup }` |

**新增：`warmup`（冷启动重试）**

```js
// 冷启动触发凭证刷新时，第一次请求会以 401 失败，之后即恢复。
// 重试是安全的：401 发生在鉴权层，尚未产生任何副作用（不写文件、不访问招聘站）。
export async function warmupWorkbuddyAuth({ binPath, env, cwd, run }, attempts = 2) { ... }
```

### 3.4 `web/src/lib/codex-permissions.mjs`（权限按 CLI 区分）

**现状**：`{ fullAccess: boolean }`，UI 文案是"Codex 完全访问（仅本平台）"。

**问题**：用户对 Codex 的授权**不能**被当成对 WorkBuddy 的授权——这正是该模块存在的意义（明确的、逐项的、可撤回的授权）。

**改法**（向后兼容）：

```js
// 文件格式扩展为 { fullAccess, workbuddyFullAccess }
export function readCodexPermissions(file) { /* 不变，只读 fullAccess */ }
export function readWorkbuddyPermissions(file = permissionFile()) {
  // 旧文件没有 workbuddyFullAccess 字段 → 返回 false
  // 关键：不继承 Codex 的授权
}
export function saveWorkbuddyPermissions(fullAccess, file) { /* 读-改-写，保留 fullAccess */ }
```

同步：

- `web/src/app/api/codex-permissions/route.ts`：body 接受 `{ fullAccess?, workbuddyFullAccess? }`，至少提供一个
- `web/src/components/codex-permissions.tsx`：第二个独立复选框 + 独立确认文案（不能复用 Codex 的确认弹窗文案）

### 3.5 工具裁剪：`KNOWN` 干净，放行参数只在适配器注入

`clis.ts` 头部那段注释和 `clis-permissions.test.mjs` 立了一条硬规矩：**`KNOWN` 里不许出现让 CLI 自行放行的参数**，因为平台的权限模型只在 Claude 那条路上写了 deny 列表，自带全放行的 CLI 等于"进入规则不存在的地方"。

Codex 的分层是先例：`KNOWN` 里是干净的 `["exec", p]`，`--sandbox danger-full-access` 由 `codexPermissionArgs` 在用户开启开关后才注入。

WorkBuddy 照抄这个分层：

- **`KNOWN` 里只放无权限语义的参数**（`-p`、`--output-format`、`--include-partial-messages`、`--no-session-persistence`）
- **`--permission-mode bypassPermissions` 只在适配运行时注入**，且必须由用户在设置页显式确认
- **同时注入工具白名单**，让"只允许改候选目录"不只靠 prompt 约束

### 3.6 工具白名单（用 `--tools` 而非 `--disallowedTools`）

实测 init 事件暴露了 **52 个工具**。企业适配需要保留的：

```
Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch
```

`Bash` 必须保留——`ego-browser` 是通过它调用的。

**为什么用白名单而不是黑名单**：`clis.ts` 头部的不变式写着"a CLI with no per-tool deny list must be given fewer workers, not blanket approval"。黑名单会漏掉未来版本新增的工具名（WorkBuddy 是快速迭代的 Electron 应用）；白名单不会。这比 Codex 现有的做法更严格。

被白名单挡掉的危险项（举例）：`ComputerUse`（会接管用户桌面）、`Agent`/`TeamCreate`/`TeamDelete`/`SendMessage`（子 Agent 扇出，SOP 明确禁止）、`CronCreate`（持久化定时任务）、`WeChatReply`/`WeComReply`（对外发消息）、`NotebookEdit`、`PowerShell`（Windows 写能力）、`mcp__weixinpay__*`（支付）。

**待验证**：`--tools` 是否一并裁掉 MCP 工具、以及 Agent 可能需要但当前不在 init 列表里的工具。列为实施前第一项验证。

### 3.7 `web/src/app/api/run/route.ts`

**现状**：

```ts
if (candidate && cliId === "codex") { ... prepareCodexAdapter ... }
```

**改法**：抽一个分发函数，而不是在 route 里堆 `else if`：

```ts
// lib/adapter-runtime.mjs
export async function prepareAdapterRuntime({ cliId, root, candidateId, binPath, prompt }) {
  if (cliId === "codex") return prepareCodexAdapter({ root, candidateId, binPath, prompt });
  if (cliId === "workbuddy") return prepareWorkbuddyAdapter({ root, candidateId, binPath, prompt });
  return null;  // 其他 CLI 无适配器能力 → 保持现有行为
}
```

route 里变成：

```ts
if (candidate) {
  const runtime = await prepareAdapterRuntime({ cliId, ... });
  if (runtime) { args = runtime.args; workerEnv = runtime.env; disposeRuntime = runtime.dispose; }
  // 失败仍走现有的 enterpriseAction("fail") + 503
}
```

**好处**：`candidate` 存在但 CLI 不支持适配时，行为与今天完全一致（不静默降级、不假装成功）。

### 3.8 文档与清单同步

| 文件 | 改动 | 为什么必须 |
| --- | --- | --- |
| `docs/SUPPORTED_CLIS.md` | 加 `Headless/Batch: codebuddy -p "prompt"` 一行 | `clis-coverage.test.mjs` 会检查一致性 |
| `doctor.mjs` | `VALID_CLIS` 加 `workbuddy` | 保持清单一致 |
| `scaffolder/bin/cli.mjs` | 工具探测列表加一项 | 同上 |
| `docs/招聘源适配验收SOP.md` | 「平台 Codex 权限与 Ego Lite」一节补 WorkBuddy 等价说明 | 该节目前只描述 Codex，会误导后续维护者 |
| `web/src/components/config-form.tsx` | 第 148/220/224 行硬编码文案补一句 | 选项卡片本身无需改代码 |

---

## 4. 测试计划

### 4.1 新增

`web/tests/lib/workbuddy-adapter-runtime.test.mjs`，镜像 `codex-adapter-runtime.test.mjs` 的注入式 `run`，断言：

1. 未授权时抛错且**一次都没调用** `run`（错误信息含"未调用 AI"）
2. 预检通过时，`args` 含 `--permission-mode`、工具白名单参数，且 prompt 末尾含 Ego Lite 约束
3. `args` 含 `--no-session-persistence`，且 `env` 里 `CODEBUDDY_CONFIG_DIR` 指向隔离目录（**不是 `~/.workbuddy`**）
4. `dispose()` 幂等，且 scratch 目录确实被删除
5. 预检失败路径也会 `dispose()`
6. 冷启动 401 → 重试成功的路径（注入两次假响应）

### 4.2 新增守卫

在 `web/tests/lib/clis-permissions.test.mjs` 的 `AUTO_APPROVE` 黑名单里补 `--permission-mode bypassPermissions`。

理由：现有黑名单列的是 `--always-approve` / `--dangerously-skip-permissions` / `--yolo` 等写法，而 WorkBuddy 的放行参数**长得不像其中任何一个**，能绕过去。这条测试的意图是"不许自行放行"，黑名单必须跟上新出现的写法。加这一条，等于把 3.5 的分层从"约定"变成"被测试强制的规则"。

### 4.3 必须保持通过

- `clis-coverage.test.mjs`
- `clis-permissions.test.mjs`
- `web/tests/lib/run-cli-support.test.mjs`
- `web/tests/lib/spawn-cli.test.mjs`
- `web/tests/lib/codex-adapter-runtime.test.mjs`（Codex 路径不得回归）
- `node --test` 全量 + `test-all.mjs`

---

## 5. 风险登记

| 风险 | 影响 | 缓解 |
| --- | --- | --- |
| 与桌面端争抢 token / 共享 `~/.workbuddy` | 用户被踢下线 | 第 2 节隔离措施；仍冲突则走决策点 5 的独立 CLI |
| 冷启动 401 | 适配随机失败 | 决策点 3 的有界重试；预检增加认证探测 |
| `--tools` 白名单实际不裁剪 | 权限面比预期大 | 实施前第一项验证；不成立则改用 `--disallowedTools` 并在验收报告里如实标注 |
| 应用包路径随 WorkBuddy 升级变化 | 选项消失 | `vendor-extract.log` 显示路径结构稳定（版本号在内容里不在路径里）；写一条注释说明升级后需复验 |
| `bin: "codebuddy"` 与其他工具同名 | 命中错误的二进制 | `findBin` 先 PATH 后 extra，行为可预期；文档说明 |
| 非适配流程仍无工具裁剪 | WorkBuddy 跑 `evaluate`/`pdf` 时工具不受限 | route.ts 已有注释记录这个全局缺口（#2507）。**本次不顺手修**，只做适配路径并在文档里如实说明 |
| Windows / Linux 路径未验证 | 那两个平台上选项可能不出现 | 决策点 4 |

**回滚**：改动集中在 4 个源文件 + 1 个新文件 + 3 个文档 + 2 个测试。回滚 = `git checkout` 这些文件。无数据迁移、无 schema 变更、不触碰用户数据与凭证。

---

## 6. 需要你拍板的 5 个决策点

### 决策点 1：权限文件名

现在文件叫 `web/.codex-permissions.local.json`，要开始存两个 CLI 的授权了。

- **方案 A（推荐）**：保留文件名不动，只在内容里加字段。零迁移风险，但名字会长期不准确。
- **方案 B**：改名为 `.ai-permissions.local.json`，读取时回退读旧文件，写入新文件。名字准确，多一段迁移代码和一次出错机会。

### 决策点 2：工具裁剪用白名单还是黑名单

- **方案 A（推荐）**：`--tools` 白名单（8 个工具）。更严格，不怕未来新增工具。风险是可能裁掉 Agent 需要的工具，需实测。
- **方案 B**：`--disallowedTools` 黑名单。与 Codex 路径的"不加工具参数"更接近，但会漏掉未来新增的工具名。

### 决策点 3：冷启动 401 的处理位置

- **方案 A（推荐）**：适配器运行时内置有界重试（最多 2 次）。用户无感，失败时才报错。
- **方案 B**：不重试，靠平台现有的"无输出"提示让用户手动重跑。改动最小，但企业适配会随机失败，体验差。

### 决策点 4：Windows / Linux 路径

本机是 macOS，只能验证 macOS 路径。

- **方案 A（推荐）**：只写 macOS 路径，Windows/Linux 留 TODO 并标注"未验证"。诚实，不会给出假的可用性。
- **方案 B**：按 Electron 惯例推测三个平台的路径一起写。覆盖面广，但其中两个平台**从未验证过**，一旦猜错就是"设置页显示了选项但一跑就失败"。

### 决策点 5：WorkBuddy 的来源（新增，与你的崩溃顾虑直接相关）

- **方案 A（推荐）**：先用**桌面端内置的 CLI + 第 2 节的隔离配置**。零安装，靠隔离避免干扰。若仍互相影响，再转方案 B。
- **方案 B**：直接用**独立安装的 CodeBuddy CLI**。与桌面端彻底解耦，最稳妥，但需要你先装一次并登录。

---

## 7. 实施顺序（获批后执行，TDD）

**每个模块先写测试、观察红灯、再实现。** 用例编号对应 `docs/WorkBuddy企业适配测试验收-2026-09-19.md`。

0. **测试先行**：按测试文档建立 UT-01～UT-08、IT-01～IT-04 的用例骨架并运行，确认全部因"实现缺失"而失败（不是语法错误）
1. **先验证**（隔离配置下，一次任务内完成，不反复试）：`--tools` 白名单的实际裁剪效果、Agent 是否需要白名单外的工具、桌面端开启 vs 关闭对 401 的影响
2. `run-cli-support.mjs` 加 `workbuddyStreamArgs` → 让 UT-01 转绿
3. `clis.ts` 加条目 + 探测路径 → 让 UT-07、UT-08 转绿
4. 权限模块按 CLI 拆分（决策点 1 已定：保留原名）+ API + UI → 让 UT-05、IT-02 转绿
5. `workbuddy-adapter-runtime.mjs`（含隔离与 warmup）→ 让 UT-03、UT-04 转绿
6. `adapter-runtime.mjs` 分发 + route.ts 接线 → 让 UT-06、IT-03、IT-04 转绿
7. 测试守卫加固（`AUTO_APPROVE` 黑名单）→ 让 UT-07-5 的变异检查有判别力
8. 文档与清单同步
9. 跑全量回归（REG-01～REG-09）
10. **前端 E2E**（第 4 节）→ 设置页可选、选中后各入口真用上
11. **隔离验收**（第 6 节）→ 含人工确认桌面端不掉登录
12. **真实数据验收**（第 7 节，需用户授权）→ 按 SOP 三段分别报告

---

## 8. 验收方式（按 SOP 分三段报告，不合并）

1. **离线/单元**：新增测试 + 两个守卫 + 全量测试通过
2. **真实预检**：用真实 `binPath` 跑适配器预检（**不调用模型**），确认权限、写权限、Ego Lite 三项均通过
3. **端到端**（需你在场并明确授权）：选一家企业走一次完整 `adapt-provider`，核对 `ACCEPTANCE.md` 与三个真实详情

**在第 3 步完成之前，不得声明"企业适配已接入成功"。** 前两步只证明机制通了，不证明真实岗位可读。

---

## 9. 一句话总结

机制上 WorkBuddy 已经能替代 Codex 跑企业适配——`-p` + `stream-json` + Ego Lite 三件套都实测可用，且它能用 `--tools` 白名单做出**比 Codex 更严**的权限模型。真正需要设计的是四件事：**与桌面端的状态隔离**（你的崩溃顾虑）、冷启动 401 的有界重试、权限授权必须按 CLI 分开、以及工具白名单要验证过再落地。
