# 拼多多候选开发验收记录

- 候选：company-25c29b83-55ea-4807-b8c4-c6773baf5f98。记录时间：2026-09-18T17:33:23Z（北京时间2026-09-19 01:33:23）；现场核验在此前约5分钟内。
- 状态：开发完成，保持 DISABLED / 未绑定，待服务端独立验收。未运行扫描、AI评估、投递、启用或配置修改。
- 用户提供的企业公开托管授权时间：2026-09-18T17:28:52.263Z；授权由平台提供，候选文件不授予权限。
- 原始入口：https://careers.pddglobalhr.com/campus/；页面标题“拼多多集团-PDD校园招聘官网”，正文“拼多多集团-PDD ｜ 校园招聘”，身份一致。
- 入口实际点击“应届生招聘”到 https://careers.pddglobalhr.com/campus/grad。仅此应届生列表第一页；不包含实习生、社招、后续页。
- 现有候选仅模板，无历史 BLOCKED.md 或验收证据，无旧 provider 绑定。技能中心返回空目录；读取了用户明确指定的项目技能与完整 SOP，以及 Ego Lite、Ponytail full 技能。

## 公开响应与实现

正常页面观察到 `https://careers.pddglobalhr.com/api/careers/api/recruit/position/list`。开发用 `publicCapturePreload` 精确限定该端点与 `https://careers.pddglobalhr.com/campus/grad`，先 Page.enable，再注册 document-start，正常导航同一列表，捕获完成后 finally 移除注册并 stop 清空。未读取请求头、Cookie、账号响应或凭证；未保存完整生产响应。

- 方法：POST；JSON body：`{"page":1,"pageSize":10,"t":null}`；HTTP 200。
- 返回 schema：`{success:true,errorCode:1000000,errorMsg:null,result:{list:[...],total:"36"}}`；本页10条。
- 列表字段：字符串 id、name、code、workLocation、workLocationName、job、jobName、releaseTime（毫秒）、jobDuty、labelList、recruitTypeName、graduationYear。
- 映射：id 原样字符串；name → title；workLocationName → location；jobDuty → description；releaseTime → postedAt；company 固定拼多多。
- 单独一次无 Cookie、无凭证的普通 Node HTTP 请求，以同样的公开参数返回200、10条、total="36"，前三条 ID/标题/地点与浏览器一致，职责长度分别679、530、297。
- 未见可复用公共 ATS 的证据；这是本站 `/api/careers/api/recruit/position/list`，采用最小公司专用解析，不引入依赖。
- 生产只调用 `ctx.fetchJson`，固定一次首屏请求，不跟随重定向；不导入测试、不调用 Ego/模型、不回退 mock。错误、结构变化、重复或非字符串 ID、正文缺失均抛错；仅明确成功且 total="0" 的空列表返回空数组。
- 不跟随 total 翻页，不声称覆盖36条；最多10条，用户 max_pages 不扩大请求数。

## 详情路线与真实抽查

岗位 anchor 无 href（原始属性 null、解析后空字符串），因此不用 browserListing。通过目标卡片祖先的公开 React onClick 读到局部导航代码：

`function(){return t=e.id,void(0,V.WF)({pathname:"".concat(n.pathname,"/detail"),query:{positionId:t}});var t}`

三个实际点击均证实当前列表路径加 `/detail?positionId=<真实字符串ID>`。每次点击前 scrollIntoView 居中、等两帧、确认视口内且 elementFromPoint 命中；每次检查 page.info 和 task.tabs，均在同一 p1 内导航，无额外详情页。等待完整职责及任职要求出现，无登录拦截、验证码或关闭提示；页顶“登录/注册”只是可选入口，未点击。

| 标题 | 字符串 ID | 地点 | 地址 | 核验结果 |
|---|---|---|---|---|
| AI Infra研发工程师 | `43b706c2-9d86-47de-a99d-fcd35405799f` | 上海 | [实际点击详情](https://careers.pddglobalhr.com/campus/grad/detail?positionId=43b706c2-9d86-47de-a99d-fcd35405799f) | 标题、URL字符串ID、地点及职责吻合；正文679字符；任职要求可读 |
| 运营管培生（区域业务） | `e22c34bf-9ef6-431b-a739-a4e94387413d` | 全国多省区 | [实际点击详情](https://careers.pddglobalhr.com/campus/grad/detail?positionId=e22c34bf-9ef6-431b-a739-a4e94387413d) | 标题、URL字符串ID、地点及职责吻合；正文530字符；任职要求可读 |
| 仓配物流管培生（区域业务） | `b168e225-3034-4cac-8e3a-ea4aff372a67` | 全国多省区 | [实际点击详情](https://careers.pddglobalhr.com/campus/grad/detail?positionId=b168e225-3034-4cac-8e3a-ea4aff372a67) | 标题、URL字符串ID、地点及职责吻合；正文297字符；任职要求可读 |

最小职责证据：AI Infra包含“大模型训练与推理基础设施研发”及技术价值闭环；运营包含招商运营、社群团长运营、卖场运营；仓配物流包含仓储管理、网格站管理。详情职责开头、末尾及完整长度与 API jobDuty 一致。未抽查本页其余7条，不推断所有岗位可投递。

## 方法、证据及纠正

1. 配置首页直接可用且品牌一致，无需搜索或入口恢复。
2. 首次文字定位歧义（两个同名元素），改为已观察的导航 li 精确选择器；SPA异步更新后进入应届生列表。不是链接失效。
3. 岗位无 href，但有公开导航处理器和实际点击路线，因此采用已被三次点击证实的固定映射；无需 DOM reader 或 inlineDetails。
4. 首次开发 helper 导入因 Ego 进程 cwd 不同而失败，尚未注册或发出请求；修正为准确 file URL 后成功。不是网站或权限问题。
5. 列表初始加载请求采用 document-start preload，成功取得真实 JSON；无需 getResponseBody、追踪参数例外、HTTP风控逆向或额外方法。
6. 匿名 HTTP 可读，固定解析足够。未把浏览器页面依赖的 CDN/遥测资源加入生产权限；provider仅需同域 API。路线链见 ROUTE_REVIEW.json。

## 分阶段结果

**离线测试：通过。** `node plugins.local/company-25c29b83-55ea-4807-b8c4-c6773baf5f98/test/smoke.mjs`：字段映射、超长字符串ID、同名不同ID、重复ID拒绝、成功空列表、错误/结构变化/缺字段、失败传播、只请求第一页。fixture仅在test目录，零网络。

**语法及静态审计：通过。** `node --check` 分别检查 index.mjs 和 test/smoke.mjs；`node plugin-audit.mjs plugins.local/company-25c29b83-55ea-4807-b8c4-c6773baf5f98` 输出 audit clean。未改审计器。

**真实详情抽查：3条通过上述人工开发核验。** 不等价于平台独立匿名验收。

**启用及页面验收：未执行。** 等待服务端独立取一页列表、三个详情并决定是否自动安装和替换绑定；本任务未启用、未绑定。运行时零模型 Token，本次开发使用 Agent Token。

无已知未解决开发阻塞；网站未来变更或平台独立检查失败仍应保留旧版本。
