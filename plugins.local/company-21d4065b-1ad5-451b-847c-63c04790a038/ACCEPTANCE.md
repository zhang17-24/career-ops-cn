# 阿里巴巴候选：开发完成，待平台独立验收

以下为历史记录；最新结论见文末「本次续接完成」。

核验时间：2026-09-18T15:55:26Z。候选：company-21d4065b-1ad5-451b-847c-63c04790a038。

## 已有成果与范围

续接时仅存在生成模板 index.mjs、manifest.json、test/smoke.mjs 及说明文件；没有既存 ACCEPTANCE.md、BLOCKED.md 或 ROUTE_REVIEW.json。未重建、未修改模板代码、旧版、配置、绑定或信任。技能中心返回空目录；读取并遵循用户明确指定的适配技能、完整SOP、Ego技能及Ponytail full。

## 本次真实证据

- 配置校招首页：https://campus-talent.alibaba.com/?lang=zh 。Ego Lite 独立空间2中正常打开，标题“阿里巴巴校园招聘”，显示2027届应届生、阿里星人才计划、研究型/日常实习生；未见身份冲突。
- 首页无anchor；“职位”是 li[title="职位"]。按要求 scrollIntoView 后，边界 x=421,y=0,width=68,height=60，视口内且 elementFromPoint 命中，再执行正常点击。
- page.info 与 task.tabs 均确认实际进入 https://campus-talent.alibaba.com/campus/position ，未新增标签。初始筛选空壳随后出现列表，不能把初始空壳当作失败。
- 一页列表显示“全部在招职位（476）”，不代表已提取476条。最小可见样本：AI应用算法工程师，字符串编号 `199907740040`，官网anchor https://campus-talent.alibaba.com/campus/position/199907740040?deptCodes= ，地点“北京 / 广州 / 杭州 / 上海”，更新于2026-09-03。未打开该详情。
- 正常页面资源记录显示同域 XHR `/position/search`，查询包含动态 `_csrf`；为避免保存令牌不记录查询值，不重放，不读取响应正文，也未据此建立解析器。另观察到外域配置资源请求，但尚未证明属于生产必需资源，未申请或使用其生产权限。

## 方法、结果与剩余缺口

1. 配置首页DOM → 可确认官方校招身份，无需搜索产品官网反向链接。
2. 无anchor菜单 → 使用真实DOM菜单正常点击，得到明确新列表入口；不是猜路由。
3. 当前权限只声明域名，未提供该新入口的路线批准。SOP要求入口变化即使同域也先审核，已提交 ROUTE_REVIEW.json 并停止开发。
4. 批准后可选择：观察到的同域列表XHR固定解析；若为初始加载请求则使用精确文档预加载取证；若HTTP无法解析则评估已支持browserListing。当前有真实岗位anchor，DOM路线存在依据，但选择器、必要资源域名及独立匿名读取尚未核实。未出现足以选择inlineDetails的展开证据。上述方案均不能代替路线批准，故本轮不继续尝试。

## 分阶段结果

- 离线：`node plugin-audit.mjs plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038` 通过；`node plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038/test/smoke.mjs` 通过；`node --check plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038/index.mjs` 通过。均仅针对既有生成模板，不代表真实字段解析完成。现有fixture是模板样例，不是生产证据；正式实现仍需替换解析器及相应测试。
- 真实详情：0/3，未核对详情名称、编号及职责。仅观察同一页列表，无翻页、无扫描、无投递。
- 启用及页面验收：未执行；候选保持未启用，平台批准路线后续接，并在开发完成后独立验收。

仅阻塞于具体的新入口路线审核；没有额外的官网关系发现阻塞。批准不代表实现或验收成功。


## 续接核验 2026-09-18T16:20:42.110163+00:00

- 本次平台已批准原 entryUrl 与 campus-talent.alibaba.com。保留原证据，不重新发现首页；原 ROUTE_REVIEW.json 原始字节已存 ROUTE_REVIEW.approved-history.json（SHA256 61c9c0ab5b642583dd3f6c6e46c6a3dd552d3f7ee24f1abd16961b9d0590b568）。因新增资源域名必须重新审核，当前 ROUTE_REVIEW.json 是新申请，历史批准不能用于新域名。
- Ego Lite 独立任务空间6，直接打开批准列表 https://campus-talent.alibaba.com/campus/position ，标题“阿里巴巴校园招聘”，正文含“阿里巴巴2027届应届生”和“全部在招职位（476）”。仅该页，无分页。页面的常规登录按钮/聊天登录提示没有阻挡公开岗位，不判为强制登录。
- 从真实 anchor 同时读取 raw href 和 resolved href，三个最小样本（尚未打开详情）：
  - AI应用算法工程师；字符串ID `199907740040`；北京 / 广州 / 杭州 / 上海；https://campus-talent.alibaba.com/campus/position/199907740040?deptCodes=
  - Agent Infra工程师；字符串ID `199907640058`；北京 / 广州 / 杭州 / 上海 / 深圳；https://campus-talent.alibaba.com/campus/position/199907640058?deptCodes=
  - AI应用研发工程师；字符串ID `199907620013`；北京 / 广州 / 杭州 / 上海 / 深圳；https://campus-talent.alibaba.com/campus/position/199907620013?deptCodes=
- DOM依据：anchor类 PositionListCard--linkContainer--zGIc15D；名称子元素 PositionListCard--mame--NEpvDLL；地点在 PositionListCard--basicWrapper--JLyeORe 第三个 basicItem 中的 text span。未将选择器作为已经验证的生产实现。
- 正常请求：同域 XHR /position/search，参数名仅 _csrf；未输出值、未读用户接口、未保存完整响应。资源请求实际看到 g.alicdn.com/CPO-platform/recruit-portal/1.0.1/js/index.js 与 lang.alicdn.com/mcms/recruit-careers-portal/0.0.90/recruit-careers-portal.json，已作为新路线证据。仅保留公开资源URL，不保存凭证。

### 方法选择及具体缺口

1. 既有阻塞检查 → 原入口审批已解决，归档旧 BLOCKED 为 BLOCKED.route-resolved-history.md。
2. 批准列表DOM + Resource Timing → 岗位真实anchor可读，发现应用核心脚本和语言资源需新域名；选择平台现有 browserListing 比自建会话/安全参数处理更直接。已读 adapter-browser-listing.mjs，不修改平台模块。
3. HTTP JSON/HTML：尚未取得匿名公开响应字段契约，不声称不可行或返回401；观察的 XHR 带 _csrf，不能将其当tracking忽略，也不从浏览器复制凭证到生产。没有证据支持 HTML/内嵌JSON岗位解析。此次不尝试接口枚举或签名处理。
4. 普通/预加载捕获：已读 adapter-network-capture.mjs；它能观察精确公开请求，但并不解决生产匿名契约或授予资源域名。未尝试后就宣称捕获失败，未使用 query 忽略例外。
5. inlineDetails：有独立官网anchor，不需要另造文本定位链接；尚无符合 tr/summary + data-id 契约的证据。
6. browserListing：公开DOM与固定选择器已提供依据，平台支持此路线；核心应用资源域名未批准是当前具体缺口。按域名边界停止，不先运行生产reader或打开三条详情。统计/聊天等域名没有一并申请；审核后按实际匿名reader结果判断必要资源，不能保证本次两域名已涵盖全部依赖。

### 本次阶段状态

- 解析器：仍为原生成模板；未宣称完成固定解析，也未导入fixture作为生产结果。
- 真实详情：0/3，仅记录列表字段与真实href；没有对详情描述、职位有效性作结论。
- 启用及页面验收：未执行，候选保持禁用，由平台审核后继续与独立验收。无扫描、评估、投递或绑定修改。

离线复核：本次 plugin-audit、test/smoke.mjs、node --check index.mjs 均通过；测试改用要求的 node:assert strict 导入。仅证明原模板静态与样例测试通过，不证明阿里巴巴字段解析或在线验收。


## 本次续接完成（2026-09-18T16:24:48Z–16:25:55Z）

### 权限与实现

本次提示由平台提供三域名批准（approvedAt 2026-09-18T16:22:14.111Z，digest f6a89c725a7b9ba20bde464f7c21feed07ce50e3b301030c814f62c1f5d7dd06）。ROUTE_REVIEW.json 未改动；只将已批准的 campus-talent.alibaba.com、g.alicdn.com、lang.alicdn.com 写入候选 manifest。旧资源审批阻塞已实际解决，归档为 BLOCKED.resources-resolved-history.md。

使用独立 Ego Lite 空间8，直接续接已批准校招列表，不重新发现入口。列表标题“阿里巴巴校园招聘”，显示阿里巴巴2027届应届生，企业身份一致。没有通用公开 ATS API 契约证据，复用平台通用 browserListing reader，仅本企业 DOM 选择器在 manifest 中声明。生产模块只调用 ctx.browserJobs(entry)，从真实 pathname 最后一段原样保留字符串编号，拒绝重复 ID、空列表、超过100条和异常字段。无 fixture 导入、无 mock 兜底、无模型调用、无凭证处理。

### 方法、证据、结果

- DOM读取：同一列表页观察10条实际 anchor；raw href 为 `/campus/position/<原始编号>?deptCodes=`，resolved href 为以下完整详情地址。标题在 `PositionListCard--mame--`（官网实际拼写）；地点在第三个 `PositionListCard--basicItem--` 的 text span。采用 class 前缀选择器，不依赖构建 hash。
- 真实来源：GET https://campus-talent.alibaba.com/campus/position；官网应用正常加载产生的同域 `/position/search` 在历史证据中已观察。此轮选择 DOM，不重放带 _csrf 的请求，不捕获或保存凭证。没有虚构 JSON schema。核心脚本和语言资源沿已批准链读取。
- 详情：复用 p1，打开已记录且与本次新列表一致的完整官网 href。未猜地址、未增加样本、未点投递或登录。三个详情均显示对应名称、职位描述、职位要求；ID通过列表URL和最终详情URL精确对应，未声称正文另印职位编号。
- 固定reader验证：16:25:55Z，在同一列表以平台 extractBrowserListing 函数和 manifest 选择器读取，再以 normalizeBrowserJobs、候选 provider、assertBrowserJobsMatch 核对10条全部字段及编号，通过。这里只使用 Ego DOM；没有调用平台 readBrowserListing 启动另一浏览器，不能替代独立匿名验收。首次辅助脚本因 Ego 进程 cwd 为 `/` 无法读取本地 manifest，改用已知绝对仓库路径后通过；这不是官网连接失败。
- 方案取舍：公开 DOM + 真正 anchor 已满足平台支持契约，无须继续 HTTP/预加载取证、内嵌 JSON 或导航代码分析；没有 tr/summary 展开需求，不采用 inlineDetails。未忽略任何查询参数。列表图标引用 img.alicdn.com，不属于生产批准范围；不请求扩大权限，生产 reader 会阻止未批准资源。匿名限制下是否仍能完成渲染由平台独立检查，不能用 Ego 会话读取替代。

### 真实详情最小样本

| 时间（UTC） | 名称 / 字符串编号 | 官网详情URL | 核对结果与正文摘要 |
|---|---|---|---|
| 2026-09-18T16:24:48Z 后 | AI应用算法工程师 / `199907740040` | https://campus-talent.alibaba.com/campus/position/199907740040?deptCodes= | 标题、URL编号与列表一致；描述涉及大模型产品化、数据飞轮、模型适配与后训练、评测和生产交付；要求与算法岗位相符。 |
| 2026-09-18T16:25:05.365Z | Agent Infra工程师 / `199907640058` | https://campus-talent.alibaba.com/campus/position/199907640058?deptCodes= | 标题、URL编号与列表一致；描述涉及Agent全生命周期基础设施、沙箱隔离、容器编排、任务调度；要求涉及计算机基础及后端技术栈。 |
| 2026-09-18T16:25:07.774Z | AI应用研发工程师 / `199907620013` | https://campus-talent.alibaba.com/campus/position/199907620013?deptCodes= | 标题、URL编号与列表一致；描述涉及业务需求、Agent架构、RAG知识库和工程落地；要求涉及AI编程工具及大模型能力理解。 |

地点分别为“北京 / 广州 / 杭州 / 上海”、后两条“北京 / 广州 / 杭州 / 上海 / 深圳”。三个页面未出现阻挡岗位正文的登录、验证码、关闭或404；页头登录和聊天组件提示不妨碍公开详情读取。不确认当前账户投递资格，不表示全部岗位均有效。

### 分阶段结果

1. **离线测试：通过。** `node plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038/test/smoke.mjs`；纯内存、零网络，覆盖字段保留、超长字符串编号、同名不同ID、重复ID、空/异常输入、单页100条上限、错误透传。`node --check plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038/index.mjs` 通过。`node plugin-audit.mjs plugins.local/company-21d4065b-1ad5-451b-847c-63c04790a038` 输出 audit clean。
2. **真实详情抽查：3/3 可读且匹配。** 一页列表10条，未翻页；官网显示476为界面总量，不声称抓取或验证476条。没有提取未核实的描述/发布时间到生产结果。
3. **启用及页面验收：未执行，交由平台。** 候选保持禁用；未修改配置、绑定、锁文件、旧版或信任。平台应独立验证匿名浏览器资源限制、一页列表及三个详情，通过才自动安装与切换绑定，失败保留旧版。没有运行扫描、AI评估或申请流程。

Ego空间8已调用 finish({keep:[]}) 完成清理。本次仅修改候选目录。没有剩余开发阻塞；独立验收与启用尚未完成。
