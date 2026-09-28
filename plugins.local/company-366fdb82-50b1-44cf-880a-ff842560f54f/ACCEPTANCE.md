# 得物候选：开发完成，待平台独立验收

核验时间：2026-09-12T15:48:12Z（北京时间 2026-09-12 23:48）。
候选：company-366fdb82-50b1-44cf-880a-ff842560f54f。

## 入口发现证据

配置入口 https://campus.poizon.com/ 在 Ego Lite 返回 ERR_CONNECTION_CLOSED，属于连接失败，不能认定岗位过期或零岗位。
已有候选仅含生成模板，没有旧 ACCEPTANCE、BLOCKED 或路线申请。
使用一次 Bing「得物 官网 招聘」搜索，仅作为导航线索；随后读取三个官网/导航页面：
1. https://dewu.com/：标题“得物App-新一代潮流网购社区”，页脚“上海得物信息集团有限公司”；“加入得物”和“加入我们”均明确链接到 https://poizon.jobs.feishu.cn/index。
2. https://poizon.jobs.feishu.cn/index：标题“加入得物App”，校园招聘 raw href=https://campus.dewu.com，解析为 https://campus.dewu.com/。
3. https://campus.dewu.com/：实际到达 https://campus.dewu.com/578078，标题“得物App校园招聘”；“校招职位” raw href=/578078/position/list，解析为 https://campus.dewu.com/578078/position/list。

最小公开请求证据：首页正常加载观察到 https://campus.dewu.com/api/v1/common/setting。没有读取响应、重放请求或保存凭证。这不是岗位列表请求。公开岗位 API 的参数、schema、分页及详情路由尚未核验。飞书 ATS 是后续优先复用方向，未据此授权任何域名。

## 离线测试

以下命令退出码均为 0：
- node plugin-audit.mjs plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f
- node plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f/test/smoke.mjs
- node --check plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f/index.mjs

以上仅检查原始生成模板，不是已实现的官网解析器。模板 fixture 的虚构岗位/地址不能用作导航线索或真实证据。因路线审核必须停止开发，未改解析器与测试，亦未声称字段映射或异常处理已完成。

## 真实详情抽查

实际岗位列表：0 页；详情：0/3。未采集任何真实岗位标题、编号或描述，未进行分页。批准后仍需在一页列表、最多三个详情预算内补齐实现与证据。

## 启用及页面验收

未启用、未绑定、未扫描、未投递。候选维持未安装/禁用状态；原配置与旧版未修改。ROUTE_REVIEW.json 请求平台审核新的精确入口和域名，当前只有 campus.poizon.com 获得生产权限。没有额外开发阻塞，因此不创建 BLOCKED.md 来替代路线审核。批准后继续原候选，保持申请 JSON 字节不变；后续发现额外必需资源域名仍须重新审核。


## 续接记录：2026-09-12T15:52:03.189Z

平台已批准原路线（approvedAt 2026-09-12T15:49:09.987Z）。本次未重跑入口搜索，直接打开批准入口 https://campus.dewu.com/578078/position/list；旧申请字节原样保存于 ROUTE_REVIEW.approved-history.json。当前 ROUTE_REVIEW.json 新增两个页面直接引用的 CDN 精确域名，须重新审核，旧批准不覆盖新增域名。

### 真实列表与公开请求

Ego Lite 独立任务空间 41，标题“得物App校园招聘”。初始异步壳显示0，加载完成后显示161，本页10条、17页；只读第1页，没有翻页、搜索或点击申请。页面有登录链接，但公开列表无需登录，未出现登录/验证码拦截。

实际自然请求端点：https://campus.dewu.com/api/v1/search/job/posts 。公开查询参数：keyword为空、limit=10、offset=0、job_category_id_list/tag_id_list/location_code_list/subject_id_list/recruitment_id_list/job_function_id_list/storefront_id_list为空、portal_type=6、portal_entrance=1。正常请求还带动态 _signature；未记录其值、未重放、未逆向。未读取响应body，因此API schema、字符串ID字段及HTTP解析仍未验证。未使用 getResponseBody 或捕获重试。后续若继续HTTP证据，须使用 publicCaptureScript 在正常SPA导航之前观察此已发现端点，不可猜签名。

DOM可读，优先复用平台固定 browserListing 能力（已阅读契约），但脚本域名需要路线审核；本轮未实现该路线，未证明独立匿名浏览器可读。页面script src及资源记录显示主前端 pc.ee0f1383.js 位于 lf-package-cn.feishucdn.com，另直接引用 lf3-cdn-tos.bytescm.com 上 tinycolor-min_1583312799849.js；精确地址见新路线申请。未申请统计/监控域名，不能据此声称其余资源均非必需，独立验收需确认。

最小DOM样本（编号从实际href原样读取；不是API字段证据）：

| 名称 | 字符串编号 | 实际列表anchor绝对href | 详情核验 |
|---|---|---|---|
| 【27届校招】行政综合岗 | 7684151037683681578 | https://campus.dewu.com/578078/position/7684151037683681578/detail | 未打开 |
| 【27届校招】安全产品/策略开发工程师 | 7672234301103278382 | https://campus.dewu.com/578078/position/7672234301103278382/detail | 未打开 |
| 【27届校招】算法研究员-视觉方向 | 7672233920910854450 | https://campus.dewu.com/578078/position/7672233920910854450/detail | 未打开 |

以上raw href均为绝对URL的同源路径部分，未拼造路由。前两项列表地点上海，第三项上海、杭州。未保存完整响应、凭证或个人数据。

### 分阶段结果

- 离线：再次运行上文 audit、smoke 和 index 语法检查，均退出0；仍仅生成模板检查通过，不代表真实解析器完成。未为未经批准域名编写代码。
- 真实：本次1页列表、0/3详情；不可声明岗位有效或可投递。续接可优先使用上述真实href核对详情。
- 启用及页面验收：未执行，候选保持禁用；未改配置、绑定、信任、旧版或锁文件，未扫描/评估/投递。由平台后续独立验收决定安装。

当前状态：等待新增资源域名路线审核。除此之外没有独立发现的登录、连接或身份阻塞，因此不新增 BLOCKED.md 代替路线审核。审批后仅补固定读取实现、隔离fixture、三条真实详情及平台验收；当前模板不能安装。生产运行目标为零模型Token，本次开发使用Agent Token。


## 续接完成：2026-09-12T16:00:57.876Z（北京时间 9月13日 00:00）

本节为当前结论，上文保留历史过程。平台于 2026-09-12T15:55:36.230Z 批准新增资源域名；ROUTE_REVIEW.json 原样保留，未改申请或批准文件。先读原候选代码、证据；无活动 BLOCKED.md。原任务空间已不存在，新建 Ego Lite 空间42，仅本企业。

### 实现及范围

已替换生成模板，复用平台 adapter-browser-listing.mjs 固定 reader，通过 ctx.browserJobs(entry) 读取。未实现或声称通用飞书 HTTP API 已可用。manifest 只声明读取所需的 campus.dewu.com 和两个获批 CDN。官网导航域名不用于生产读取，未扩大权限。

来源请求为本次正常浏览器 GET https://campus.dewu.com/578078/position/list；既有公开 XHR 观察记录见上一节。本次按已批准 browserListing 路线续接，不再进行 HTTP 捕获、API 重放或签名分析；API 响应 schema 未核验。岗位证据来自本次真实公开 DOM。

固定 anchor 选择器 a[data-id]；标题 .positionItem-title-text、地点 .positionItem-subTitle > span:first-child 均相对 anchor。10条均具有这些字段，10个公开 data-id 唯一。链接读取 raw href 和浏览器解析的完整 href，不构造路由；公司由平台 entry 提供。所有ID均以字符串核对。官网 URL 末段是 detail，平台可选 id 仅支持末段编号，故生产不附加 id，完整 URL 保留真实编号；不伪造 postedAt/description。无独立 parser 复制，直接使用平台统一固定解析与错误检查。

只读第一页10条，不翻页/过滤/搜索，不声称全量覆盖；平台单页上限100、45秒总超时，缺失字段、空/失败列表、登录或验证码均报未确认。运行零模型Token；本次开发消耗Agent Token。

### 真实详情抽查：3/3 对应

核验开始 2026-09-12T16:00:01.451Z，结束前于16:00:57.876Z复核原列表。本轮仅1页列表与3个详情，详情逐个关闭。按之前实际观察、并由本次列表再次确认的完整 anchor href 直接打开，没有猜路径，也没有重复popup点击。

| 列表/详情名称 | 原始字符串 data-id | 实际详情URL | 最小正文证据与结果 |
|---|---|---|---|
| 【27届校招】行政综合岗 | 7684151037683681578 | https://campus.dewu.com/578078/position/7684151037683681578/detail | 上海；行政制度、流程标准化及员工福利运营。标题一致，URL编号一致，列表职责去除空白后完整包含于详情正文，另有职位要求。 |
| 【27届校招】安全产品/策略开发工程师 | 7672234301103278382 | https://campus.dewu.com/578078/position/7672234301103278382/detail | 上海；安全威胁感知、入侵检测、应急响应。标题一致，URL编号一致，列表职责去除空白后完整包含于详情正文，另有职位要求。 |
| 【27届校招】算法研究员-视觉方向 | 7672233920910854450 | https://campus.dewu.com/578078/position/7672233920910854450/detail | 上海、杭州；供应链视觉感知、质检鉴别及多模态算法。标题一致，URL编号一致，列表职责去除空白后完整包含于详情正文，另有职位要求。 |

页面存在登录导航，但三条公开职责与要求正常可读，无登录弹窗、验证码、关闭或404提示；没有点击投递。上述为开发浏览器抽查，不证明所有岗位有效，也不代替匿名平台验收。

### 离线测试

修改后下列命令退出0：
- node plugin-audit.mjs plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f （audit clean）
- node plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f/test/smoke.mjs （PASS）
- node --check plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f/index.mjs
- node --check plugins.local/company-366fdb82-50b1-44cf-880a-ff842560f54f/test/smoke.mjs

fixture仅位于test，为零网络内存桩：验证单次reader调用、entry及结果原样传递、完整长编号URL、平台空列表/结构变化/冲突/登录/数量上限错误原样传播，缺少reader时拒绝。它不独立测试平台DOM引擎，不可用来证明真实网络或匿名读取成功。当前选择器另在真实列表10条逐项核对字段存在。

### 启用及页面验收：未执行，交平台

开发已完成，无已知活动开发阻塞。没有写入BLOCKED.md，也没有移除未解决阻塞来促成安装。未运行scan、verify-portals、批处理、AI评估或投递；未修改候选目录之外文件、旧版、配置、绑定、信任或锁文件，未提交推送。候选保持禁用。

平台仍须在独立匿名Chromium内验证已批准资源范围足以加载本页、精确匹配真实列表及三个详情，完成静态/fixture/完整性检查后才决定启用并替换本企业绑定。若其检查失败应保留旧版，不能凭本文件声称安装或页面验收通过。
