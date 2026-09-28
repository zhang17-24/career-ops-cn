# 蔚来候选：开发核验完成，待平台独立验收

候选：`company-180b53de-8915-427b-b815-5061ee3e8adc`
核验时间：2026-09-13T03:52:03.024Z（北京时间 2026-09-13 11:52）。

## 已有记录与范围

候选初始仅含生成模板，无 ACCEPTANCE.md、BLOCKED.md 或 ROUTE_REVIEW.json。只读取 portals.yml 的蔚来条目；配置入口为 https://campus.nio.com/，当前仅批准 campus.nio.com。本轮没有修改生产代码、manifest、绑定、信任或旧版。

## 方法、证据与结果

使用 Ego Lite 独立任务空间 52，正常打开配置入口。实际页面 URL 为 https://campus.nio.com/#/，标题“校园招聘-NIO蔚来”，可见“蔚来校园招聘”“2027届秋季校园招聘”及蔚来品牌介绍，身份与目标一致。公开正文无需登录即可读取；页面附带的 HR 助手登录入口不构成岗位读取登录门槛的证据。

读取首页“立即投递”anchor原始 href 和解析后 absolute href，二者完全相同：

`https://nio.jobs.feishu.cn/campus/?keywords=&category=&location=&project=&type=&job_hot_flag=&current=1&limit=10&functionCategory=&tag=&storefront_id_list=`

这是官网直接给出的飞书招聘入口，非猜测租户或路径。该域名不在当前批准范围，已按 SOP 写 ROUTE_REVIEW.json，立即停止进一步开发。无需额外搜索或证明产品官网反向链接。未打开新 ATS 页面，未触发申请流程。

## 能力选择及剩余缺口

已观察官网 DOM 和真实 ATS 链接；尚未观察 ATS 列表 XHR/API，因此没有列表请求、岗位 ID、岗位描述或真实样本可报告。审批后优先检查可复用飞书 ATS 的公开 JSON/HTML 固定解析；如 HTTP 不透明，再根据实际 DOM 判断 browserListing 等受支持路线。预加载捕获只适用于观察到且获批准的初始请求，目前没有端点证据，不猜测或枚举。任何替代解析方法都不能消除当前新域名审核边界，不继续在未批准域名上开发。

## 分阶段验证

- 离线测试：`node plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/test/smoke.mjs` 退出 0。仅原始生成模板的内存 fixture 冒烟通过，不是蔚来真实字段解析测试，不是适配完成证据。
- 静态审计：`node plugin-audit.mjs plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc` 退出 0，audit clean。
- 语法检查：`node --check plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/index.mjs` 退出 0。
- 真实列表：0 页；仅读取校招首页。未分页、未扫描。
- 真实详情抽查：0/3；没有有效性、过期或可投递结论。
- 启用及页面验收：未执行，候选保持禁用；须由平台在开发完成后独立验收。

## 续接

唯一待处理事项为 ROUTE_REVIEW.json 的新招聘入口及精确域名审核，无另外的开发故障，不添加无关 BLOCKED.md。请在本企业“适配器设置”审核路线，批准后继续原候选。批准并不等于代码验收；保留申请 JSON 原样，只补缺失的实现、真实证据和零网络字段测试，随后交平台独立验收。若后续观察到必需的新 API/资源域名，仍须更新路线重新审核。

本轮未写入凭证或个人数据，未运行 scan.mjs、verify-portals.mjs、AI 评估、投递或平台配置接口。正式适配器目标为确定性零 Token；本轮 Agent 取证消耗开发 Token。


## 原候选续接：新增资源域名待审核

核验时间：2026-09-13T03:57:22.905390+00:00。本次平台已批准原入口、campus.nio.com 和 nio.jobs.feishu.cn；上轮路线阻塞已解除，未重做官网发现。原已批准申请字节原样保存在 ROUTE_REVIEW.previously-approved.json；新的 ROUTE_REVIEW.json 加入本轮实际观察的前端资源链，必须重新审核，不能继承旧批准来访问新增生产域名。

### 方法、证据、结果

- Ego Lite 原任务空间52已不存在，新建独立空间54。打开已批准的完整 entryUrl，页面标题“蔚来校招”。初始加载壳暂显示0，等待后出现真实职位、分页1–89；仅读取第1页10条，没有分页。页面“登录”是入口，未出现阻止读取的登录或验证码弹窗；加载了验证码相关资源本身不等于出现验证码。
- 同页公开资源记录观察到 GET `/api/v1/search/job/posts`，查询字段 keyword为空、limit=10、offset=0、job_category_id_list/tag_id_list/location_code_list/subject_id_list/recruitment_id_list/job_function_id_list/storefront_id_list为空、portal_type=6、portal_entrance=1，另有 `_signature` 字段。未保存签名值、未重放该请求、未分析签名，也未把签名当跟踪键忽略。未取得响应 schema，不声称 HTTP 解析完成。
- 用 Ego Lite serverFetch 读取同一完整已批准 entryUrl 的匿名 HTML：返回字符串长度201869，既无首条岗位标题也无首条长编号。页面内 `js-websiteInfo` 顶层字段是 tenant_info、website_info、enable_campus_jobs、gray_features、enable_ambassador，属于站点配置，没有观察到岗位列表内嵌数据。固定 HTML/此内嵌数据不够生成岗位。
- 实际 DOM 是可见 `a[data-id]`，真实 href 带 `/campus/position/<字符串编号>/detail`；标题 `.positionItem-title-text`，地点 `.positionItem-subTitle > span:first-child`，描述 `.positionItem-jobDesc`。可复用飞书 ATS 的 browserListing 路线适用，已读 adapter-browser-listing.mjs；生产只能 ctx.browserJobs(entry)，不启动 Ego CLI。可选 id 不能直接使用 reader 的末段规则（此站末段是 detail），不得伪造或强行加 id；真实长编号在本取证记录保留为字符串。
- 正常列表实际加载 lf-package-cn.feishucdn.com 的 runtime、pc、theme等脚本，并引用 lf3-cdn-tos.bytescm.com 的 tinycolor 脚本。地址已写入连通路线证据。固定 DOM 生产路线需要获批资源域名，故立即停在新路线审核，不先构建未获批生产能力。
- 替代方案评估：当前 HTML不含岗位；页面配置不含已观察岗位；HTTP列表有签名字段但没有公开响应 schema，不能猜测免签接口或设计签名；预加载精确捕获可以待审核后按已观察端点评估，但不能提前假设签名可忽略，亦无需为可用 DOM 路线反复重放请求。inlineDetails 不适用，因为本页有真实独立详情 anchor。未认定 API 401、登录必需或岗位关闭。

### 最小公开列表样本（不是详情验收）

| 标题 | DOM字符串编号 | 可见职位编号 | 实际 anchor href |
|---|---|---|---|
| 校招-NVH主动降噪工程师 | 7683735115122510134 | A53149 | https://nio.jobs.feishu.cn/campus/position/7683735115122510134/detail |
| 校招-车端AI Agent运行时基座软件开发工程师 | 7678155050254616883 | A48074 | https://nio.jobs.feishu.cn/campus/position/7678155050254616883/detail |
| 校招-车载ECU AI 基座应用软件开发工程师 | 7678154993330211115 | A57642 | https://nio.jobs.feishu.cn/campus/position/7678154993330211115/detail |

三个样本地点均为“上海、合肥”。列表描述最小片段分别为“负责主动降噪产品RNC等算法方案、系统架构设计”“负责 AI Agent 智能体在车端场景的运行时基座软件开发”“负责车载 ECU 嵌入式软件的设计、开发与维护”。未保存完整生产响应、凭证或个人数据。未打开详情，不能据此确认详情内容匹配或有效。

### 本轮分阶段状态

- 离线测试、语法及静态审计：交接前重新运行，见后续结果；现有代码仍是生成模板，其成功不代表真实固定解析已完成。
- 真实列表：第1页可读，10个实际岗位；未翻页。
- 真实详情抽查：0/3，待新增资源路线审核后核验以上三个实际 href。
- 启用及页面验收：未执行；候选保持禁用。平台独立验收尚未开始，未安装、未绑定、未改旧版或配置。
- 唯一当前阻塞：新增 CDN 资源域名需平台重新审核。后续在原候选补 browserListing 声明、最小 provider、零网络 fixture 及三个详情证据。新域名可能仍需按实际必要性进一步核实，不能保证本申请覆盖全部资源。未将遥测/验证码域名笼统加入权限。

交接检查实际结果：`node plugin-audit.mjs plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc` 退出0、audit clean；`node plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/test/smoke.mjs` 退出0；`node --check plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/index.mjs` 退出0。以上仍仅检查原模板，未声称专用 fixture 或生产实现完成。本轮取证已结束，无捕获器或 CDP 预加载注册待清理。


## 2026-09-13 原候选续接：开发完成，保持禁用

平台批准时间 2026-09-13T04:13:54.143Z，批准 digest 为 f58ab70c8aa8e5b806b1d59c67301b2016a89fc9d90191f0cc1349f5f578cc15。本轮 ROUTE_REVIEW.json 保持字节原样，manifest 仅使用已批准的四个精确域名。上文是历史记录，不是本轮仍待审核。未更改旧版、企业入口配置、绑定或信任。技能中心轻量目录返回空，按用户明确指定读取本地 recruitment-source-adapter 与完整 SOP，并使用 Ego Lite、Ponytail full。

### 方法、证据、结果

原任务空间54已不存在（仅剩用户自己的常驻空间），本次创建独立 Ego 空间55，未操作用户页面。直接续接已批准 ATS 入口，无入口搜索、无扩大企业范围。2026-09-13T04:15–04:17Z 读取同一完整列表 URL（ROUTE_REVIEW.json.entryUrl），标题“蔚来校招”，等待 a[data-id] 出现后计数10，未翻页。固定字段再次与历史证据一致：linkSelector=a[data-id]、titleSelector=.positionItem-title-text、locationSelector=.positionItem-subTitle > span:first-child。第一条原始 href 为 /campus/position/7683735115122510134/detail，解析后的完整 URL 与历史详情 URL 一致；其余两条同样逐字确认。页面身份一致，没有读取门槛、登录弹窗或验证码。

采用 SOP 支持的 browserListing 替代路线：既有证据已确认 HTML 无岗位、配置内嵌数据无岗位、列表 XHR 带签名且未获得可用固定 HTTP schema；此次无需重复 HTTP 捕获或分析签名。固定 DOM reader 直接读取官方应用当前渲染的真实 anchor，由平台执行匿名浏览器与域名保护。生产 provider 只有 ctx.browserJobs(entry)，无自定义浏览器执行、无模型、无缓存样本或模拟兜底。列表请求来源为批准的完整 entryUrl，已观察 API 的方法/路径/公开查询字段见上一轮记录；本轮不重放 API，不保存签名、不声称获得新 API 响应 schema。无 preload 或捕获器注册待清理。

### 真实详情抽查（开发阶段）

使用刚从真实列表再次读取且与既有 ACCEPTANCE 一致的完整 href。直接打开首条并在同一详情标签导航后两条；未猜路由、未点击投递、未累计临时详情标签。pageInfo 确认最终 URL，读取当前正文而非沿用历史结论。

| 核验时间 UTC | 名称 | 列表 data-id 字符串 / 详情 URL 同段 | 详情可见职位编号 | 当前正文证据及结果 |
|---|---|---|---|---|
| 2026-09-13T04:16:47.188Z | 校招-NVH主动降噪工程师 | 7683735115122510134 | A53149 | 标题一致，上海、合肥；职责包含主动降噪RNC算法方案、系统架构、工程化落地、标定测试及稳定性验证，要求含声学/NVH与FXLMS；职责与列表可见正文一致。 |
| 2026-09-13T04:16:50.295Z | 校招-车端AI Agent运行时基座软件开发工程师 | 7678155050254616883 | A48074 | 标题一致，上海、合肥；职责含运行时基座开发、模型调度、工具调用框架、上下文管理、多Agent协同及性能稳定性；与列表片段一致，完整职责及任职要求可读。 |
| 2026-09-13T04:16:53.607Z | 校招-车载ECU AI 基座应用软件开发工程师 | 7678154993330211115 | A57642 | 标题一致，上海、合肥；职责含ECU嵌入式软件、通信协议栈、诊断、AI推理部署、实时性及内存资源治理；与列表片段一致，完整职责及任职要求可读。 |

实际详情地址分别为：
- https://nio.jobs.feishu.cn/campus/position/7683735115122510134/detail
- https://nio.jobs.feishu.cn/campus/position/7678155050254616883/detail
- https://nio.jobs.feishu.cn/campus/position/7678154993330211115/detail

三个字符串编号不同且与各自真实 anchor、最终页面 URL 对应；详情还展示各自上述 A 开头的职位编号。三页未显示关闭、404、登录或验证码，不将有“投递”按钮等同于提交测试。不声称其他七条或全站均有效。

### 实现及离线测试

复用平台 adapter-browser-listing.mjs 的固定解析器，未复制或修改平台守卫。manifest 声明真实选择器及精确批准入口；标准输出 title/location/url/company。长编号保留在完整 URL 中，不转 Number。本站 URL 末段是 detail，平台可选 id 契约不能表达中间段编号，故不附加 id；同名不同URL不丢失，不伪造末段编号。description/postedAt 不在当前 reader 输出契约中，故不捏造。只读取当前第1页（入口limit=10）；平台100条硬上限不代表抓取100条或翻页覆盖。

零网络 test/smoke.mjs 使用最小内存 DOM fixture 调用实际平台 extractBrowserListing/normalizeBrowserJobs（测试专用相对导入，不启动浏览器），并验证生产委托：标题/地点/URL/企业、长编号不失真、不添加伪ID、固定首分页参数、空列表报未确认、结构变化、登录门槛、超100条、空地点、冲突URL报错，以及 reader 异常传播无兜底。fixture 未被生产模块导入。此测试依赖 career-ops-cn 平台契约，适用于本托管候选。

实际运行：
- node plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/test/smoke.mjs：退出0，offline platform DOM parser + provider contract: passed; no network。
- node plugin-audit.mjs plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc：退出0，audit clean。
- node --check plugins.local/company-180b53de-8915-427b-b815-5061ee3e8adc/index.mjs：退出0。

### 阶段边界与剩余事项

离线测试通过；Ego 开发抽查为一页10条列表与三个真实详情，均已读取；启用及页面验收未执行。Ego 公开可读不替代平台全新匿名浏览器在精确域名限制下的独立验收。平台需独立核对列表与三个详情、资源依赖和配置完整性，失败保留旧版；本轮未自行运行该验收、扫描器、AI评估或投递，未调用配置接口。未发现需新增权限的具体必要资源；不保证平台匿名环境与 Ego 完全一致。

原 BLOCKED.md 记录的域名审核已由平台批准且缺失实现、测试与三条详情核验已完成，归档为 BLOCKED.resolved-route-history.md；无尚未解决的开发阻塞。候选保持禁用、不声称已安装。日常读取零模型 Token，浏览器有启动开销；本次 Agent 开发消耗开发 Token。
