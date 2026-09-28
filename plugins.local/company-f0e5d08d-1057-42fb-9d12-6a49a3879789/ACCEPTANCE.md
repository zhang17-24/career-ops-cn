# 开发核验记录：阻塞，未通过真实验收

候选：company-f0e5d08d-1057-42fb-9d12-6a49a3879789
核验时间：2026-09-11T02:18:36Z（UTC）

## 来源与最小公开证据

portals.yml 唯一目标为“深度求索DeepSeek”，careers_url 为 https://careers.deepseek.com/。
Ego Lite 独立空间 22 对该入口进行一次导航。pageInfo 返回 chrome-error://chromewebdata/，标题 careers.deepseek.com；正文“无法访问此网站”“意外终止了连接。”、ERR_CONNECTION_CLOSED。
listTabs 仍显示所请求的 https://careers.deepseek.com/，这不能证明页面加载成功。
未观察到公开 fetch/XHR 资源。没有实际列表 API 请求、岗位样本或详情 URL 可以记录；不猜测请求。

招聘类型（社招/校招/实习）、ATS 类型、字段映射和分页上限均未确认。
没有找到该企业已有同域 ACCEPTANCE.md 可用作历史导航线索；无证据支持修正，不重试连接。
未保存凭证、个人资料或完整生产响应。

## 离线检查

以下命令均退出 0：

- node plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/test/smoke.mjs
- node --check plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/index.mjs
- node --check plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/test/smoke.mjs
- node plugin-audit.mjs plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789（audit clean）

测试仅为零网络阻塞行为检查：有/无 api 参数时都明确抛错，网络调用次数为零。真实 parser fixture 测试尚未实现；以上通过不能代表解析完成。生产文件不导入 fixture，也不返回 mock。

## 真实列表及详情检查

真实列表读取未成功，详情核对 0 条。标题、字符串编号、描述及可投递状态均未确认。连接失败不等于登录要求或职位关闭；未观察到登录、短信或 CAPTCHA。

## 激活及页面验收

未启用、未绑定、未更新信任、未运行扫描或 AI 评估、未投递。保留平台预创建的停用状态；旧版本及配置未修改。服务端独立验收尚未进行，活动 BLOCKED.md 应阻止安装或替换绑定。

## 后续限制

须先恢复获准官网的可读访问，再续接固定解析、真实结构 fixture、一页列表及最多三个详情核对。当前只提供明确失败的占位 provider，适配器开发未完成。

## 续接只读发现 2026-09-11T02:38:44.591Z

技能中心目录返回 []；按用户指定完整读取招聘源技能和 SOP，使用 Ego Lite。原空间 22 已不存在，本次使用独立空间 23；未操作常驻平台页。一次搜索“深度求索DeepSeek 官网 招聘”仅作导航线索。三个官网/导航页面：

1. 搜索显示的 https://talent.deepseek.com/，标题 DeepSeek 招聘；页脚杭州深度求索人工智能基础技术研究有限公司。Logo 原始 href 为 https://www.deepseek.com，绝对 href 为 https://www.deepseek.com/。本列表页未观察到 fetch/XHR，不据此推断不存在 API。
2. https://www.deepseek.com/，标题 DeepSeek | 深度求索，页脚相同公司全名；加入我们、岗位详情的原始和绝对 href 均为 https://talent.deepseek.com/。官网实际链接建立官方关系。
3. 招聘页实际 href https://app.mokahr.com/social-recruitment/high-flyer/140576#/job/2eb2e75d-29f3-47b5-bb10-39f12547d398，直接打开观察到的地址；pageInfo、listTabs 确认当前详情 URL，标题 DeepSeek招聘。正常页面产生公开 XHR https://app.mokahr.com/api/outer/ats-apply/website/job；未重放请求，方法、参数、匿名响应结构尚未确认。

最小公开样本：服务端开发工程师，字符串编号 2eb2e75d-29f3-47b5-bb10-39f12547d398（列表 href 与当前详情 URL 一致，未转 Number）。列表地点北京市、杭州市，详情地点浙江·杭州市、北京市，标题一致。描述涉及与大模型研究员协作建设工程基建，并有团队使命、职责、要求；招聘方向含实习/全职并欢迎应届毕业生。未点击申请。

真实详情抽查：1 条路线发现样本可读，没有强制登录/短信/验证码或明确关闭/404；其余未核验，不能视为三条验收通过。官网链接采用 Moka，后续优先评估可复用 ATS 解析；分页、发布时间、匿名 HTTP 路线仍未验证。未保存完整生产响应、凭证或个人数据。

ROUTE_REVIEW.json 已提出新入口及两个精确域名申请，等待平台审核，未自行授权。代码和清单保持原样，开发未完成。活动 BLOCKED.md 保留。

离线检查（本次重新执行均退出 0）：原 test/smoke.mjs 零网络阻塞测试、index.mjs 与 test/smoke.mjs 的 node --check、node plugin-audit.mjs plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789（audit clean）。这只证明占位实现明确失败且不产生伪岗位，真实 parser fixture 尚未完成。

启用及页面验收：未执行，保持禁用，交平台独立验收；未运行扫描、AI 评估、投递，未修改旧版或绑定。首次写文档命令遇本地 Python 编码错误，未产生写入；改用 Node 成功保存，不涉及官网请求重试。

## 续接完成：2026-09-12T03:20:37.285Z（UTC）

本节取代前文的当前阻塞状态，前文仅保留历史。候选开发检查完成，等待平台独立验收；未安装、未启用、未绑定。

### 批准路线与范围

本轮平台提供 approvedAt=2026-09-11T02:40:00.814Z，digest=1289b3aa0d5556480294e0201a3ab8d2009a65e0d0efc347f98eb512d1d5856b。ROUTE_REVIEW.json 未修改。生产权限仅 talent.deepseek.com、app.mokahr.com。沿批准入口续接，未重新搜索、未访问旧故障域名、未申请扩大域名。

只读取 portals.yml 中深度求索DeepSeek 的入口配置，未修改它。技能中心为空，读取用户指定技能及完整 SOP；未运行会写入其他目录的初始化、更新或扫描流程。

### 实际来源与实现选择

Ego Lite 独立任务空间 24（DeepSeek f0e5 candidate validation），本次仅一页列表与三个详情。页面标题 DeepSeek 招聘，34 个实际岗位链接，未见列表 fetch/XHR。三个链接的 raw href 与 resolved href 相同，详见下表。未点击投递或读取用户凭证。

普通公开 GET https://talent.deepseek.com/ 返回 580 字符的 HTML 空壳，含真实 script src=/static/main.2832365397.js。依据这个直接观察到的 src，读取一次 https://talent.deepseek.com/static/main.2832365397.js（313219 字符）。这是同一列表的页面资源，不是新增列表页或猜测 API。Ego serverFetch 从 Node 读取，两次均未提供 Cookie、Token 或登录信息。完整响应只临时用于本次解析验证，未保存到候选。

该资源包含 JSON.parse 单引号字符串中的公开数据：crawledAt、sourceUrl、total、functionCategories、jobs。crawledAt=2026-09-07T06:09:32.312Z，sourceUrl=https://app.mokahr.com/social-recruitment/high-flyer/140576#/，total=34，与页面链接数一致。固定解析器从本次真实响应得到34条，前三条标题、字符串 ID、详情 URL 与页面相同。

优先评估 Moka：正常详情页面产生 https://app.mokahr.com/api/outer/ats-apply/website/job 等公开请求。本轮不重放详情接口、不推断其参数、不访问另一个 ATS 列表页，也不枚举列表接口。因此采用已直接验证的官网公开静态数据，而非声称已实现通用 Moka API 适配。没有执行下载的 JavaScript，也没有逆向安全签名。

生产每次通过 ctx.fetch 获取入口及当次 HTML 明示的同域 main 资源，两次 GET；不使用固定旧资源哈希、Cookie、初始化或模型。拒绝重定向；官网发生迁移时明确报错，须重新审查。不存在请求失败后的缓存/mock 回退。入口壳不是空列表；只有合法完整对象 total=0 且 jobs=[] 才返回空数组。

### 字段与边界

- id 原样保留字符串；title ← title；url ← detailUrl（不使用 submitUrl）；company 固定为本企业。
- location ← locations 原样拼接，不推断地点。前三条分别为“北京市 海淀区 / 浙江 拱墅区”“北京市 海淀区 / 浙江 拱墅区”“北京市 海淀区”。页面显示北京/杭州，原始数据细分地址表述不同，未人为改写为杭州。
- description ← descriptionHtml 去标签及解码常见实体；不将 crawledAt 当 postedAt，源无已确认发布时间。
- 本页是一个完整发布快照，无已观察分页控件；固定读取一次，不按 max_pages 翻页。要求 total 与 jobs.length 完全一致且不超过500，缺项、重复 ID、数值 ID、异常地点/标题/描述、错误详情域名或 ID 全部报错，不静默丢弃。资源上限500万字符。
- 招聘入口是混合招聘，Moka URL 为 social-recruitment；抽查描述明确实习/全职，第一条欢迎应届毕业生。没有单独核实校招入口。

### 三个真实详情（本轮重新读取）

| 列表标题 | 字符串 ID | 实际观察 href / 详情地址 | 核对结果与最小描述证据 |
|---|---|---|---|
| 服务端开发工程师 | 2eb2e75d-29f3-47b5-bb10-39f12547d398 | https://app.mokahr.com/social-recruitment/high-flyer/140576#/job/2eb2e75d-29f3-47b5-bb10-39f12547d398 | 当前标题、URL ID 一致，地点浙江·杭州市、北京市。描述为与大模型研究员共同建设工程基建，含职责与要求。沿历史已观察完整地址重新打开；有申请职位按钮，未点击。 |
| Agent 弹性计算研发工程师 | bae809fb-1978-4401-b209-34067b26569d | https://app.mokahr.com/social-recruitment/high-flyer/140576#/job/bae809fb-1978-4401-b209-34067b26569d | 当前标题、URL ID 一致，地点浙江·杭州市、北京市。描述为 DSec 弹性计算平台、沙箱、平台开发和底层系统，实习/全职，职责要求可读。 |
| 深度学习研发工程师 | 01416da2-3c8a-4a20-bbb3-1c925d0facf1 | https://app.mokahr.com/social-recruitment/high-flyer/140576#/job/01416da2-3c8a-4a20-bbb3-1c925d0facf1 | 当前标题、URL ID 一致，地点北京市。描述为算法与系统贯穿训练到部署，要求 Python/C++，实习/全职，职责要求可读。 |

复用同一详情标签，直接打开已观察 href，无弹窗点击失败或猜路由。pageInfo 核对三条当前地址，listTabs 确认独立列表/详情两页。未见强制登录、短信或 CAPTCHA；未见关闭/404。仅三条抽样可读，未验证提交申请功能，也不代表其他31条有效。

### 时效限制

官网列表静态数据时间为9月7日，本次读取为9月12日，不是实时 Moka 列表。第一条当前详情包含招聘规模约150人的文字，而官网静态描述未含这句话，证明文本不是逐字实时同步；标题、ID 与核心职责仍匹配。生产返回官网发布描述，不凭详情手工补全或硬编码更新。使用者应以详情页最新内容为准；平台独立验收仍可因时效或其他问题拒绝本候选。

### 检查结果（全部退出0）

- node plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/test/smoke.mjs
- node --check plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/index.mjs
- node --check plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789/test/smoke.mjs
- node plugin-audit.mjs plugins.local/company-f0e5d08d-1057-42fb-9d12-6a49a3879789 — audit clean

离线 fixture 覆盖字段、超长字符串编号、转义、空结果、结构异常、重复、分页上限、URL 安全、HTTP 401/404/500/timeout 及仅两次读取的流程。fixture 与生产隔离，测试不访问网络。

真实响应检查是将本次 Ego 匿名 HTTP 响应交给最终固定 parser，返回34条并核对前三条；没有再次请求列表。它与离线 fixture 分开，不声称已通过平台运行上下文的在线验收。

### 启用及页面验收

未执行，候选保持平台预创建的 DISABLED 状态。未修改配置、绑定、信任、锁文件或旧版，未运行 scan.mjs、verify-portals.mjs、批量扫描、AI 评估或投递。平台在本次任务结束后独立验证一页列表和三个详情，再决定是否安装及替换绑定。

原活动阻塞已实际解决，移至 BLOCKED.resolved-history.md；没有活动 BLOCKED.md。日常读取零模型 Token，本次 Agent 开发消耗开发 Token。

收尾：ROUTE_REVIEW.json 原始字节 SHA-256 与平台批准 digest 完全一致（1289b3aa0d5556480294e0201a3ab8d2009a65e0d0efc347f98eb512d1d5856b）；临时完整响应已清理，Ego Lite 任务空间24关闭成功。
