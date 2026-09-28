# 宁德时代候选：开发验证完成，待平台独立验收（未安装）

候选：`company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18`。
核验时间：2026-09-13T15:31:33.228Z（北京时间 23:31）。

## 现有证据与方法

- 已完整阅读招聘源适配技能、验收 SOP、Ego Browser 和 Ponytail full；技能中心返回空目录。候选仅有生成模板，无历史 ACCEPTANCE、BLOCKED 或路线申请。
- 只读取 portals.yml 的宁德时代入口：https://talent.catl.com/ 。未读个人资料，未运行可能自动复制用户文件的 doctor 或系统更新，遵守本次仅候选可写的范围。
- 方法：Ego Lite 独立任务空间 58 正常打开配置入口，pageInfo 落点 https://talent.catl.com/social-recruitment/catlhr/96144/#/ 。标题“宁德时代校招 | 宁德时代社招 | 宁德时代招聘官网”，页脚“© 2021-2022 宁德时代新能源科技股份有限公司”，身份一致。
- 方法：读取实际 DOM anchor，文字“2027届全球校园招聘”，原始 href 和解析后 href 均为 https://app.mokahr.com/campus-recruitment/catlhr/148948#/ 。未猜路径、未点击申请按钮。
- 结果：配置招聘首页直接提供 Moka 校招入口证据链。当前生产只批准 talent.catl.com；新入口及 app.mokahr.com 必须由平台路线审核。已写 ROUTE_REVIEW.json，未改 manifest、信任或绑定。
- 未开展官网搜索，未要求产品主页反向链接；没有身份或入口发现阻塞。唯一等待事项是路线审核，不额外创建无关 BLOCKED.md。

## 能力判断与后续

优先复用公开 Moka ATS 固定解析，但尚未观察目标列表响应，不能确定 schema、API、分页、详情路由或额外资源域名。路线批准后续接此候选，先检查正常列表与公开 XHR，再按证据选择 JSON/HTML、SPA/preload、inlineDetails 或 browserListing。所有这些方法均不能替代新域名授权，所以本轮不进入目标页面、不取证接口、不实现未经证实的解析器。当前保留的 index.mjs 和 smoke.mjs 只是平台预创建模板，不能用于真实岗位结果或安装。

## 分阶段验收

- 真实列表请求与最小岗位样本：未取得；本轮只核实招聘首页与实际导航链接。列表验证 0 页，详情核对 0 条；没有职位关闭、登录或验证码结论。
- 离线测试、语法与审计：下附命令结果，仅检查已有模板，不构成真实解析或接入证明。
- 启用及页面验收：未执行；候选保持禁用，未改绑定、配置、旧版。平台在后续开发完成后独立验收一页列表和三个详情，通过才安装。
- 未运行 scan.mjs、verify-portals.mjs、批扫、AI 评估或投递；未保存凭证、个人资料或完整响应。目标日常运行零模型 Token，本次 Agent 开发有 Token 消耗。

实际检查结果（均 exit 0）：
- `node plugin-audit.mjs plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18` → audit clean。
- `node plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18/test/smoke.mjs` → provider fixture smoke ok；仅原模板内存 fixture，无网络，不代表已实现官网字段映射。
- `node --check` 分别检查候选 `index.mjs`、`test/smoke.mjs` → 通过。

本轮只新增 ROUTE_REVIEW.json 和本证据文件。待在企业 → 适配器设置批准路线，再继续原候选；批准 JSON 在续接时必须保持原样。未取得完整链上的 API 证据不伪造 api 条目，后续若出现额外必要域名需重新审核。


## 2026-09-13T15:49:59Z 原候选续接

平台已于 2026-09-13T15:45:45.975Z 批准原校招首页及 talent.catl.com、app.mokahr.com。未重做入口搜索；读取现有模板和历史证据后从批准首页继续。原已批准申请逐字节保存在 `ROUTE_REVIEW.approved-history.json`；新的 `ROUTE_REVIEW.json` 改动入口及资源域名，必须重新经平台审核，历史批准不授权这些变更。

### 方法、证据与结果

1. Ego Lite 独立空间63（原空间58已不存在），打开批准校招首页；标题“宁德时代 - 校园招聘”，页脚公司全名一致，没有登录/验证码门禁。登录按钮存在不等于要求登录。
2. 读取“职位列表”真实raw href `#/jobs` 与resolved href `https://app.mokahr.com/campus-recruitment/catlhr/148948#/jobs`。滚动并核验命中后，首次click错误使用快照规范化路径而非raw属性导致Element not found；没有重复该选择器，随后用刚读取的完整href通过openOrReuseTab正常导航。pageInfo/listTabs确认真实列表标签。初始“数据读取中”等待后成为614结果，本页30条，没有翻页。
3. Resource Timing观察到公开端点 `https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2`。开发辅助模块首次import因Ego工作目录解析失败，修正为明确file URL；没有生产请求重放。document-start preload首次同URL导航未创建新文档，故无捕获；改为Page.enable + 预加载注册 + Page.reload后正常捕获首屏请求。每次均finally移除注册并stop。无需追踪参数例外，没有CDP requestId复用。
4. 实际POST公开参数：`{"orgId":"catlhr","siteId":"148948","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"customFields":{},"site":"campus","locale":"zh-CN"}`。HTTP200，JSON只有`data`（不透明字符串）与`necromancer`字段。没有解码、逆向签名、重放请求或直连探测；响应不写文件。诊断输出误包含过长封装字符串，后续只保留字段级证据，并删除页面临时副本，不重复输出。
5. 能力切换：HTTP固定JSON解析缺少可读岗位字段；普通HTML/内嵌数据没有已观察可用来源，不猜静态资源或遍历bundle。已有真实独立anchor，无须inlineDetails或构造点击路由。已读 `adapter-browser-listing.mjs`；公开DOM固定reader是有依据的下一步。该契约不点击，listUrl必须等于批准入口，故需从校招首页改为实际`#/jobs`入口。
6. 该页实际加载 `static-ats.mokahr.com` 的招聘主脚本、runtime/vendor/CSS/i18n及 `static-extension.mokahr.com` 的CATL定制脚本。两者尚未批准，已作为实际公开资源请求连接进新申请。未把分析统计及第三方验证脚本域名自动加入权限；无验证码UI。新权限由平台决定，不能以本记录授权。

### 最小公开列表样本（不是详情验收）

| 列表名称 | 字符串ID | 真实anchor详情地址 | 列表地点 |
|---|---|---|---|
| 人才与组织发展研究员 | 9dc94ac4-e805-433c-934e-dc0c0cd51590 | https://app.mokahr.com/campus-recruitment/catlhr/148948#/job/9dc94ac4-e805-433c-934e-dc0c0cd51590 | 福建·宁德市 |
| 人力资源主管 | bc07500d-4c90-44fe-9c22-d4b047478c65 | https://app.mokahr.com/campus-recruitment/catlhr/148948#/job/bc07500d-4c90-44fe-9c22-d4b047478c65 | 江苏·常州市 |
| 人力资源主管（招聘方向） | 83dd4f41-1db3-4b30-8f6d-48d6bc0349fd | https://app.mokahr.com/campus-recruitment/catlhr/148948#/job/83dd4f41-1db3-4b30-8f6d-48d6bc0349fd | 福建·宁德市 |

DOM岗位anchor样本class为 `link-txmgVOCVz9`，相对直接子元素class为 `card-content-eGHrYZMEX6`；名称/地点相对选择器尚未确定。列表前3条简述分别涉及人才组织科学研究、HR模块项目与数据分析、招聘计划与渠道管理。所有编号仅作为原始字符串；没有访问详情页，不能声称详情当前有效。

### 续接缺口与阶段边界

唯一当前阻塞：新DOM列表入口及所需资源域名等待平台路线审核。审核之前停止实现；保留原模板，不能用于真实安装。批准后只补固定DOM provider、相对title/location选择器与零网络fixture，使用上面已观察URL核对同3个详情。无需重新搜索或重试HTTP封装。若匿名加载出现明确登录/验证码，再交用户处理。

- 离线：本轮运行现有模板测试、语法和审计，结果附后；它们不证明新DOM实现完成。
- 真实详情：列表仅1页（同页为取证重新导航），详情0/3；尚未验证标题/ID/正文的独立详情一致性。614是网站结果总数，不是采集或有效岗位总数。
- 启用及页面验收：均未执行；保持候选禁用、旧版和配置/绑定/信任不动，由平台在后续完成后独立决定安装。未运行扫描、AI评估、申请、子Agent；仅候选文件改动。

本轮最终检查：`node plugin-audit.mjs plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18` → audit clean；`node .../test/smoke.mjs` → provider fixture smoke ok；`node --check`检查index.mjs与test/smoke.mjs → exit 0。测试按要求改为node:assert的strict具名导入，其余生产模板保持原样。仅模板离线通过，固定DOM实现及真实验收未完成。


## 2026-09-13T15:55:42.964Z 原候选续接完成

本节为当前状态；前文保留历史原始失败及路线申请。平台在本轮提示提供2026-09-13T15:51:49.243Z批准的 #/jobs 入口与四个精确域名，批准digest为 `2f202e385059c58118be81e63e4aa92b7e524b58fc96d103671df2d4952ee9fe`。ROUTE_REVIEW.json及历史JSON未改。没有重新发现入口或申请其他域名。原空间63已不存在，本次Ego Lite独立空间66，复用一个详情标签。

### 方法、证据、结果

- 技能目录本次返回空；按用户明确指定读取招聘源技能、完整SOP及Ego技能，采用Ponytail full。未运行可能写入候选外的doctor或更新流程。
- 原阻塞是路线未批准及实现、详情缺失。路线已由平台批准；基于历史HTTP200不透明data/necromancer证据，直接采用已支持browserListing，不重试API、预加载、签名或数据解码。独立anchor已存在，无需inlineDetails、非anchor点击映射或其他推测能力。
- 2026-09-13T15:53–15:55Z，从批准入口正常打开同一首屏；页面标题“宁德时代 - 校园招聘”，企业身份一致。30个真实岗位anchor全部存在名称与地点；原始href为 #/job/<字符串ID>，绝对href与上表一致。只读一页，没有分页、筛选或采集其他入口。源列表公开POST端点和参数见前一轮记录，本轮没有重放接口。
- manifest固定选择器：岗位 `a.link-txmgVOCVz9[href^="#/job/"]`，相对名称 `.title-u2qk9xX9Ie`，相对地点 `.info-tPG_0QGbhl .sd-foundation-body-secondary-v3EXx:last-child > .no-adaptive-tooltip`。最后一个信息栏是地点，前面的3/2/6为人数，未误当地点。选择器来自本轮真实DOM，全部30条验证有效。
- 使用未修改的平台extractBrowserListing函数在Ego当前列表执行，再经normalizeBrowserJobs、候选provider和assertBrowserJobsMatch比对：30条、30个唯一字符串ID、源字段完全相符。这是开发会话验证，不冒充平台匿名Chromium验收。
- 生产复用公共Moka DOM结构及平台reader，无独立浏览器启动、Ego CLI、模型、fixture导入、网络回放或缓存兜底。只补字符串ID，保留名称/地点/公司/URL，不补日期或描述。分页只取当前首屏，平台100条上限；并未读取614条。空、字段异常、错误路由、重复ID、超限、reader失败均报错。普通同名不同ID合法。

### 三个真实详情抽查

2026-09-13T15:54–15:54:52Z，使用上表完整官方URL（历史观察且本轮首屏重新确认）直接正常导航，复用详情标签，不猜路由、不重复弹窗点击、不触碰申请按钮。各次pageInfo实际URL与对应首屏anchor完全一致；编号依据官网hash路由原样核对，未把人数当编号。

| 字符串ID | 当前详情名称/地点 | 正文最小证据与结论 |
|---|---|---|
| 9dc94ac4-e805-433c-934e-dc0c0cd51590 | 人才与组织发展研究员／福建·宁德市 | 职责含组织与人才专项课题、人才数据实证与模型搭建；要求博士及Python/R/SPSS。与列表正文相符，详情可读。 |
| bc07500d-4c90-44fe-9c22-d4b047478c65 | 人力资源主管／江苏·常州市 | 职责含HR模块项目、HR数据分析与报告；本科及以上。与列表相符，详情可读。 |
| 83dd4f41-1db3-4b30-8f6d-48d6bc0349fd | 人力资源主管（招聘方向）／福建·宁德市 | 职责含招聘计划、渠道维护、流程体系；本科及以上、理工科优先。与列表相符，详情可读。 |

三条均无明确关闭/404、登录门禁、验证码或超时。页面普通“登录”按钮未构成阅读门禁。未点击申请，未证明其他27条当前有效，未证明全新匿名会话读取成功。公开页其他导航链接未访问；未新增必要资源域名。

### 离线与静态检查

以下全部exit 0（2026-09-13T15:55Z）：
- `node plugin-audit.mjs plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18`：audit clean。
- `node plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18/test/smoke.mjs`：无网络内存fixture验证字段不改写、单次reader调用、长字符串编号、同名不同编号、空/异常/重复/超限和reader异常传播。
- `node --check plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18/index.mjs` 与对应 `test/smoke.mjs`：语法通过。

测试不证明真实岗位；真实证据单列于上。固定DOM选择器随站点版本变化可能失效，应报未确认，不用空结果或模拟岗位掩盖。

### 启用及页面验收

尚未执行。候选保持DISABLED，未修改旧版、配置、绑定、信任、锁文件；平台在本轮结束后独立启动匿名Chromium校验一页列表和三个详情，成功才自动安装替换绑定，失败保留旧版。开发工作已完成，原BLOCKED.md所列路线/代码/三详情缺口均已解决，原文归档为BLOCKED.resolved-history.md；不存在活动阻塞文件。

未运行scan.mjs、verify-portals.mjs、批扫、AI评估或投递；未启动子Agent或访问平台配置接口。仅本候选文件改动，无凭证、个人数据、完整生产响应写入。日常读取零模型Token，浏览器有启动成本；本次Agent开发消耗Token。
