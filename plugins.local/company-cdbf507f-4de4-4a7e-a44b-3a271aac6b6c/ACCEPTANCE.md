# Momenta 候选：开发检查完成，待平台独立验收

核验时间：2026-09-12T16:45:38.986722+00:00
候选：company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c

## 只读发现
- 原配置入口 https://campus.momenta.cn/ 在 Ego Lite 返回 ERR_CONNECTION_CLOSED；连接失败，不是职位关闭或登录要求。
- 候选初始仅有生成模板，无历史 ACCEPTANCE/BLOCKED/ROUTE_REVIEW。
- 使用一次 Momenta 官网 招聘搜索，仅作为导航线索；跟随搜索真实 href 到 https://www.momenta.ai/join.html 。
- 读取首页实际 href /ch/ 到 https://www.momenta.ai/ch/，确认 Momenta 品牌、公司页脚和 /join.html 链接。
- 沿加入我们页面实际校园招聘 href 打开 https://momenta.jobs.feishu.cn/campus/?keywords=&category=&location=&project=7537265013606943018&type=&job_hot_flag=&current=1&limit=10&functionCategory=&tag= 。共三页官方/招聘导航页面，一页列表、零详情，无翻页、无投递。
- 页面最终标题 Momenta Campus；Mstar计划；显示10条。登录按钮存在，但未阻挡公开列表。未遇 CAPTCHA。
- 正常列表请求（动态签名已去除，禁止重放）：https://momenta.jobs.feishu.cn/api/v1/search/job/posts?keyword=&limit=10&offset=0&job_category_id_list=&tag_id_list=&location_code_list=&subject_id_list=7537265013606943018&recruitment_id_list=&portal_type=6&job_function_id_list=&storefront_id_list=&portal_entrance=1
- 未捕获响应体；字段 schema、HTTP 固定解析、匿名读取均未验证。优先在路线批准后评估可复用飞书 ATS 解析。

## 最小公开列表样本（不是详情验收）
| 字符串编号 | 列表标题 | 真实 anchor 详情链接 |
|---|---|---|
| 7670832645048125738 | Data Infra Agent工程师(Mstar) | https://momenta.jobs.feishu.cn/campus/position/7670832645048125738/detail |
| 7670832238527023370 | 数据闭环研发工程师(Mstar) | https://momenta.jobs.feishu.cn/campus/position/7670832238527023370/detail |
| 7660045500175632678 | 训练推理优化工程师(Mstar) | https://momenta.jobs.feishu.cn/campus/position/7660045500175632678/detail |

## 分阶段状态
- 离线测试：仅运行现有模板检查，结果见下；不代表真实解析已实现。
- 真实详情抽查：0/3，未访问详情。上述编号仅来自真实列表 anchor。
- 启用及页面验收：未执行，候选保持停用，未修改配置、绑定或旧版。
- 生产解析器：保留原生成模板，尚未开发；无真实响应 fixture，无生产 mock 兜底新增。

## 路线审核
ROUTE_REVIEW.json 申请官网与飞书招聘精确域名。当前平台只批准 campus.momenta.cn，因此在此停止开发。没有其他已知独立阻塞，不新增 BLOCKED.md 来重复路线审核状态。批准须由平台提供，候选文件不构成授权。
本次不申请无关遥测、登录、问答或 CDN 域名；如后续采用 browserListing，实际必需资源域名须另经审核。当前入口仅覆盖官网链接中的 Mstar 项目，不声称覆盖全部校招。

## 提交前检查结果
- `node plugin-audit.mjs plugins.local/company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c`：通过（audit clean）。
- `node plugins.local/company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c/test/smoke.mjs`：原模板离线测试通过，未联网；不是 Momenta 真实解析验收。
- `node --check` 检查候选 index.mjs 与 test/smoke.mjs：均通过。
- 未改模板代码和测试；路线批准后再实现固定解析及相应异常、空列表、字符串编号 fixture。

## 续接：新增浏览器资源路线待审核

核验时间：2026-09-12T16:50:29.660Z

- 平台已批准原官网与飞书招聘入口；上文“当前仅批准 campus.momenta.cn”是历史记录。原提案逐字节保存于 ROUTE_REVIEW.approved-history.json，当前 ROUTE_REVIEW.json 新增资源域名，需要平台重新审核，不继承旧批准。
- 没有重新搜索或导航官网发现链。本轮仅加载已批准的一页列表，详情访问0/3，没有翻页。标题 Momenta Campus，Mstar计划显示10个岗位；前三条名称、字符串编号和真实anchor URL 与上表相同。登录按钮不阻止列表，未遇登录、短信或验证码门槛。
- 先 Page.enable，再 publicCapturePreload(历史已观察的公开列表请求, 精确批准入口)，随后正常导航。结果 installed=true、error=null、record=null；未捕获响应体，无法确认schema，不能推断接口401。未重放、未取CDP响应体、未分析或保存签名。finally已移除注册并stop捕获。
- 首次Ego脚本使用相对文件路径报ENOENT，在任何浏览器操作之前失败；明确绝对路径后执行唯一列表加载，不属于网站失败。
- 已阅读 adapter-browser-listing.mjs；拟复用 ctx.browserJobs(entry)。公开DOM可读，但页面运行时和主题依赖两个未批准CDN，实际资源URL已写入提案。新提案共4个精确域名、5条证据，入口不变。没有申请问答、登录、遥测、验证服务域名；没有操作这些服务。资源充分性仍待后续独立验证。
- 按新增域名规则停止开发；未构建未批准域名上的解析器，保留原模板。唯一当前待办为资源路线审核，不以BLOCKED.md重复路线状态。批准后补选择器、实现、零网络fixture和3条真实详情。
- 详情URL以 /detail 结尾，可选末段ID契约不能用于数字ID；不得将 detail 伪作编号或擅改平台契约。
- 本轮提交前检查：plugin-audit audit clean；现有模板fixture smoke通过；index.mjs与test/smoke.mjs语法通过。只是模板检查，不是Momenta解析器测试或在线验收。
- 真实详情抽查：0/3；启用及页面验收：未执行。未修改配置、绑定、锁文件或旧版，候选保持禁用。


## 本轮续接结果（当前状态，取代上文历史待办）

记录时间：2026-09-12T17:40:48.983469+00:00

平台于 2026-09-12T17:35:32.373Z 批准当前四域名路线。本轮 ROUTE_REVIEW.json 未改动，未重启入口发现。原门户配置中的 campus.momenta.cn 保持不变，由平台在独立验收成功后管理切换。

### 实现与固定字段

- 复用平台通用 browserListing / ctx.browserJobs；无公司私有 HTTP 重放、签名处理、Ego CLI 生产依赖或模型调用。此前 HTTP 取证无响应体的历史结论保留，本轮不重复捕获，不以 API schema 作为完成依据。
- listUrl 为 ROUTE_REVIEW.json 中批准的完整 entryUrl；Momenta Campus 页面身份匹配。
- 岗位 anchor：`a[data-id][href^="/campus/position/"]`；标题相对选择器 `.positionItem-title-text`；地点相对选择器 `.positionItem-subTitle > span:first-child`。均来自本轮实读 DOM，不含 Mstar 标签或招聘项目文字。
- 真实 href 原样保留；company 为平台传入的 Momenta。公开 data-id 与 URL 数字段逐项核对，10条编号无重复，始终为字符串。provider 检查重复编号及异常源字段，不把 `/detail` 当作 id。不输出可选 id 字段，因平台目前只接受 URL 最后一段编号。完整 URL 保留真实长编号。
- 不补造 description 或 postedAt；详情描述仅用于开发核对。单页一次调用，不点击、不翻页，reader 上限100条，本入口 limit=10，仅覆盖 Mstar 项目。空数据或异常报错，绝无生产 fixture/mock 回退。
- manifest 仅保留执行必需的三个已批准域名（飞书招聘与两个 CDN）；官网域名仅用于历史入口证据，不需生产请求。

### 真实列表和详情抽查

Ego Lite 独立任务空间48，本轮只加载一页列表和以下三个详情，未搜索、未翻页、未投递。列表实读时间 2026-09-12T17:39:11.974Z；页面显示10条，三个样本见上文最小公开列表表。实际列表文档请求为批准 entryUrl。此前已观察的公开列表 XHR 见历史记录，本轮 performance 查询未取得可用结果，不声称本轮捕获了 API 响应。

使用已有 ACCEPTANCE 的完整官方详情 URL，先与新列表 anchor raw href、resolved href、data-id 比对，再直接打开相同 URL；没有拼造路由，没有要求重复 popup 点击。详情返回地址均与对应源 anchor 完全一致。

| UTC 核验时间 | 字符串编号 | 当前详情标题 | 地点 | 描述最小证据与结论 |
|---|---|---|---|---|
| 2026-09-12T17:39:15.267Z | 7670832645048125738 | Data Infra Agent工程师(Mstar) | 北京 | 参与Momenta自动驾驶数据Infra建设；Agent应用。列表 DOM 描述全文被详情可见正文包含，标题与地址编号一致，职责和要求可读。 |
| 2026-09-12T17:39:18.572Z | 7670832238527023370 | 数据闭环研发工程师(Mstar) | 北京 | 建设自动驾驶数据飞轮；数据回收、挖掘、自动标注。列表 DOM 描述全文被详情可见正文包含，标题与地址编号一致，职责和要求可读。 |
| 2026-09-12T17:39:21.575Z | 7660045500175632678 | 训练推理优化工程师(Mstar) | 北京、上海、苏州 | 自动驾驶大模型、世界模型分布式训练推理框架研发。列表 DOM 描述全文被详情可见正文包含，标题与地址编号一致，职责和要求可读。 |

三个详情完整 URL 见上文同编号表格，均为本轮实际访问地址。未出现职位关闭、404、登录门槛或验证码；页面“登录”“投递”按钮未操作。没有读取或保存凭证、个人资料或完整响应。其余七个岗位未逐条详情核实。

### 离线检查

- `node plugins.local/company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c/test/smoke.mjs`：通过，零网络。测试只读引用平台真实固定 DOM parser，使用内存最小 fixture；验证标题/地点映射、原始URL长编号、单页一次委派、空列表、异常结构、身份不符、登录门槛、超量、重复编号、同名异号、域名边界与读取失败传播。
- `node plugin-audit.mjs plugins.local/company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c`：audit clean。
- `node --check` index.mjs 与 test/smoke.mjs：均通过。
- 测试使用 node:assert 的 strict 导出；生产未导入测试或平台私有路径。

### 启用及页面验收（尚未执行）

候选继续禁用，未安装、未改绑定、未更新信任，未修改旧版或其他企业。未运行 scan、verify-portals、批量扫描、AI评估或投递流程。

开发阶段三个真实详情抽查完成；这不代替平台独立匿名 Chromium 验收。平台仍需核对批准域名约束下的资源加载、真实列表与三个详情，再决定安装和替换绑定；失败应保留旧版。Ego Lite 可读不等于匿名浏览器已通过。

当前没有未解决的开发阻塞或 BLOCKED.md；上文“模板尚未开发”“待资源路线审核”为已解决的历史状态。运行读取零模型 Token，本次 Agent 开发使用开发 Token。

补充：2026-09-12T17:41:09.002Z 在同一个已加载列表文档（无新增导航或请求重放）执行平台 `extractBrowserListing` 的原始函数和候选 manifest 选择器，再以真实结果运行 normalizeBrowserJobs 与 provider 校验：10条通过，全部 URL 数字段与 anchor data-id 字符串一致。此项为 Ego 页面上的开发解析验证，不是平台匿名浏览器验收。
