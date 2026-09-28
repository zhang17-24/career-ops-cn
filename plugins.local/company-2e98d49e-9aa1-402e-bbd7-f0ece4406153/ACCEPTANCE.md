# 滴滴候选：开发完成，待平台独立验收（未启用）

以下为历史记录；当前结论见末尾续接章节。

核验时间：2026-09-18T15:55:45Z（UTC）。候选：company-2e98d49e-9aa1-402e-bbd7-f0ece4406153。

## 续接检查与真实入口证据

候选原有 index.mjs、manifest.json 与 test/smoke.mjs 均为生成模板；没有既有 ACCEPTANCE.md、BLOCKED.md 或 ROUTE_REVIEW.json。保留原代码，不覆盖旧版或修改绑定、信任、配置。技能目录返回 []，按用户指定读取本地适配技能、完整 SOP 及 Ego 技能。

配置入口：https://campus.didiglobal.com/ （校园招聘）。
Ego Lite 独立空间 4，正常导航实际落地：https://campus.didiglobal.com/campus_apply/didiglobal/96064#/ 。
页面标题“滴滴 - 校园招聘”，可见正文“滴滴27届秋招正式启动”“滴，向未来出发！”。企业身份一致。
真实“校园招聘”anchor 的 raw href 为 `#/jobs`，resolved href 为 https://campus.didiglobal.com/campus_apply/didiglobal/96064#/jobs 。证据链见 ROUTE_REVIEW.json。

## 方法、证据和结果

- 正常页面导航：goto 等待 load 15 秒超时，但导航已提交、readyState 为 interactive。改为读取同一页 info、snapshot 与 DOM，确认主页正文和真实链接可读。没有把超时判为失效或需要登录。
- 被动读取主页 performance 公开请求 URL：观察到同域 `/api/env`、`/api/outer/ats-jc-apply/website/feature-switches`、`/api/outer/ats-apply/website/group-by-job`、`/api/outer/ats-apply/website/jobs/departments/flat` 等配置/筛选请求。未读取凭证、响应正文或重放请求；这些不是岗位列表证据。页面资源出现 Moka 标识，审核后优先评估可复用 Moka 解析，不据此推定接口结构。
- 页面还产生外域 Moka 遥测请求；未请求生产授权、未主动访问或保存其参数。当前路线仅申请已观察到的同域招聘入口，不把遥测认作必需岗位接口。
- 因入口变化，先提交路线审核并停止开发。未搜索产品官网、未增加无关发现阻塞。后续 HTTP/公开 JSON、SPA 捕获、初始加载 preload、browserListing 的选择依赖批准后真实列表响应及 DOM；当前不存在足以选择解析器或选择器的岗位证据。无需在权限边界前逐一尝试。

## 验证结果（分阶段）

离线：`node plugin-audit.mjs plugins.local/company-2e98d49e-9aa1-402e-bbd7-f0ece4406153` 通过；原有 `test/smoke.mjs` 通过；`node --check .../index.mjs` 通过。仅证明生成模板通过基础检查，不证明官网字段、长编号、异常结构或分页正确。未新增或声称已完成真实固定解析器；后续实现时须更新隔离 fixture，并使用规定的 strict assert 导入。

真实详情抽查：0 页列表、0 个详情；无真实岗位样本、名称/字符串 ID/详情匹配证据。没有猜测详情路径或将示例岗位作为真实数据。分页未实现、未验证，下一阶段仅允许一页列表与最多三个详情。

启用及页面验收：未执行，候选保持未启用、未绑定。没有运行 scan、verify-portals、批量任务、AI 评估、投递或平台配置接口。由平台审核路线后续接原候选，最终独立验收决定安装。

## 当前限制

唯一当前阻塞为入口路线审核；不是登录、验证码或职位过期。列表公开可读性、必要资源域名、公开 API schema 和三条详情尚待审核后核实。ROUTE_REVIEW.json 不代表平台批准，批准后必须原样保留；若后续发现必需新域名需重新审核。


## 2026-09-18T16:21:01Z 续接：入口已批准，新增资源域名待审核

平台本轮提供批准时间 2026-09-18T16:17:22.549Z，原路线 digest 为 2b434098b7603ae9a17b75fa3e396afa6052ce08a3c8b7bce33a1a0528b64139。未重新发现入口、未搜索、未操作旧版。技能中心仍返回 []；按用户指定完整读取适配技能、SOP、Ego 技能，采用 Ponytail full。仅使用 Ego Lite 独立空间 5。

### 方法、证据、结果与纠正

1. 正常打开已批准 #/jobs：页面标题“滴滴 - 校园招聘”，异步加载后可见 146 结果；首屏真实主列表 30 条，另有 8 条最新职位侧栏（`a.link-txmgVOCVz9` 总共 38 个，不可直接作为最终主列表选择器）。未翻页、未更改筛选。登录按钮是可选导航，未出现登录/验证码拦截。
2. 被动 performance 观察到唯一列表端点 `https://campus.didiglobal.com/api/outer/ats-apply/website/jobs/v2`。使用 publicCapturePreload 前已 Page.enable；注册 identifier=1，但相同 URL 的 goto 未产生新文档。跨 CLI 调用 reload 后捕获器不存在；清理注册返回 Script not found，说明该 CDP 注册未在后续会话保留。没有重复失效 responseBody 请求。首次辅助模块导入因 CLI cwd 的 file URL 不合法失败，改为显式真实 file URL 后加载正常。
3. 有依据改用 SPA 导航：回到已经观察、批准的同一招聘主页 #/，安装 publicCaptureScript 精确端点监听，再正常到同一 #/jobs。成功捕获 POST HTTP 200；请求体为 `{"orgId":"didiglobal","siteId":"96064","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"customFields":{},"site":"campus","locale":"zh-CN"}`。响应仅有 `data`、`necromancer` 顶层键，data 是不透明字符串，不是可固定映射的岗位数组。不保存完整响应，不读取凭证，不重放，不研究或解码风控封装。捕获器已 stop 清除。
4. 读取平台 adapter-browser-listing.mjs 契约：支持真实可见 anchor；当前 DOM 具备详情 href 与 `.title-u2qk9xX9Ie` 标题，但尚需收敛主列表与地点选择器。相较之下 inlineDetails 不适用：已有独立真实 anchor，也没有已解析 API 正文可与展开内容独立比对。没有证据支持另一个明文 JSON、服务端岗位 HTML 或静态数据端点，不枚举接口。
5. DOM 的核心 script src / stylesheet href 明确指向 static-ats.mokahr.com（具体地址见新 ROUTE_REVIEW.json），因此 browserListing 需要新域名审核。还观察到第三方验证脚本引用，但未出现验证码、未授予其权限；不因存在脚本就宣称需要登录，不把可选遥测列入申请。到必要 CDN 权限边界即停止，未自行测试或构建未批准生产路线。

### 最小公开列表样本（不是详情验收）

以下 raw href 均为 `#/job/` 加所列字符串 ID；resolved href 前缀为 `https://campus.didiglobal.com/campus_apply/didiglobal/96064`，由真实 anchor.href 读取，未拼猜路径。

| 列表标题 | 字符串 ID | 详情检查 |
|---|---|---|
| 27届秋招-Data Analyst（国际化Intl DS） | 5b938011-04a2-44b9-b83b-5b609d821658 | 未打开 |
| 27届秋招-Business Analyst（国际化Intl DS） | 880f264c-bfd5-4b6d-ae4b-fa9054c92e5f | 未打开 |
| 27届秋招-研发工程师-AI Dev | ae200d70-dd22-4d9b-9652-1df8bd7d5e33 | 未打开 |

第一条列表显示上海市、发布于 2026-09-15，并包含 DS 团队职责、SQL/Python 等任职要求。此处仅用于证明列表有真实内容，不把列表正文当作详情页核对。三个真实详情检查预算全部保留。

### 分阶段验证与交接

- 离线：`node plugin-audit.mjs plugins.local/company-2e98d49e-9aa1-402e-bbd7-f0ece4406153`、原有 `node .../test/smoke.mjs`、`node --check .../index.mjs` 均退出 0。仍是模板检查，不是新适配器测试；未声称已有固定生产解析器。域名批准后实现时须替换示例并使用 `import { strict as assert } from 'node:assert'`。
- 真实详情抽查：一页列表正常可读，0/3 详情，待新域名批准后完成。仅对同一页作捕获方法切换所需重导航，无分页或全量扫描。
- 启用及页面验收：未执行；保持禁用、未绑定，平台最终独立验收决定安装。未运行 scan、verify-portals、AI 评估或任何投递。
- 原已批准 JSON 原字节归档为 ROUTE_REVIEW.approved-20260918.json；新 ROUTE_REVIEW.json 是待审提案，不能继承旧批准。原入口阻塞历史另存，当前 BLOCKED.md 明确保留新资源域名阻塞。

日常目标为平台固定 DOM 读取、零模型 Token；本次 Agent 开发消耗开发 Token。候选尚未完成，不能宣称接入、安装或所有岗位有效。


## 2026-09-18T16:25:16Z–16:27:10Z 续接：开发完成，未启用

本轮平台授权已包含 campus.didiglobal.com 与 static-ats.mokahr.com，批准时间 2026-09-18T16:22:38.896Z，digest 1425a4526da9740d131b2fed7351e28685e46c83e474730c9fe625f9cd3ee39d。ROUTE_REVIEW.json 保持原字节，未新增路线或自写批准。旧 CDN 审核阻塞已解决，归档为 BLOCKED.cdn-approved-history.md。

### 方法与实测

- 仅在 Ego Lite 独立任务空间 9 打开已批准 #/jobs。初始 DOM 显示 0 结果，等待已知岗位 anchor 后出现 30 条主列表；初始空壳未判为真实空列表。没有翻页、筛选、搜索、接口重放或重复 HTTP 捕获。
- 复用前轮公开 POST `/api/outer/ats-apply/website/jobs/v2` 的参数/schema 证据（上一章节），不解码 data 封装。新方法使用平台已有 browserListing；无需研究风控、下载 bundle、猜测 URL 或重复不适用的 HTTP 路线。
- 正常 DOM 实测 `.jobs-AkItzswt6b a.link-txmgVOCVz9` 精确选中主列表 30 条；排除最新职位侧栏 8 条。标题相对 anchor 为 `.title-u2qk9xX9Ie`；地点相对 anchor 为 `.ellipsis-s4h2VX0z8O > div:last-child > .no-adaptive-tooltip`。地点是可见信息行最后一项，观察本页全部 30 条均非空；支持多个城市原文，不用隐藏测量副本。
- 用平台 extractBrowserListing 原函数在同一已加载 Ego 页面读取：30 条、30 个唯一 URL。生产调用 ctx.browserJobs，平台负责匿名加载、批准域名校验与固定 DOM 解析；候选只保持字段原样并从实际 anchor URL 最后一段提取字符串 ID，缺失/重复/错域/异常结构均报错。采用可复用 Moka DOM reader 路线，仅本候选声明滴滴租户与已观察选择器，不修改共享平台。
- 所有详情 URL 均先读取主列表 anchor 的 raw href 与 resolved href，再直接正常导航；没有生成路径、弹窗失败或未命中点击。复用 p2，未点申请、登录或分享。既有独立 anchor 足够，inlineDetails 和局部路由逆向不适用。

### 三个真实详情（本轮全部重新读取）

| UTC 时间 | 标题、字符串 ID | 实际官网详情 URL | 对照与最小正文证据 |
|---|---|---|---|
| 16:25:33 | 27届秋招-Data Analyst（国际化Intl DS）；`5b938011-04a2-44b9-b83b-5b609d821658` | https://campus.didiglobal.com/campus_apply/didiglobal/96064#/job/5b938011-04a2-44b9-b83b-5b609d821658 | 详情标题、URL ID 与列表一致；上海市；DS 团队，策略建模、市场分析、实验评估与跨团队协作职责可读。 |
| 16:25:34 | 27届秋招-Business Analyst（国际化Intl DS）；`880f264c-bfd5-4b6d-ae4b-fa9054c92e5f` | https://campus.didiglobal.com/campus_apply/didiglobal/96064#/job/880f264c-bfd5-4b6d-ae4b-fa9054c92e5f | 详情标题、URL ID 与列表一致；上海市；Business Analyst 职责包括监测指标、市场分析、项目执行和事后评估。 |
| 16:26:16 | 27届秋招-研发工程师-AI Dev；`ae200d70-dd22-4d9b-9652-1df8bd7d5e33` | https://campus.didiglobal.com/campus_apply/didiglobal/96064#/job/ae200d70-dd22-4d9b-9652-1df8bd7d5e33 | 详情标题、URL ID 与列表一致；北京市；AI Coding Agent、Agent 知识平台与研发工具建设；2027届毕业生及后端语言要求可读。 |

三个页面均有职位描述和申请按钮，未见关闭/404/登录验证码拦截；未进行申请。ID 是官方路由公开标识，不声称详情正文另有编号字段。抽样不代表其余岗位全部可投递。

### 分阶段验证

1. **离线测试：通过。** `node plugins.local/company-2e98d49e-9aa1-402e-bbd7-f0ece4406153/test/smoke.mjs` 零网络：固定 reader 字段映射、长字符串编号、不同 ID 同名、重复编号、空/异常列表、缺失字段、错域、reader 异常传播和单次委托（无分页）。隔离的内存 fixture 不供生产导入。DOM fixture 只测契约逻辑；CSS 对真实结构的验证来自本轮 Ego 读取。
2. **静态与语法：通过。** `node plugin-audit.mjs plugins.local/company-2e98d49e-9aa1-402e-bbd7-f0ece4406153` 为 audit clean；`node --check` 分别检查 index.mjs、test/smoke.mjs，均退出 0。未削弱检查器。
3. **开发真实详情抽查：3/3 可读并匹配。** 一页主列表 30 条；无额外页、无全量扫描。时间来自现场 UTC。
4. **启用及页面验收：未执行，待平台。** Ego 会话可读性不替代平台匿名 Chromium 独立验收。候选保持禁用/未绑定；未改配置、信任、锁文件或旧版。平台验证真实列表和三详情后决定是否自动安装，失败应保留旧版。

### 限制

单页读取，无分页；不声称全量覆盖。CSS 类名变化、空结果或资源缺失会失败关闭；平台会阻断批准范围外的遥测和其他资源，若必要资源导致匿名读取失败，保留未验收状态并按证据处理。未发现当前必须追加的生产域名，不授权遥测或验证服务。未附加未经独立读取的描述或发布时间。日常运行使用固定代码、零模型 Token，但需要浏览器资源；本次 Agent 开发消耗开发 Token。

最终同页验证（2026-09-18T16:27:10.695Z）：preserveIds 输出与平台 assertBrowserJobsMatch 对照通过，共 30 条；没有重新导航。Ego Lite 任务空间 9 已 finish({keep: []}) 清理。当前无活动 BLOCKED.md；历史阻塞文件仅保留审计过程。
