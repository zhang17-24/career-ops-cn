# WorkBuddy 作为可选 AI 工具的接入可行性

日期：2026-09-19
范围：仅探索与验证，未修改 `web/src/lib/clis.ts` 或任何系统层文件。

## 结论

**可行，且接入成本低于预期。** 原因不是"WorkBuddy 能当 CLI 用"，而是 WorkBuddy 桌面端**本身就内置了一个完整的命令行 Agent**：`CodeBuddy Code`（`codebuddy` / `cbc`）。它是 Claude Code 的同源实现，无头参数、结构化输出字段、逐工具权限开关都对得上平台现有契约。

因此平台侧几乎不需要新机制——只需在 `KNOWN` 里多一条 `CliSpec`，并让探测逻辑能看见应用包内的路径。

> **2026-09-19 更新：** 原文此处写"唯一真正的阻塞是鉴权"，**该结论已作废**。后续实测确认无头调用可用（返回 `PONG`），鉴权不是阻塞；真正需要处理的是 CLI 与桌面端共享 `~/.workbuddy` 导致的 token 争抢（见第四节更正与实施计划第 6 节）。

## 一、平台现有的接入机制

平台把 Codex / Claude 接进来，走的是同一条 5 步链路，没有任何按厂商定制的部分：

1. `web/src/lib/clis.ts` 的 `KNOWN` 数组声明一个 `CliSpec`：`id` / `name` / `bin` / `run` / `url` / `args(prompt)`，可选 `streamArgs` / `parseEvent` / `stderrIsFatal`。
2. `detectClis()` 用 `findBin()` 在 `PATH` + `searchDirs()` 的额外目录里按 `X_OK` 找同名可执行文件，得出 `installed` 标志。
3. `/api/clis` 把结果给前端；`web/src/components/config-form.tsx` **直接遍历渲染**，用户点选后 `cliId` 存进 localStorage 的 `career-ops:config`。
4. 各 API 路由收 `cliId` → `resolveCli(id)` → `spawnHeadlessCli(binPath, spec.args(prompt), { cwd: careerOpsRoot() })`。
5. 输出处理分两档：有 `parseEvent` 的（claude / codex）走结构化事件流；其余走纯文本直通。

关键含义：**设置页的选项卡片不需要改代码**。`config-form.tsx` 是数据驱动的，`/api/clis` 返回什么就渲染什么。新增工具只要出现在 `detectClis()` 的结果里，选项就自动出现。

### 两条被测试强制的硬约束

- `web/tests/lib/clis-permissions.test.mjs`：`KNOWN` 里**禁止**出现 `--always-approve` / `--dangerously-skip-permissions` / `--yolo` 等一揽子放行参数。理由写在 `clis.ts` 头部：平台的权限模型只在 Claude 那条路上写了 deny 列表（`claude-invocation.mjs` 的 `WRITE_CAPABLE_TOOLS` + 按 kind 的 deny 列表），一个自带全放行参数的 CLI 会绕过整套模型——同一个 `pdf` worker 在 Claude 下 Bash 被明确拒绝，换 Grok 就变成自动批准，而 UI 上两条路径长得一模一样。
- `web/tests/lib/clis-coverage.test.mjs`：`docs/SUPPORTED_CLIS.md` 里标了 `Headless/Batch:` 的 CLI 必须出现在 `KNOWN` 里，`id` 不得重复。

## 二、WorkBuddy 侧的关键发现

### 内置 CLI 的位置

```
/Applications/WorkBuddy.app/Contents/Resources/app.asar.unpacked/cli/
├── bin/codebuddy            # 启动脚本（#!/usr/bin/env node，可执行位已开）
├── bin/cbc-prewarm
├── dist/codebuddy-headless.js   # 19 MB，无头 bundle
├── dist/codebuddy.js            # 23 MB，交互 bundle
├── package.json                 # name: @genie/agent-cli
├── product.json                 # productName: WorkBuddy, endpoint: copilot.tencent.com
├── product.cloudhosted.json     # agent 定义：工具集 / 模型清单
└── sandbox-config.json
```

`/Applications/WorkBuddy AI.app/.../cli/bin/codebuddy` 是同一份的第二处副本。

实测 `codebuddy --version` → `2.137.1`。

### 无头调用契约完全对齐

`codebuddy --help` 的实际输出（节选，均为真实参数）：

| 平台需要的能力 | WorkBuddy CLI 参数 |
| --- | --- |
| 单轮纯文本输出（`CliSpec.args` 的契约） | `-p, --print`，默认 `--output-format text` |
| 结构化事件流（`/api/run` 的 dashboard 流） | `--output-format stream-json`、`--include-partial-messages` |
| 逐工具放行 | `--allowedTools` / `--allowed-tools` |
| 逐工具拒绝（权限不变式的关键） | `--disallowedTools` / `--disallowed-tools` |
| 整体工具集裁剪 | `--tools <value>`（`""` 禁用全部，`"default"` 全开，或逗号分隔工具名） |
| 权限模式 | `--permission-mode acceptEdits\|bypassPermissions\|default\|plan\|dontAsk\|auto` |
| 追加目录访问 | `--add-dir` |
| 系统提示追加 | `--append-system-prompt` |
| 模型 / 轮数 / 推理档 | `--model`、`--max-turns`、`--effort` |
| 会话续接 | `--session-id`、`-c/--continue`、`-r/--resume` |

### 结构化输出字段与 Claude 同源

`dist/codebuddy-headless.js` 中实测存在这些字段名：`stream_event`、`content_block_delta`、`cache_creation_input_tokens`、`total_cost_usd`、`is_error`。

这些正是 `web/src/lib/run-cli-support.mjs` 的 `parseClaudeEvent()` 读取的字段。**结论：`parseEvent` 大概率可直接复用 `parseClaudeEvent`**，无需新写解析器。（唯一缺失的是 `error_max_turns`，只影响 `subtype.startsWith("error")` 那条兜底分支。）

### 工具集（来自 `product.cloudhosted.json`）

```
Agent, Read, Write, Edit, Bash, Glob, Grep, PowerShell,
EnterPlanMode, ExitPlanMode, TaskCreate/Get/Update/List,
WebFetch, WebSearch, TaskStop, TaskOutput, Skill, AskUserQuestion,
StructuredOutput, ToolSearch, DeferExecuteTool, SendMessage,
TeamCreate, TeamDelete, ImageGen, DelegateTool,
WeChatReply, WeComReply, ListMcpResources, ReadMcpResource
```

命名与 Claude Code 高度一致，但有**两处必须注意的差异**（见风险 3）。

### 探测链路已实测

复刻 `findBin()` 逻辑在本机验证：

- 现状：`findBin("codebuddy")` → `null`（应用包内的路径不在 `PATH`，也不在 `searchDirs()` 的额外目录里）
- 把应用包 `cli/bin` 加进额外目录后：`findBin("codebuddy")` → `/Applications/WorkBuddy.app/.../cli/bin/codebuddy` ✅

## 三、需要改动的文件清单

| 文件 | 改动 | 必要性 |
| --- | --- | --- |
| `web/src/lib/clis.ts` | `KNOWN` 加一条 `{ id: "workbuddy", name: "WorkBuddy", bin: "codebuddy", run: "codebuddy -p", url: ..., args: (p) => ["-p", p], parseEvent: parseClaudeEvent, stderrIsFatal: isFatalClaudeStderr }`；`searchDirs()` 的 `extra` 加应用包 `cli/bin` 路径（macOS / Windows / Linux 各一份） | 必需 |
| `docs/SUPPORTED_CLIS.md` | 加一行 `Headless/Batch: codebuddy -p "prompt"`，否则 `clis-coverage` 测试不覆盖它 | 必需（一致性） |
| `doctor.mjs` | `VALID_CLIS` 加 `workbuddy` | 建议 |
| `scaffolder/bin/cli.mjs` | 工具探测列表加一项 | 建议 |
| `web/src/components/config-form.tsx` | 无需改动即可出现选项；仅第 148/220/224 行的硬编码提示文案（"支持 Claude Code、Codex…"）建议补一句 | 可选 |

`config-form.tsx` 的 `pickSoleInstalled()` 逻辑需要留意：它在本机只装了一个 CLI 时会自动选中并写入 localStorage。装了 WorkBuddy 的用户如果同时也装了 `claude`，不会被自动切换，行为安全。

## 四、阻塞项与风险

### ~~阻塞项 1：独立进程鉴权 401~~ —— 已作废

> **2026-09-19 更正：本节结论作废。**
>
> 后续实测表明 401 是 token 刷新的瞬时竞争，重试即通过：
>
> - `-p --output-format stream-json "say PONG"` → `result: "PONG"`、`model: default-model`、`is_error: false`，token 计数正常。
> - `-p "say PONG"`（纯文本）→ 直接输出 `PONG`。
> - 现象模式：**一段时间不活动后的第一次调用返回 401 或空结果，紧接着第二次正常。**
>
> 真实结论：**鉴权可用，不是阻塞。** 但由此暴露一个更需要处理的风险——内置 CLI 与桌面端**共用 `~/.workbuddy`**（配置、会话、日志、token），两边争抢 token 刷新权，可能互相踢下线。隔离方案见 `docs/WorkBuddy企业适配实施计划-2026-09-19.md` 第 6 节。
>
> 下方原始排查记录保留，其中"已排除网络"与"桌面端启动环境"两段仍然有效；"这个 CLI 目前处于未登录状态"及三条解决路径均不再适用。

#### 原始排查记录（部分仍有效）

实测命令与结果：

```
$ /Applications/WorkBuddy.app/.../cli/bin/codebuddy -p "Reply with exactly: PONG"
（stdout 空，exit 0）
stderr: 401 Authentication required. Please use /login command to sign in
        (auth-type:cli-external-link, token-type:Bearer, token-length:1335)
        (proxy: http://127.0.0.1:7897 -> https://www.workbuddy.ai)
```

排查结论：

- **不是网络问题。** `curl https://copilot.tencent.com/` 与 `https://www.workbuddy.ai/` 均返回 200，直连与走代理都通。
- **CLI 确实读到了一个 token**（长度 1335），但被服务端拒绝。
- 桌面端启动这个 CLI 时会注入一整套环境（`main/sidecar-manager.js` 的 `buildAgentCliRuntimeEnv`）：`CODEBUDDY_CONFIG_DIR` / `WORKBUDDY_CONFIG_DIR`、`CODEBUDDY_HOST=workbuddy-desktop`、`CODEBUDDY_FORCE_HEADLESS_BUNDLE=1`、网关密钥（`gatewaySecretEnv()`）、以及把托管 node 目录前置进 `PATH`。手动带上这些环境变量重试，仍是 401。
- `~/.codebuddy`（CLI 的默认配置目录）下只有 `diagnostics/` 和 `logs/`，**没有凭证文件**。`~/.workbuddy` 下也没有 `.credentials.json`。

推断：token 是 `cli-external-link` 类型（由桌面端外部链接登录流程签发），独立进程拿到的这份要么已过期，要么只对桌面端自己的会话/端点有效。**这个 CLI 目前处于"未登录"状态。**

可选的解决路径（按推荐度）：

1. **用户手动登录一次**：终端直接跑 `codebuddy`，按提示 `/login`，让 CLI 把自己的凭证写进 `~/.codebuddy`。之后 `-p` 无头调用应能独立工作。这是最干净、也最符合平台"用你自己已登录的 AI 工具"的设计意图的路径。
2. **平台注入桌面端环境**：在 `spawnHeadlessCli` 的 `env` 里带上 `WORKBUDDY_CONFIG_DIR`、`CODEBUDDY_HOST=workbuddy-desktop` 与网关密钥。但这等于复刻桌面端的私有启动协议，且网关密钥来自 `~/.workbuddy` 内部状态——脆弱，不建议作为首选。
3. **借道 CodeBuddy 官方 CLI 分发**：若 CodeBuddy Code 有独立安装渠道，装成常规 CLI 后走路径 1，就不再依赖应用包内路径。

**在鉴权跑通之前，不应把 `workbuddy` 写进 `KNOWN`**——否则设置页会出现一个"已安装"但一跑就 401 的选项，用户会以为是平台坏了。`clis-coverage` 测试也会因为 `installed: true` 而给出误导性的通过。

### 阻塞项 2：二进制不在 PATH

应用包内路径不在 `PATH`，且随安装位置变化。解决方式（二选一）：

- 在 `searchDirs()` 的 `extra` 里按平台加固定路径（macOS 的 `/Applications/WorkBuddy.app/...`、Windows 的 `%LOCALAPPDATA%` 对应位置）。这与现有 `~/.grok/bin`、`%LOCALAPPDATA%\agy\bin` 的做法一致，是**推荐方案**。
- 或让用户自己 `ln -s` 到 `~/.local/bin`（该目录已在 `searchDirs()` 里）。零代码改动，但多一步手工操作。

另需注意 `bin/codebuddy` 的 shebang 是 `#!/usr/bin/env node`，**依赖 `PATH` 上有 node**。从终端启动的 Next.js dev server 满足；若从 Finder/Dock 启动宿主服务则不一定。更稳的做法是给 `CliSpec` 加一个可选的 `launcher` 字段，用 `process.execPath` 显式拉起——但这是对 `clis.ts` 的接口扩展，建议放到第二步。

### 风险 3：工具名不同，deny 列表不能照抄

平台的权限不变式靠"给 CLI 配一份逐工具 deny 列表"成立。Claude 的 deny 列表（`claude-invocation.mjs`）里 `ALWAYS_DENIED = ["Task"]`、`WRITE_CAPABLE_TOOLS = ["Write","Edit","MultiEdit","NotebookEdit","Bash"]`。

对照 WorkBuddy 的工具集：

- **子 Agent 的对应物不是 `Task`，而是 `Agent`**，另有 `TeamCreate` / `TeamDelete` / `SendMessage` / `DelegateTool` 构成扇出与编排面。照抄 Claude 的 `Task` 会**一个都拦不住**。
- `MultiEdit` / `NotebookEdit` 在 WorkBuddy 工具集中不出现，但 `PowerShell` 出现了——在 Windows 上它和 `Bash` 一样是写能力，`WRITE_CAPABLE_TOOLS` 必须把它算进去。

结论：接 WorkBuddy 时**必须写一份它自己的 deny 列表**，而不是复用 Claude 的常量。好消息是 `--disallowedTools` / `--tools` 提供了机制，这条不变式是可以满足的——不需要像 Grok 那样走"少给几个 worker"的降级方案。

### 风险 4：企业适配（`adapt-provider`）目前是 Codex 专用

`web/src/app/api/run/route.ts` 里：

```ts
if (candidate && cliId === "codex") { ... prepareCodexAdapter(...) }
```

`prepareCodexAdapter` 做四件事：要求 Codex 开启完全访问、建临时 TMPDIR 并前置 node/`~/.local/bin` 到 PATH、校验 `codex exec --help` 含 `danger-full-access`、**并通过 `ego-browser` 预检 Ego Lite 浏览器**。随后把"必须使用 ego-browser 技能和 Ego Lite"追加进 prompt。

对 WorkBuddy 的影响：

- **CLI 本身没有内置浏览器工具**（工具集里只有 `WebFetch` / `WebSearch`）。但它在工具集里有 `Bash` / `Skill` / `ToolSearch` / `DeferExecuteTool` / MCP 资源读取，因此**理论上可以像 Codex 那样，通过 Bash 调 `ego-browser` 或挂载浏览器类 Skill/MCP 来获得浏览器能力**。
- 但这条路径**未经验证**，且 `prepareCodexAdapter` 的预检逻辑（`--help` 里找 `danger-full-access`、Ego Lite 探针）是 Codex 专属的，需要为 WorkBuddy 写一份对应实现，或抽出一个与 CLI 无关的通用预检。

建议：**第一步先只接常规流程**（`evaluate` / `pdf` / `research` 等），把 `adapt-provider` 留作第二阶段，等鉴权和 deny 列表都跑通再动。

### 风险 5：命名与版本耦合

- `codebuddy` / `cbc` / `codebuddy-code` 三个 bin 名指向同一脚本。若用户另外装了 CodeBuddy IDE 的独立 CLI，`findBin` 可能命中另一份，行为不确定。
- 应用包路径含 `app.asar.unpacked`，属于 Electron 的解包产物；`vendor-extract.log` 显示每次启动都会跑 `ensureAll` 校验/清理。实测路径稳定（版本目录内不嵌版本号），但**升级 WorkBuddy 后需要复验**。
- 同一台机器上 `/Applications/WorkBuddy.app` 与 `/Applications/WorkBuddy AI.app` 都存在，两份都有 CLI。`searchDirs()` 里建议只放一个，避免同一工具出现两次（`clis-coverage` 的"id 不重复"检查挡不住这种情况，因为 `bin` 相同、`id` 相同会被 `detectClis` 的 `map` 覆盖成一条——实际上是安全的，但顺序上要确定）。

## 五、建议的两阶段实施

**第一阶段（常规流程接入）**

1. 先解决鉴权：用户在终端跑一次 `codebuddy` 并 `/login`，确认 `codebuddy -p "say OK"` 能出文本。
2. `web/src/lib/clis.ts` 加 `workbuddy` 条目 + `searchDirs()` 加应用包路径。
3. 写 WorkBuddy 专属的 deny 列表（至少含 `Agent`、`TeamCreate`、`TeamDelete`、`DelegateTool`、`PowerShell`），并补一条测试，防止未来有人把 Claude 的常量直接复用过来。
4. `docs/SUPPORTED_CLIS.md` / `doctor.mjs` / `scaffolder` 同步。
5. 用真实 `evaluate` 跑一遍，核对：报告确实落盘、`parseClaudeEvent` 能正确解析 `stream-json`、token 计数没被算错（注意 `cache_creation_input_tokens` 的加法约定）。

**第二阶段（企业适配）**

6. 把 `prepareCodexAdapter` 的预检抽成与 CLI 无关的通用能力，或为 WorkBuddy 写一份对等实现。
7. 验证 WorkBuddy 能否通过 `ego-browser` / 浏览器 Skill 完成真实站点核对，再放开 `adapt-provider`。

## 六、一句话总结

WorkBuddy 桌面端内置的 `CodeBuddy Code` CLI 在**接口层面与平台现有契约几乎完全对齐**（`-p` 纯文本、`stream-json` 结构化流、逐工具 allow/deny），接入是一个 `CliSpec` 条目加一段探测路径的事；真正的门槛是**这个 CLI 当前未登录**，以及**企业适配那条路还绑在 Codex 专属的预检与浏览器链路上**。
