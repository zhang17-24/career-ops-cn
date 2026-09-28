# 测试验收文档：WorkBuddy 企业适配

状态：**待审批**（TDD 文档先于实现，本文件是编码的输入）
日期：2026-09-19
配套：`docs/WorkBuddy企业适配执行方案-2026-09-19.md`
强制前置阅读：`docs/招聘源适配验收SOP.md`

---

## 0. TDD 执行顺序（硬性）

每个模块按 **红灯 → 实现 → 绿灯** 推进，不允许先写实现再补测试。

1. 按本文件写测试用例 → 运行 → **确认失败**（且失败原因是用例描述的缺失，不是语法错误）
2. 写实现
3. 运行 → 绿灯
4. 跑全量回归（第 8 节）

**红灯必须被观察过。** 一个从没红过的测试是假设，不是证据。

---

## 1. 测试分层与运行命令

| 层 | 位置 | 运行命令 | 覆盖 |
| --- | --- | --- | --- |
| 单元 | `web/tests/lib/*.test.mjs` | `cd web && npm test` | 纯函数、注入式依赖 |
| 集成 | `web/tests/lib/*.test.mjs`（同上） | 同上 | 路由处理函数、模块协作 |
| 全量回归 | 仓库根 | `node test-all.mjs` | 含 `web/tests/lib` 自动发现（`test-all.mjs:15803`） |
| 端到端 | 手动 + 平台页面 | 见第 5 节 | 设置页 → 企业适配全链路 |
| 真实数据 | 手动 + 平台页面 | 见第 7 节 | 真实官网读取 |

**新测试文件无需手工登记**：`test-all.mjs` 用 `readdirSync` 发现 `web/tests/lib/*.test.mjs`，新增即被 CI 门禁覆盖。

---

## 2. 单元测试用例

### UT-01 · `workbuddyStreamArgs`（`run-cli-support.mjs`）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-01-1 | 调用 `workbuddyStreamArgs("PROMPT")` | 返回数组，`[0] === "-p"` |
| UT-01-2 | 同上 | 含 `--output-format` 且其后为 `stream-json` |
| UT-01-3 | 同上 | **含 `--include-partial-messages`**（回归守卫：缺它则 `parseClaudeEvent` 收不到文本，成功运行被误报"无输出"） |
| UT-01-4 | 同上 | **含 `--no-session-persistence`**（隔离要求，见第 6 节） |
| UT-01-5 | 同上 | prompt 是最后一个元素，且逐字等于入参 |
| UT-01-6 | 同上 | **不含**任何权限放行参数（`--permission-mode`、`-y`、`--dangerously-skip-permissions`）——放行只在适配器注入 |

### UT-02 · `parseClaudeEvent` 对 WorkBuddy 真实事件的兼容性

fixture 用**本机实测抓取的真实事件行**（已脱敏，见第 9 节），不得手写理想化样本。

| # | 输入事件 | 预期 |
| --- | --- | --- |
| UT-02-1 | `{"type":"system","subtype":"init",...}` | `{ status: "Agent ready" }` |
| UT-02-2 | `{"type":"stream_event","event":{"type":"content_block_delta","delta":{"text":"PO"}}}` | `{ text: "PO" }` |
| UT-02-3 | `{"type":"stream_event","event":{"type":"content_block_start","content_block":{"type":"tool_use","name":"Bash"}}}` | `{ tool: "Bash" }` |
| UT-02-4 | `result` 事件，`usage` 为 `{input_tokens:21311,output_tokens:2,cache_creation_input_tokens:21311}` | `tokens === 42624`（**加法**，Claude 约定；不得用 Codex 的减法） |
| UT-02-5 | `result` 事件，`total_cost_usd: 0` | `costUsd === 0`（0 是**已报告的值**，不得当成缺失） |
| UT-02-6 | `result` 事件，`is_error: true` | `{ error: <非空字符串> }`，且仍携带 usage（失败也要记消耗） |
| UT-02-7 | WorkBuddy 特有噪声：`ai-title`、`file-history-snapshot`、`system/status` | 返回 `null`，**不抛异常、不产出事件** |
| UT-02-8 | `{"type":"assistant","message":{...}}` | 返回 `null`（这是整条消息，不是增量；文本走 UT-02-2 的通道） |
| UT-02-9 | `"null"` / `"123"` / `"\"str\""` / 空行 | 返回 `null`，不抛异常 |

**UT-02-7 与 UT-02-8 是本组的关键**：WorkBuddy 会发多种 Claude 不发的事件类型。若解析器对未知类型抛错，整个运行会在 stdout 处理器里炸掉。

### UT-03 · `prepareWorkbuddyAdapter`

注入式 `run`（镜像 `codex-adapter-runtime.test.mjs`），不触碰真实 CLI。

**权限与校验（全部不得调用 `run`）**

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-03-1 | 未开启 WorkBuddy 完全访问 | 抛错，信息含"未调用 AI"；`run` **一次都没被调用** |
| UT-03-2 | 只开启了 Codex 的 `fullAccess`（旧文件 `{"fullAccess":true}`） | **仍抛错**——不得继承 Codex 的授权 |
| UT-03-3 | 候选编号不是 `company-<uuid>` | 抛错 |
| UT-03-4 | 候选目录含符号链接 | 抛错 |
| UT-03-5 | `binPath --help` 输出不含 `--permission-mode` | 抛错，信息指明版本不支持 |
| UT-03-6 | `binPath --help` 输出不含 `--output-format` | 抛错 |

**环境构造**

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-03-7 | 成功路径返回的 `env.CODEBUDDY_CONFIG_DIR` | 指向项目内隔离目录，**不等于 `~/.workbuddy`**，且不以其为前缀 |
| UT-03-8 | `env.PATH` | 以 `path.dirname(process.execPath)` 开头，且含 `~/.local/bin` |
| UT-03-9 | `env.TMPDIR`/`TMP`/`TEMP` | 三者相等，且指向本次 scratch 目录 |
| UT-03-10 | 成功路径返回的 `env` | 不修改 `process.env` 本身（不得污染宿主进程） |

**argv 构造**

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-03-11 | 成功路径 `args` | 含 `--permission-mode` 且其后为 `bypassPermissions` |
| UT-03-12 | 成功路径 `args` | 含工具白名单参数，值为 `Read,Write,Edit,Bash,Glob,Grep,WebFetch,WebSearch` |
| UT-03-13 | 成功路径 `args` 的工具集 | **不含** `ComputerUse`、`Agent`、`TeamCreate`、`CronCreate`、`PowerShell`、`NotebookEdit`、`WeChatReply`、`WeComReply` |
| UT-03-14 | 成功路径最后一个 `args` 元素 | 含 `Ego Lite` 与 `ego-browser` 字样（浏览器约束已追加） |
| UT-03-15 | 成功路径 `args` | 含 `--no-session-persistence` |

**资源清理**

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-03-16 | `dispose()` 调用两次 | 幂等，不抛错 |
| UT-03-17 | `dispose()` 之后 | scratch 目录已不存在 |
| UT-03-18 | 任一预检步骤失败 | scratch 目录仍被清理（失败路径也 dispose） |
| UT-03-19 | 写权限探针 | 在候选目录与 scratch 各成功写入并删除一次；任一处失败 → 抛错 |

### UT-04 · `warmupWorkbuddyAuth`（冷启动 401 有界重试）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-04-1 | 第 1 次返回 401、第 2 次成功 | 最终成功，不抛错 |
| UT-04-2 | 连续 2 次都 401 | 抛错，信息说明"凭证刷新失败，请重试"，且**不继续重试** |
| UT-04-3 | 第 1 次返回非 401 错误（如 `unknown option`） | **不重试**，立即抛错（只有冷启动 401 可重试） |
| UT-04-4 | 第 1 次成功 | 只调用 1 次 |
| UT-04-5 | 401 重试期间 | 不产生任何文件写入（401 发生在鉴权层，无副作用） |

### UT-05 · 权限模块按 CLI 拆分（`codex-permissions.mjs`）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-05-1 | 旧文件 `{"fullAccess":true}` | `readCodexPermissions().fullAccess === true`；`readWorkbuddyPermissions().fullAccess === false` |
| UT-05-2 | 文件不存在 | 两者均为 `false`，不抛错 |
| UT-05-3 | 文件格式错误（非 JSON / 字段类型错） | 抛错，且**绝不被覆盖** |
| UT-05-4 | `saveWorkbuddyPermissions(true)` 后 | `fullAccess` 原值保留，`workbuddyFullAccess === true` |
| UT-05-5 | `saveCodexPermissions(false)` 后 | `workbuddyFullAccess` 原值保留 |
| UT-05-6 | 写入后文件权限 | `0o600` |
| UT-05-7 | 写入过程 | 用临时文件 + rename（原子），不产生半截文件 |

### UT-06 · 适配器分发（`adapter-runtime.mjs`）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-06-1 | `cliId === "codex"` | 调用 `prepareCodexAdapter` |
| UT-06-2 | `cliId === "workbuddy"` | 调用 `prepareWorkbuddyAdapter` |
| UT-06-3 | `cliId` 为 `claude`/`gemini`/其他 | 返回 `null`，**不抛错、不静默降级** |
| UT-06-4 | 两者返回形状 | 均为 `{ args, env, dispose }`，字段类型一致 |

### UT-07 · CLI 清单与守卫（`clis.ts`）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-07-1 | `KNOWN` 含 `id: "workbuddy"` 且 `bin: "codebuddy"` | 通过（`clis-coverage` 既有守卫） |
| UT-07-2 | `KNOWN` 中 `id` 无重复 | 通过 |
| UT-07-3 | `KNOWN` 数组体内不含 `--permission-mode bypassPermissions` | 通过（**新增守卫**） |
| UT-07-4 | 同上，也不含 `-y`、`--dangerously-skip-permissions` | 通过 |
| UT-07-5 | 变异检查：把 `--permission-mode bypassPermissions` 注入 `KNOWN` | 守卫**必须变红**（证明守卫有判别力） |
| UT-07-6 | `docs/SUPPORTED_CLIS.md` 标了 Headless 的 CLI 都在 `KNOWN` 里 | 通过（既有守卫） |

### UT-08 · 探测逻辑（`searchDirs` / `findBin`）

| # | 用例 | 预期 |
| --- | --- | --- |
| UT-08-1 | `searchDirs()` 在 darwin 下 | 含两个 WorkBuddy 应用包的 `cli/bin` 路径 |
| UT-08-2 | 同上，非 darwin 平台 | **不含** macOS 路径（不得跨平台泄漏） |
| UT-08-3 | `findBin("codebuddy", dirs)` 且目标存在 | 返回绝对路径 |
| UT-08-4 | 目标不存在 | 返回 `null`，`detectClis()` 中该条 `installed === false` |
| UT-08-5 | 目标存在但无执行位 | 返回 `null`（不得把不可执行文件报成可用） |
| UT-08-6 | PATH 中已有独立 `codebuddy` | 返回 PATH 里那份（顺序：PATH 优先于 extra） |

---

## 3. 集成测试用例

### IT-01 · `/api/clis` 返回 WorkBuddy 条目

| # | 用例 | 预期 |
| --- | --- | --- |
| IT-01-1 | GET `/api/clis` | `clis` 数组含 `{ id: "workbuddy", name, run, url, installed, path }` |
| IT-01-2 | 条目字段完整性 | 与其它 CLI 条目字段一致（UI 依赖统一形状） |

### IT-02 · `/api/codex-permissions` 支持按 CLI 写入

| # | 用例 | 预期 |
| --- | --- | --- |
| IT-02-1 | POST `{ workbuddyFullAccess: true }` | 200，返回两个字段的当前值 |
| IT-02-2 | POST `{}`（都不提供） | 400，不写文件 |
| IT-02-3 | POST 非本机 Origin | 403（沿用 `localPermissionRequest`） |
| IT-02-4 | POST 字段类型错（字符串） | 400，不写文件 |
| IT-02-5 | GET | 返回 `{ fullAccess, workbuddyFullAccess }` |

### IT-03 · `/api/run` 的 `adapt-provider` 分支

用注入/打桩的 `prepareAdapterRuntime`，不启动真实 CLI。

| # | 用例 | 预期 |
| --- | --- | --- |
| IT-03-1 | `cliId: "workbuddy"` + 候选存在 | 调用 `prepareWorkbuddyAdapter`，其 `args`/`env`/`dispose` 被采用 |
| IT-03-2 | 预检抛错 | 调 `enterpriseAction("fail")`，返回 503，**不启动 CLI** |
| IT-03-3 | `cliId: "claude"` + 候选存在 | 分发返回 `null`，沿用 `claudeCliArgs`（**Codex/Claude 路径零回归**） |
| IT-03-4 | `cliId: "workbuddy"` 但 `managedPublic` 未授权 | 403（沿用既有本机授权检查） |
| IT-03-5 | 客户端断开（`req.signal.aborted`） | `dispose()` 被调用，`enterpriseAction("fail")` 被调用 |

### IT-04 · Codex 路径不回归

| # | 用例 | 预期 |
| --- | --- | --- |
| IT-04-1 | `codex-adapter-runtime.test.mjs` 全绿 | 通过 |
| IT-04-2 | `spawn-cli.test.mjs` 全绿（`codexPermissionArgs` 行为不变） | 通过 |
| IT-04-3 | `prepareCodexAdapter` 的 `args` 仍含 `danger-full-access` 语义 | 通过 |

---

## 4. 端到端测试用例 · 前端设置页

**这是本文件的重点之一：设置页要出现一个可配置的 WorkBuddy 选项，点击后即可在平台上使用该 Agent。**

### E2E-01 · 选项出现与可选中

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开设置页 | 「AI 工具」区域列出全部 CLI，**含 WorkBuddy 卡片** |
| 2 | 查看 WorkBuddy 卡片 | 显示名称 `WorkBuddy` 与运行命令 `codebuddy -p` |
| 3 | 本机已安装时 | 显示 ✓ 图标 + 实际二进制路径（截断显示） |
| 4 | 本机未安装时 | 显示未安装图标 + 「安装」外链，且**按钮禁用、点击无效** |
| 5 | 点击 WorkBuddy 卡片 | 卡片进入选中态（高亮边框） |

### E2E-02 · 选择被持久化

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 点击选中 WorkBuddy | `localStorage["career-ops:config"].cliId === "workbuddy"` |
| 2 | 刷新页面 | WorkBuddy 仍为选中态 |
| 3 | 关闭浏览器重开 | 仍为选中态 |
| 4 | 同一浏览器中已选过 `claude` | **不被自动切换**（`pickSoleInstalled` 只在从未保存过时生效） |

### E2E-03 · 选中后平台各处真正使用 WorkBuddy

逐个入口核对「实际发出的请求 `cliId === "workbuddy"`」：

| # | 入口 | 文件 | 预期 |
| --- | --- | --- | --- |
| E2E-03-1 | 岗位评估 / 求职工作台 | `web/src/components/jobs/job-store.tsx:113` | 请求体 `cliId: "workbuddy"` |
| E2E-03-2 | 简历解析 | `web/src/components/cv/cv-ingest.tsx` | 同上 |
| E2E-03-3 | 简历工作台 | `web/src/components/cv/cv-workspace.tsx:62` | 同上 |
| E2E-03-4 | 探索页 AI 分析 | `web/src/components/explore/explore-provider.tsx:426` | 同上 |
| E2E-03-5 | 投递助手 | `web/src/components/apply/apply-provider.tsx:54` | 同上 |
| E2E-03-6 | 助手控制台 | `web/src/components/assistant-console.tsx:167` | 同上，且底部显示"使用 workbuddy" |
| E2E-03-7 | 用量计量 | `web/src/components/usage-meter.tsx:32` | 同上 |
| E2E-03-8 | 收件箱分诊 | `web/src/components/inbox/inbox-triage.tsx:50` | 有 CLI 时不再提示未配置 |

**任一处仍发 `cliId: "claude"` 或 `null` 即为失败**——这类"设置页看着选中了、实际没用上"的漂移正是本组要抓的。

### E2E-04 · 权限开关独立

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 打开设置页 | 出现**两个独立**复选框：Codex 完全访问 / WorkBuddy 完全访问 |
| 2 | 勾选 WorkBuddy | 出现确认弹窗，文案**明确指向 WorkBuddy**，不复用 Codex 的文案 |
| 3 | 确认 | `web/.codex-permissions.local.json` 中 `workbuddyFullAccess: true`，`fullAccess` 不变 |
| 4 | 刷新页面 | 两个开关各自保持状态 |
| 5 | 关闭 Codex 开关 | WorkBuddy 开关不受影响 |
| 6 | 只开 Codex、不开 WorkBuddy，触发企业适配 | 明确报错"请先开启 WorkBuddy 完全访问"，**不调用 AI**、不产生文件 |

### E2E-05 · 未配置时的引导

| # | 用例 | 预期 |
| --- | --- | --- |
| E2E-05-1 | 无任何 CLI 已安装 | 设置页显示引导文案，且引导里提到 WorkBuddy 或保持原有免费方案引导（二者其一，不得空白） |
| E2E-05-2 | 未选 CLI 就触发需要 AI 的操作 | 提示"请先在设置中连接 AI 工具"（沿用既有文案） |

---

## 5. 端到端测试用例 · 企业适配全链路

前置：设置页已选 WorkBuddy，WorkBuddy 完全访问已开启，候选企业已在 `portals.yml` 配置。

### E2E-10 · 正常路径

| 步骤 | 操作 | 预期 |
| --- | --- | --- |
| 1 | 企业卡片点「Agent 适配」 | 平台创建候选目录 `plugins.local/company-<uuid>/` |
| 2 | 观察运行日志 | 出现预检通过信号；随后出现 Ego Lite 相关的浏览器操作 |
| 3 | 等待结束 | 候选目录出现 `index.mjs` 与 `ACCEPTANCE.md` |
| 4 | 平台自动验收 | 日志出现"正在独立验收真实列表和详情" |
| 5 | 验收通过 | 日志出现"已通过平台验收，自动安装、启用并绑定"，旧版文件保留 |
| 6 | 核对绑定 | `portals.yml` 中该企业 `provider` 指向新候选 |

### E2E-11 · 失败与分支路径

| # | 场景 | 预期 |
| --- | --- | --- |
| E2E-11-1 | 预检失败（如权限未开、Ego Lite 未启动） | 返回 503，日志给出具体原因，**旧版保留**，候选标记失败 |
| E2E-11-2 | 新域名/新入口出现 | 显示"等待路线审核 · 未安装"，**不是红色失败**；`ROUTE_REVIEW.json` 已写入 |
| E2E-11-3 | Agent 写 `BLOCKED.md` | **不安装**，原因展示 `BLOCKED.md` 内容（截断 500 字） |
| E2E-11-4 | Agent 未写 `ACCEPTANCE.md` | **不安装**，提示"未产出 ACCEPTANCE.md，开发未完成" |
| E2E-11-5 | 同时有 `BLOCKED.md` 与 `ACCEPTANCE.md` | **阻塞优先**，不安装 |
| E2E-11-6 | 任务超时 | 提示已超时、旧版未替换，**不报"CLI 没保存报告"** |
| E2E-11-7 | 客户端断开 | 任务取消，`enterpriseAction("fail")` 被调用 |
| E2E-11-8 | 冷启动 401 | warmup 自动重试后继续，用户无感；若重试耗尽，报"凭证刷新失败，请重试"而非"未登录" |

### E2E-12 · 适配器产出物质量（对齐 SOP）

| # | 用例 | 预期 |
| --- | --- | --- |
| E2E-12-1 | `node plugin-audit.mjs plugins.local/<id>` | 通过，未削弱检查器 |
| E2E-12-2 | 离线 fixture 测试 | 通过，且测试中**不访问网络** |
| E2E-12-3 | 候选代码 | 不含 mock / 硬编码岗位 / 示例数据兜底 |
| E2E-12-4 | 长岗位编号 | 全程按字符串处理，未经过 `Number` |
| E2E-12-5 | `manifest.json` 的 `allowedHosts` | 只含实际使用的域名 |
| E2E-12-6 | 仓库中 | 无 Cookie、Token、个人信息、完整生产响应 |

---

## 6. 状态隔离验收（独立成章）

**目的：证明跑 WorkBuddy 企业适配不会干扰桌面端 App，不再造成"需要重新登录"。**

这是本方案的硬性验收项，不是可选项。

### ISO-01 · 配置目录隔离

| # | 用例 | 预期 |
| --- | --- | --- |
| ISO-01-1 | 一次完整 `adapt-provider` 运行 | 子进程 `env.CODEBUDDY_CONFIG_DIR` 指向项目内隔离目录 |
| ISO-01-2 | 运行结束后 | 隔离目录内有本次会话产物（证明它确实被使用，而非只是设了个没用的变量） |
| ISO-01-3 | 运行结束后 | `~/.workbuddy/sessions/` **无新增**本次运行的会话 |
| ISO-01-4 | 运行结束后 | `~/.workbuddy/logs/<今日>/` **无新增** `cwd` 指向本项目的日志文件 |

### ISO-02 · 不落会话

| # | 用例 | 预期 |
| --- | --- | --- |
| ISO-02-1 | 子进程 argv | 含 `--no-session-persistence` |
| ISO-02-2 | 运行结束后 | 无新的会话文件写入任何配置目录 |

### ISO-03 · 凭证不被触碰

| # | 用例 | 预期 |
| --- | --- | --- |
| ISO-03-1 | 运行前后 | `~/.workbuddy` 下配置文件（`settings.json`、`models.json`、`user-state.json` 等）的 mtime **不变** |
| ISO-03-2 | 运行期间 | 平台不读取、不写入任何凭证文件 |
| ISO-03-3 | 运行期间 | 桌面端 App 保持登录（人工确认：运行前后 App 无需重新登录） |

### ISO-04 · 无并发与无后台活动

| # | 用例 | 预期 |
| --- | --- | --- |
| ISO-04-1 | 未点击任何操作时 | 无任何 WorkBuddy 子进程 |
| ISO-04-2 | 页面空闲 10 分钟 | 无任何 WorkBuddy 子进程（无轮询、无后台探测） |
| ISO-04-3 | 预检阶段 | 只执行 `--help`，**不调用模型**、不访问招聘站 |

### ISO-05 · 回归对照（若出现干扰）

| # | 用例 | 预期 |
| --- | --- | --- |
| ISO-05-1 | 桌面端**开启**时跑一次适配 | 记录 App 登录状态变化 |
| ISO-05-2 | 桌面端**关闭**时跑一次适配 | 记录 App 登录状态变化 |
| ISO-05-3 | 两次结果对比 | 若隔离生效，两次均不应导致 App 掉线；若仍掉线，转决策点 5 的独立 CLI 方案 |

**ISO-03-3 与 ISO-05 是唯一能真正回答"还会不会掉登录"的用例**，必须人工执行并留记录，不得用"应该没问题"替代。

---

## 7. 真实数据验收（按 SOP 分三段，不得合并）

### ACC-01 · 离线测试

| # | 用例 | 预期 |
| --- | --- | --- |
| ACC-01-1 | 运行候选的 `test/smoke.mjs` | 通过；证明字段映射、空结果、异常响应不产生伪岗位 |
| ACC-01-2 | 静态检查 | `node plugin-audit.mjs plugins.local/<id>` 通过 |
| ACC-01-3 | 语法检查 | 通过 |

### ACC-02 · 真实详情抽查

| # | 用例 | 预期 |
| --- | --- | --- |
| ACC-02-1 | 一页列表读取 | 返回真实岗位，非空、非 mock |
| ACC-02-2 | 三个详情逐条核对 | 列表名称与编号 → 实际点击地址 → 详情名称、描述**三项一致** |
| ACC-02-3 | 不足三个样本 | **如实记录数量**，状态为"待在线验收"，不得宣称接入成功 |
| ACC-02-4 | 遇到登录/验证码 | 停止，控制权交给用户，**不绕过** |
| ACC-02-5 | `ACCEPTANCE.md` 内容 | 含入口、核验时间、实际列表请求、样本名称/字符串编号/详情 URL/核验结果、离线测试命令与结果、分页限制、未完成事项 |

### ACC-03 · 启用及页面验收

| # | 用例 | 预期 |
| --- | --- | --- |
| ACC-03-1 | `node plugins.mjs enable <id> --confirm` | 启用并绑定目标企业 |
| ACC-03-2 | 确认扫描器实际加载插件 | 不只检查配置中的 `enabled` |
| ACC-03-3 | 从产品页面仅选该企业跑一次零 Token 扫描 | 核对真实返回与详情；不调用 AI 评估、不提交申请 |
| ACC-03-4 | 记录启用/绑定/加载/页面扫描/详情核对各自结果 | 逐项报告，不合并 |

**判定纪律**：三段分别报告。**抽样通过不代表全部岗位有效。** 没有真实证据不得宣布真实接入成功。

---

## 8. 回归清单（每次改动后必跑）

| # | 命令 / 套件 | 为什么 |
| --- | --- | --- |
| REG-01 | `cd web && npm test` | 全部 web 单元/集成测试 |
| REG-02 | `node test-all.mjs` | 全量回归，含 `web/tests/lib` 自动发现 |
| REG-03 | `cd web && npm run typecheck` | 类型不回归 |
| REG-04 | `codex-adapter-runtime.test.mjs` | Codex 路径零回归 |
| REG-05 | `spawn-cli.test.mjs` | `codexPermissionArgs` 行为不变 |
| REG-06 | `clis-permissions.test.mjs` | 权限不变式未被削弱 |
| REG-07 | `clis-coverage.test.mjs` | 清单一致性 |
| REG-08 | `run-cli-support.test.mjs` | 解析器与 argv 契约 |
| REG-09 | `plugin-audit.mjs` | 验收器未被削弱 |

**禁止事项**：为了让测试变绿而放宽 `AUTO_APPROVE` 黑名单、削弱 `plugin-audit.mjs`、或删除既有断言。发现既有测试与新设计冲突时，**先报告冲突再讨论**，不静默修改。

---

## 9. Fixture 与测试数据规范

1. **UT-02 的事件 fixture 必须是本机真实抓取的**，脱敏后存入 `web/tests/fixtures/workbuddy-stream-jsonl/`。不得手写理想化样本——手写样本只能证明"我以为它长这样"。
2. 脱敏范围：删除 `session_id`、`uuid`、`_requestId`、`_meta.traceparent`、`cwd`、账号相关信息。保留 `type`/`subtype`/`event`/`usage`/`is_error` 等结构字段。
3. 生产模块**不得**导入任何 fixture（SOP「真实数据底线」）。
4. 候选适配器的 fixture 必须与生产隔离。

---

## 10. 通过 / 失败判定

| 结论 | 条件 |
| --- | --- |
| **单元与集成通过** | 第 2、3 节全部用例绿，第 8 节回归全绿 |
| **隔离通过** | 第 6 节 ISO-01～ISO-04 全绿，且 ISO-03-3 / ISO-05 有人工记录 |
| **真实接入成功** | 第 7 节 ACC-01/02/03 **三段全部**通过，且证据可复核 |
| **未验证** | 上述任一未做 —— 必须如实标为"未验证"，不得用绿色图标或"应该可以"替代 |

**不得**在 ACC-03 完成前声明"企业适配已接入成功"。前两段只证明机制通了，不证明真实岗位可读。

---

## 11. 一句话总结

本文件把"能不能用"拆成了可执行、可复核的用例：**单元层锁死 argv 与解析器契约，集成层锁死权限分层与 Codex 零回归，前端 E2E 锁死"设置页能选、选了真用上"，隔离用例专门回答"还会不会把你踢下线"，真实数据三段按 SOP 分开报告。** 实现之前先让这些用例红起来。
