# 帆软候选：开发完成，等待平台独立验收

候选 `company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e`；本次核验完成时间 2026-09-13 00:38:28 +08:00（2026-09-12T16:38:28.407Z）。本节为当前状态，下方保留此前历史。候选保持禁用，未修改旧版、manifest 权限、路线申请、配置、绑定、信任或锁文件。

## 本轮真实取证

复用原候选；原空间44已不存在，创建独立 Ego Lite 空间45。只加载一次已批准校招列表 https://join.fanruan.com/campus，未翻页或搜索。无需重做企业身份或入口发现；已批准首页→校招→同地址公开API链不变，ROUTE_REVIEW.json 保持原字节。未发现可复用的公共 ATS，采用本企业固定 HTTP 解析。

先 Page.enable，再 Page.addScriptToEvaluateOnNewDocument 注册 `publicCapturePreload(endpoint, documentUrl)`，两个地址均为上述批准 campus URL；随后正常导航。初始 XHR 确实捕获，非仅注册成功。finally 已移除注册并 stop 捕获器。没有请求重放、Cookie/Token/请求头读取、签名分析、getResponseBody 重试或完整响应落盘。

实际公开列表请求：`POST https://join.fanruan.com/campus`，body=`filter=1&page=1&w=`，HTTP 200。响应顶层字段 `list/pageTotal/curPage/pageSize/dataTotal`；实际值为 list.length=10、pageTotal=3、curPage="1"、pageSize=10、dataTotal="24"。使用字段 id（真实字符串）、job_name、base、duty、requirement；不使用 salary、submit 或 update_date 生成额外事实。发布时间未映射。

生产只发一次该 POST，Content-Type 为标准 application/x-www-form-urlencoded，不做初始化、不携带凭证、不翻页；ctx.fetchJson 提供平台受限 HTTP。列表接口与网页同址，但返回的公开业务 JSON 已直接观察。运行时不使用 Ego CLI、浏览器、模型、测试 fixture 或缓存兜底。空结果仅在完整分页结构一致时返回 []；网络异常、非 JSON/缺字段、异常分页、缺失/非字符串/重复编号均抛错。

## 三条新鲜详情证据

公开页面内的局部导航代码明确：`$('div').on('click', '.job-item', ...)`，读取 `$(this).data('id')`，调用 `window.open("/campus/detail?id="+id)`。三次真实卡片点击均确认这一映射，非从 ID 猜路径。先对标题 span scrollIntoView(center)，等待布局稳定，确认整个标题矩形在视口且 elementFromPoint 命中，再执行真实 click；每次检查 pageInfo 和 listTabs。详情复用/关闭，最多一个详情标签。列表 DOM data-id、API 字符串ID及真实 URL id 一致。

| 字符串ID | API及详情标题 | 真实点击地址 | 最小公开样本 | 本轮结果 |
|---|---|---|---|---|
| 9886 | 后端开发工程师（AI团队定向） | https://join.fanruan.com/campus/detail?id=9886 | 南京, 成都, 无锡；参与业务 Agent 及 Agent 平台能力开发 | 标题/ID/地点/完整职责/完整要求一致 |
| 9871 | 后台开发工程师 | https://join.fanruan.com/campus/detail?id=9871 | 南京, 成都, 无锡；Java服务器端功能开发与维护 | 标题/ID/地点/完整职责/完整要求一致 |
| 9872 | 前端开发工程师 | https://join.fanruan.com/campus/detail?id=9872 | 无锡, 南京；FineUI + React 界面开发维护 | 标题/ID/地点/完整职责/完整要求一致 |

完整 duty 和 requirement 仅在内存中与详情 body.innerText 比较（去除空白后逐段包含），三条两项均 true；未保存完整生产响应。三页均正常正文，没有登录、短信、验证码、明确关闭或404；未点击投递。

操作纠正：第一次对较高卡片的矩形检查未通过，未点击；改为滚动实际标题 span 并命中后点击。首条点击已正常新开9886详情，但脚本误把 listTabs 的 targetId 当 id，报 No new detail tab；随后读取已有 targetId 并核对该现存详情，没有重复点击或重新加载列表。这是工具结果字段误用，不是官网连接/弹窗失败。

## 离线测试及开发检查

- `node plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/test/smoke.mjs`：通过，zero network。覆盖字段映射、长字符串及前导零编号、不同ID同名岗位、重复/缺失/数字编号拒绝、空列表、坏schema、分页不一致、请求失败传播、企业入口约束、一次请求且只读第一页。
- `node plugin-audit.mjs plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e`：audit clean。
- `node --check plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/index.mjs` 与 `node --check plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/test/smoke.mjs`：通过，exit 0。

旧阻塞“无法取到响应 schema”已通过新预加载方法实际解决，原 BLOCKED.md 原文归档为 BLOCKED.resolved-20260913.md。不存在未解决的开发阻塞。

## 阶段与限制

1. 离线测试：通过；不能替代真实验收。
2. 真实详情抽查：本轮3/3通过；只验证第一页中的三条，不声称其余21条有效或能提交。生产固定最多第一页10条，忽略 max_pages；没有全量覆盖承诺。
3. 启用及页面验收：未执行。新生产解析器尚未由平台匿名 HTTP 独立运行，平台将在任务结束后独立读取一页及三个详情、决定是否安装并替换绑定。浏览器公开响应成功不等于该独立阶段通过；失败应保留旧版。没有自行扫描、安装、启用、绑定、信任、AI评估、申请、提交或推送。

日常固定 HTTP 解析不调用模型，零 Token；本轮 Agent 开发消耗开发 Token。

---

# 历史记录：最初路线审核与未完成开发

- 候选：company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e。
- 记录时间：2026-09-13 00:08 +08:00（2026-09-12 16:08 UTC）。
- 当前批准 host：join.fanruan.com；未修改 manifest、绑定、信任或旧版本。
- 已完整阅读招聘源技能与验收 SOP；技能中心返回空目录。候选原有内容只有生成模板，无历史 BLOCKED、ACCEPTANCE 或路线申请。

## 只读路线发现

Ego Lite 独立任务空间 43。配置首页 https://join.fanruan.com/ 正常加载，标题「首页 | 帆软招聘官网」，正文明确介绍帆软软件有限公司、FineReport 和 FineBI，企业身份一致。无需搜索或产品官网反向链接证明。

首页「校园招聘」实际 anchor 的 raw href 与 resolved href 均为 https://join.fanruan.com/campus。使用 openOrReuseTab 打开该原样 URL，实际页面标题「帆软校园招聘 | 职位列表」。pageInfo 与 listTabs 确认列表标签地址，未点击投递或任何表单。

一页可读校招列表的最小公开样本：

| 标题 | 地点 | 可见正文节选 |
| --- | --- | --- |
| 后端开发工程师（AI团队定向） | 南京、成都、无锡 | 参与业务 Agent 及 Agent 平台能力开发 |
| 后台开发工程师 | 南京、成都、无锡 | 使用 Java 参与帆软产品服务器端功能开发和维护 |
| 前端开发工程师 | 无锡、南京 | 使用 FineUI + React 对产品用户界面进行开发和维护 |

这些仅为列表 DOM 证据，没有确认字符串编号和独立详情 URL，不得作为已核验 Job 输出。列表可见分页 1、2、3；未翻页。正常页面资源记录发现 fetch/XMLHttpRequest URL https://join.fanruan.com/campus，未取响应体、未重放请求、未推断参数或 API schema。首页无观察到的 fetch/XMLHttpRequest。未确认通用 ATS。

## 路线审核与续接

实际列表入口与当前配置首页不同。遵循 SOP「入口变化（即使同域）」规则，提交 ROUTE_REVIEW.json 后停止开发；这是一项待路线审核事项，不是官网故障或身份不明。没有其他发现阻塞，因此不创建 BLOCKED.md。不得把本文件当作代码完成凭证；原 index.mjs 仍为生成模板。

平台批准后保持路线 JSON 原样，只补公开响应字段取证、固定解析器、字符串编号及最多三个真实详情、相应离线 fixture。不可将目前模板测试当成帆软字段映射验证。若响应取证需要正常导航，先按 SOP 使用已观察且批准的端点安装开发捕获器。生产方法尚未选定，不宣称 HTTP 或 browserListing 已支持。

## 分阶段结果

- 离线检查：node plugin-audit.mjs plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e → audit clean；node plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/test/smoke.mjs → provider fixture smoke ok；node --check plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/index.mjs → exit 0。均仅检查原始生成模板，未完成真实解析器测试。
- 真实详情抽查：0/3；仅读取一页列表，没有字符串 ID / 详情正文匹配证据。
- 启用及页面验收：未执行，候选保持禁用，交由平台在后续开发完成后独立验收。未扫描、未 AI 评估、未投递、未安装。
- 运行时零 Token 适配器尚未完成；本次为 Agent 开发取证，消耗开发 Token。


## 2026-09-13 00:14–00:15 +08:00 原候选续接

平台已批准原路线，申请 JSON 未修改。独立 Ego Lite 任务空间 44；上一空间43已不存在。本次一页默认校招列表（10条，可见1/2/3页，未翻页），三个独立真实详情。使用卡片实际点击，不拼接地址；点击前滚动到视口并检查命中，点击后检查 pageInfo/listTabs，最多一个临时详情标签。

| 列表字符串ID | 列表与详情名称 | 实际点击 URL | 地点及详情最小证据 |
| --- | --- | --- | --- |
| `9886` | 后端开发工程师（AI团队定向） | https://join.fanruan.com/campus/detail?id=9886 | 南京, 成都, 无锡；接口设计、Agent Memory/Evaluation/Observability，工作要求可读 |
| `9871` | 后台开发工程师 | https://join.fanruan.com/campus/detail?id=9871 | 南京, 成都, 无锡；Java服务器功能开发、云原生架构，工作要求可读 |
| `9872` | 前端开发工程师 | https://join.fanruan.com/campus/detail?id=9872 | 无锡, 南京；FineUI + React界面开发及移动端组件库，工作要求可读 |

三条名称、DOM data-id 与详情地址 id 查询字符串吻合，无关闭提示；仅证明抽查时正文可读，不证明所有岗位有效或可提交。未点击投递。

来源：配置首页 https://join.fanruan.com/ → 已批准 https://join.fanruan.com/campus；页面 Performance 观察 XHR 同为 https://join.fanruan.com/campus。DOM 为 div.job-item[data-id]，标题 .job-title span，类别/团队/地点合并在 .job-base，摘要 .job-duty。没有真实岗位 anchor，未观察到公共 ATS。保留字符串ID，未读取个人信息或凭证。

取证限制：publicCaptureScript 首次导入因运行时工作目录导致 file URL host 错误，改用确切 file URL 后成功安装，未产生网络重试。首页实际 href 点击不导航，观察 record=null 后停止；直接打开已观察 href 可读列表。一次纠正安装在列表搜索前，但真实搜索按钮触发整页导航 /campus?w=，内存观察器丢失；未得到响应体、请求方法/参数/schema，未调用 getResponseBody、重放或枚举端点。空词搜索仍是同一默认第一页的一次纠正，没有第二页；不将其改为生产入口。活跃 BLOCKED.md 记录缺口。

运行时实现未完成：删除无依据的通用 jobs 示例映射，改为明确抛错。离线测试只证明未完成候选 fail closed、零网络，不能宣称固定解析器 fixture 已通过。ROUTE_REVIEW、manifest、绑定、信任配置和旧版未修改。日常零 Token 读取尚不可用，本次开发消耗 Agent Token。

### 本轮分阶段结果

- 离线测试及静态检查：见下方实跑结果；仅阻塞保护测试，真实字段解析 fixture 待补。
- 真实详情抽查：3/3 标题、字符串ID、地点及正文相符；API与DOM比对未完成。
- 启用及页面验收：未执行、未安装、未启用、未绑定；保留阻塞，交平台决定，旧版不变。

实跑结果：`node plugin-audit.mjs plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e` → audit clean；`node plugins.local/company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e/test/smoke.mjs` → Blocked provider fails closed; zero network. Parser fixture pending.；对 index.mjs 和 test/smoke.mjs 执行 `node --check` 均 exit 0。
