# 小鹏汽车候选：等待路线审核，未安装

候选：`company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f`
取证时间：2026-09-13T03:53:32Z（北京时间 11:53:32）。

## 现状与来源

- 仅读取 portals.yml 的小鹏汽车条目：配置入口 `https://hr.xpeng.com/campus`，当前批准域名仅 `hr.xpeng.com`。
- 候选原有 index、manifest、测试均为生成模板，无历史 ACCEPTANCE/BLOCKED/路线申请；本次没有开发或修改生产代码、权限、绑定和信任配置。
- Ego Lite 独立任务空间 53；原入口返回浏览器 `ERR_CONNECTION_CLOSED`。这是连接失败，既不是职位关闭/404，也不是登录要求。
- 入口恢复使用一次“小鹏汽车 官网 招聘”Google 搜索，仅作导航线索。通过搜索结果实际 href 跳转到 `https://www.xiaopeng.com/`，未猜域名。
- 三个只读官网/导航页面：产品官网、`https://xiaopeng.jobs.feishu.cn/index`、`https://xiaopeng.jobs.feishu.cn/campus/`。官网标题“小鹏汽车丨未来出行探索者”，页脚“广州小鹏汽车科技有限公司”；飞书页面分别显示“小鹏集团招聘官网”和“小鹏集团校招官网”，身份一致。
- 官网“加入我们”原始/绝对 href：`https://xiaopeng.jobs.feishu.cn/index`；招聘首页“校招官网”原始/绝对 href：`https://xiaopeng.jobs.feishu.cn/campus/`；校招“职位”原始 href：`/campus/position/list`，绝对 href：`https://xiaopeng.jobs.feishu.cn/campus/position/list`。未点击投递按钮。
- 招聘首页自然加载观察到 `https://xiaopeng.jobs.feishu.cn/api/v1/search/job_post/count`；校招首页观察到 `https://xiaopeng.jobs.feishu.cn/api/v1/common/setting`。仅记录公开请求 URL，没有响应正文、请求重放、凭证或个人数据。计数接口不当作列表接口。
- 校招首页公开介绍包含探索者计划、暑期实习、物理 AI 实习、日常实习。没有保存岗位样本或虚构 ID/详情。

## 方法、证据及下一步

1. 配置入口常规导航：连接关闭，无可读 DOM/公开端点，无法直接固定解析。
2. 按 SOP 切换到有界入口发现：一次搜索、三个官方导航页，读取实际 anchor 原始及绝对 href，官方关系成立。
3. 校招页面 DOM 读取第一次因本地 JS 正则转义错误失败；改用字符串 includes 后在同一页面读出链接，无额外导航。
4. 新入口使用飞书共享 ATS，批准后优先评估可复用飞书公开解析；目前没有列表响应 schema，不猜 API 或详情路由。
5. HTTP JSON/HTML、SPA 捕获、预加载、inlineDetails、browserListing 均需先批准新入口域名。原入口没有 DOM，替代 reader 不能解决域名授权缺口；无需在未批准域名继续捕获、解析或核验详情。若后续 browserListing 需要额外资源域名，必须凭实测另行审核。

## 三阶段结果

- 离线：`node plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f/test/smoke.mjs` 通过；这是原始模板模拟样本，不是新适配器或现场 schema 测试。
- 静态：`node plugin-audit.mjs plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f` 返回 audit clean；index.mjs 和 test/smoke.mjs 的 `node --check` 均通过。模板存在不证明开发完成。
- 真实列表/详情：均未核验。恢复阶段只读首页及导航，没有打开列表或详情；尚无名称、字符串 ID、正文比对结果。分页未实现、未翻页，不声称全量覆盖。
- 启用及页面验收：未执行，候选保持禁用。未扫描、评估、投递、安装或更改旧版。由平台在路线批准、补全开发后独立验收。

## 待办

唯一当前阻塞是新入口及域名审批，见 ROUTE_REVIEW.json 与 BLOCKED.md。在企业适配器设置审核路线后续接本候选，只补列表取证、固定解析、零网络测试及三条真实详情。路线批准须由平台提供，本候选不自行授权。


---
# 原候选续接：等待补充资源域名审核

核验时间：2026-09-13T04:17:15.088Z；当前结论以本节为准，前文保留为历史。

## 已解决及范围

平台于 2026-09-13T04:14:10.823Z 批准原提案（摘要 b616368fe0eb5d097d632c9e43cb375e7e5bbf29984e7ee347235008e27eb6e1）。原申请逐字节保存在 ROUTE_REVIEW.approved-history.json；本次 ROUTE_REVIEW.json 是增加资源域名后的新提案，必须重新审核。未再访问失效旧入口、未搜索、未扩大企业范围。

使用 Ego Lite 独立空间 56，直接打开批准的校招列表 https://xiaopeng.jobs.feishu.cn/campus/position/list 。标题“加入小鹏集团”，正文“小鹏集团校招官网”。初始骨架显示 0，等待加载后显示总数 516、第一页 10 条、共 52 页；未翻页。没有将初始 0 误判为空结果。可见登录只是导航链接，未出现密码/一次性验证码/登录弹窗门槛；页面后台加载验证 SDK 本身不构成 CAPTCHA 拦截。

## 方法、证据、结果

1. 常规官方页面加载及 DOM：10 个 a[data-id]，真实 href 为 /campus/position/<字符串编号>/detail，标题选择器 .positionItem-title-text，地点选择器 .positionItem-subTitle > span:first-child。正文摘要在 .positionItem-jobDesc。实际 anchor 的原始 href 与解析后绝对 href 一致，无猜路径。
2. 公开请求观察：同域 GET /api/v1/search/job/posts，公开查询参数 keyword=、limit=10、offset=0、job_category_id_list=、tag_id_list=、location_code_list=、subject_id_list=、recruitment_id_list=、portal_type=6、job_function_id_list=、storefront_id_list=、portal_entrance=1，另含 _signature。未保存签名值、未重放请求、未生成签名、未将签名当追踪参数忽略。计数/登录状态请求未当作列表证据。没有捕获或声称已验证 JSON 响应 schema；HTTP 未验证不等于 HTTP 必然不可用。
3. 页面内嵌数据检查：实际脚本清单中 js-websiteInfo 为 text/json，但不包含第一页首条岗位编号；其他内联脚本同样不含该编号。本次未获得可直接解析的内嵌岗位数据，未遍历下载 bundle。
4. publicCaptureScript / document-start preload 能观察一个已知精确请求，但当前没有稳定匿名 HTTP 生产请求证据；捕获响应本身不能解决运行时签名来源。未反复尝试 responseBody，也未分析风控代码。基于现有真实 anchor，选择已支持的 browserListing 作为下一个具体方案，而不是强制穷尽网络工具。
5. 已完整读取 adapter-browser-listing.mjs：平台可用固定选择器读取一页，不点击不翻页，不需要 API schema。未使用 inlineDetails，因为这里存在独立详情 anchor。URL 最后一段是 detail，因此不得按该 reader 的可选编号契约输出错误/重复 id；将原始 data-id 留在证据中。生产可返回平台标准 title/url/company/location 字段。
6. 固定 DOM 路线所需资源权限缺口：页面实际引用及加载 lf-package-cn.feishucdn.com 的 PC 主程序 pc.ee0f1383.js；还引用 lf3-cdn-tos.bytescm.com 的 tinycolor-min_1583312799849.js。前者为业务脚本，后者为主题辅助资源，后者的必要性未通过阻断实验单独证明。本次按实际引用申请这两个精确域名，未申请观测到的全部分析/遥测/验证域名。证据链已写入新的 ROUTE_REVIEW.json。域名审核是停止边界，未构建依赖未授权域名的生产实现。

## 最小公开样本（仅列表，详情均未打开）

| 名称 | 真实字符串编号 | 地点 | 实际 anchor URL | 列表正文摘录 |
|---|---|---|---|---|
| 【27届校招】系统测试工程师 | 7684152748976523563 | 广州、上海 | https://xiaopeng.jobs.feishu.cn/campus/position/7684152748976523563/detail | 承担电机控制器、电源等功率产品集成测试工作 |
| 【27届校招】海外备件工程培训生 | 7684085399656401202 | 广州 | https://xiaopeng.jobs.feishu.cn/campus/position/7684085399656401202/detail | 完成备件SBOM与备件目录开发与信息准确维护 |
| 用户内容运营实习生 | 7683813653455440191 | 上海 | https://xiaopeng.jobs.feishu.cn/campus/position/7683813653455440191/detail | 围绕智能驾驶、智能座舱等产品及模型能力，制定面向用户的内容策略 |

这些是本次读取的真实 DOM 样本，不是 JSON 样本，不证明详情当前有效。续接时可直接打开这里实测的三个 URL，在新鲜列表匹配标题和编号后检查职责及任职要求，不需重新猜路径或寻找产品官网链接。

## 分阶段结论

- 离线测试及静态检查：以下追加实际运行结果；仍仅检查原模板，不代表 parser 开发完成。
- 真实列表/详情：一个列表页面可读，三个详情尚未核验（0/3），未对全部 516 条作有效性声明。
- 启用及页面验收：未执行，保持禁用；未扫描、未评估、未投递、未绑定、未安装。平台需独立匿名读取一页列表并核验三个详情。
- 当前剩余阻塞详见 BLOCKED.md；原域名审批已解决，新的资源域名审核尚未解决。审批后只补 provider、fixture 与三条详情，不重建候选。


本次检查结果（均 exit 0）：
- `node plugin-audit.mjs plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f` → audit clean。
- `node plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f/test/smoke.mjs` → provider fixture smoke ok，仅原模板的零网络测试。
- `node --check plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f/index.mjs`、同目录 `test/smoke.mjs` → 语法检查通过。

本轮仅写候选证据及新路线提案；未修改 index、manifest、原模板测试或平台文件。任务因路线审核结束，Ego 独立任务空间随后关闭，不保留临时详情标签。


---
# 2026-09-13 续接完成开发，等待平台独立验收

**当前结论以本节为准。** 资源权限阻塞已由平台于 2026-09-13T04:21:01.842Z 批准解决（摘要 `691d590c01f26e1234666f6cc585f5ee61251f1b2f930f4c7f895907c262107e`）。ROUTE_REVIEW.json 保持原样，未写入自制批准状态；原阻塞原文归档为 BLOCKED.resource-route-history.md。目前无未解决开发阻塞。

## 实现与证据方法

- 原任务空间已关闭；检查空间目录后新建独立 Ego Lite 空间 57，未操作用户常驻平台页面。直接使用已批准列表，不重启入口发现或搜索。
- 复用平台 `adapter-browser-listing.mjs` 的固定飞书 DOM 解析：`a[data-id]`，标题 `.positionItem-title-text`，地点 `.positionItem-subTitle > span:first-child`。`index.mjs` 仅代理 `ctx.browserJobs(entry)`，无生产 fixture、缓存、签名、模型或自建浏览器。字段保持官网 title/url/location 和平台公司名。
- 2026-09-13T04:24:40.919Z，在同一列表以平台原始 extractBrowserListing 函数及候选 manifest 实测，得到 10 条、10 个不同的字符串 data-id，所有编号均与各真实 URL 倒数第二段相同。前三条与上一轮样本完全一致。URL 最后一段是 detail，遵守平台契约不附加 id 字段；长编号原样保留在 URL 与本记录中。
- 列表来源：正常导航 GET `https://xiaopeng.jobs.feishu.cn/campus/position/list`；DOM 来源于官网业务脚本正常加载的公开响应。上一轮观察的列表 XHR 为同域 `/api/v1/search/job/posts`，参数与签名限制见历史记录。本轮不重放 API、不保存签名、不声称已验证 HTTP JSON schema。
- 未重复 HTTP 捕获，因为已证实真实 anchor 可由受支持的平台 reader 读取。没有需要 inlineDetails 的展开结构。生产资源仅声明已批准招聘域名及两个 CDN，不需产品官网域名。未申请额外权限；匿名资源限制和独立详情检查由平台下一阶段执行。
- 为检验实际固定 parser，必要地重新导航同一列表一次；Ego heredoc 的工作目录不同导致第一次动态 import 报 ERR_INVALID_FILE_URL_HOST，改为明确绝对路径加 pathToFileURL 后在原页面完成读取，无再次导航。这是本地导入路径错误，不是网站故障。

## 三条真实详情

均使用本轮新鲜列表实际 anchor href（也与历史已观察 URL 一致），复用单个标签直接打开。每条检查 pageInfo/listTabs，URL 未改变；标题和整段列表职责文本均在详情可见正文中匹配，另有可读职位要求。未点击投递，未出现可见登录/验证码门槛或岗位关闭页。

| UTC 时间 | 名称 | 字符串编号 | 真实详情 URL | 核对结果/最小正文证据 |
|---|---|---|---|---|
| 04:23:42.566 | 【27届校招】系统测试工程师 | 7684152748976523563 | https://xiaopeng.jobs.feishu.cn/campus/position/7684152748976523563/detail | 标题、编号、职责相符；要求车辆工程、计算机、电力电子等相关专业，本科及以上应届毕业生 |
| 04:23:45.711 | 【27届校招】海外备件工程培训生 | 7684085399656401202 | https://xiaopeng.jobs.feishu.cn/campus/position/7684085399656401202/detail | 标题、编号、职责相符；要求本科及以上、机械或汽车相关专业 |
| 04:23:48.818 | 用户内容运营实习生 | 7683813653455440191 | https://xiaopeng.jobs.feishu.cn/campus/position/7683813653455440191/detail | 标题、编号、职责相符；要求内容策划与文字表达能力，以及主流内容平台运营经验 |

## 分阶段测试及限制

1. **离线测试：通过。** `node plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f/test/smoke.mjs` exit 0。零网络 DOM fixture 调用平台原解析器，覆盖固定字段、长编号 URL 原样保留、空列表/无效字段/结构变化/身份不符/未批准 URL/超过100条失败，单次 reader 调用、不翻页及异常传播。测试模块不被生产导入；不会将失败变成假空列表。
2. **静态检查：通过。** `node plugin-audit.mjs plugins.local/company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f` → audit clean。index.mjs 与 test/smoke.mjs 的 `node --check` 均 exit 0。未修改审计器或平台 reader。
3. **真实详情抽查：三条通过。** 一页列表 10 条，前三条标题、字符串编号与详情职责核对完成。其余岗位未逐条核验；官网显示总数 516，不表示读取全量。只读第一页，不分页；平台上限为每页100条，零条/加载失败报未确认，不声称招聘结果为零。
4. **启用及页面验收：未执行，交平台。** 本轮 Ego 读取不是平台独立匿名验收。候选保持禁用，未安装、未绑定、未改信任或旧版；未运行 scan/verify-portals/批量扫描/AI评估/投递。平台仍须以批准资源域名独立读取同一页和三个详情，通过才切换，失败保留旧版。

日常读取零模型 Token（固定浏览器 DOM 解析）；本次 Agent 开发消耗开发 Token。浏览器运行仍需要时间和内存。所有写入限本候选目录，无凭证或个人数据。任务浏览器随后清理。
