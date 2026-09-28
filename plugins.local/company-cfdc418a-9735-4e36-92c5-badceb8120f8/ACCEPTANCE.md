# 完美世界候选开发验收记录

候选：company-cfdc418a-9735-4e36-92c5-badceb8120f8。2026-09-19（北京时间）。开发验证完成；未安装、未启用、未绑定。平台独立验收尚未执行。

## 来源与方法

- 仅处理 portals.yml 的完美世界。配置入口 https://campus.wanmei.com/ 在 Ego Lite 返回 ERR_CERT_COMMON_NAME_INVALID；未忽略证书错误，不能判断岗位过期。
- 按入口恢复预算只执行一次“完美世界 官网 招聘”搜索。搜索仅提供导航线索，打开 https://jobs.games.wanmei.com/ 后标题为“完美世界招聘官方网站”，其校园招聘真实 anchor 指向 https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN 。官网同时显示“关于完美”及 www.wanmei.com 链接；没有为冗余反向链接继续导航。
- Moka 页标题“完美世界 - 校园招聘”，校招职位 href 原文 #/jobs，解析地址为 manifest.browserListing.listUrl。加载曾等待 load 超时但文档已提交；继续读取现有页面，岗位成功出现，无登录或验证码门槛。
- 观察到公开 POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2 。开发期 publicCaptureScript 在正常 SPA 首页→列表导航之前安装，只捕获一次并 stop 清理。第一次辅助模块导入路径格式错误，修正为绝对 file URL 后成功，不涉及重放请求。
- 请求体：`{"orgId":"pwrd","siteId":"172467","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"customFields":{},"site":"campus","locale":"zh-CN"}`。状态 200；schema 为 data（不透明字符串）、necromancer。未解码封装、未逆向安全签名、未保存完整响应、未使用 Cookie 或认证信息。
- 有证据的替代方案：公开 DOM 可读且具有真实 anchor，采用平台通用 browserListing reader；不需要新造 Moka HTTP 解码器。初始 linkSelector 同时匹配“最新职位”侧栏，缺少完整地点字段而失败关闭；根据实际卡片 DOM 加 :has(.card-content-eGHrYZMEX6) 后排除侧栏，平台 extractBrowserListing 原函数成功提取 30 条。
- 不选择预加载：请求发生在 SPA 导航且内存捕获已成功。inlineDetails 不适用：官网提供真实独立详情 anchor。无需额外接口猜测、bundle 遍历或重复 HTTP 取证。
- 运行时仅 ctx.browserJobs(entry)，平台启动匿名中文 Chromium，固定 selector 解析；候选仅验证字段、原样保留字符串 ID。无 Ego CLI、模型调用、fixture 导入或失败兜底。

## 列表与详情抽查

同一列表首页 30 条（页面显示共 36 条），offset=0 / limit=30；未翻页。固定 reader 不点击、不翻页，平台上限 100；仅代表当前首页覆盖，不代表全部岗位。候选当前真实 DOM 解析得到 30 个唯一字符串编号。

详情 URL 全部来自当前列表 anchor，不猜路径。复用 p2 标签逐条打开观察到的绝对 href，等待任职要求与职责正文完成；未点击申请按钮。字符串 ID 来自官网 #/job/ 后的原始片段。完整正文按去空白比较，列表 DOM 与详情正文相同；仅保存最小摘要。

| 标题 | 字符串 ID | 详情核对 |
|---|---|---|
| 27届秋招-数值策划（MMO） | `de498ba8-660d-4225-85cb-92a7fc892c0d` | 标题、ID、正文一致；正文 504 字符；2026-09-19T04:39:28.981Z |
| 27届秋招-角色原画（国风玄幻） | `0e44b052-04aa-492e-a556-452bcc464c96` | 标题、ID、正文一致；正文 318 字符；2026-09-19T04:39:29.592Z |
| 27届秋招-品宣视觉设计师 | `aa63b164-3376-4ad1-a865-31eb772930b0` | 标题、ID、正文一致；正文 956 字符；2026-09-19T04:39:30.272Z |

- [27届秋招-数值策划（MMO）](https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/de498ba8-660d-4225-85cb-92a7fc892c0d)：1.参与MMORPG项目现有玩法、系统及战斗内容的持续维护与优化，根据玩家反馈、运营数据和版本目标不断提升游戏体验。
- [27届秋招-角色原画（国风玄幻）](https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/0e44b052-04aa-492e-a556-452bcc464c96)：1.在导师指导下，参与项目内角色、场景及道具等视觉元素的原画设计与细化工作，协助完成从概念到落地的基础绘制任务；
- [27届秋招-品宣视觉设计师](https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/aa63b164-3376-4ad1-a865-31eb772930b0)：1.负责游戏项目视觉设计工作，包括但不限于：游戏买量素材（广告图、推广KV、活动视觉等）设计；应用商店视觉包装（商店图、ICON、宣传素材等）设计；游戏内外宣传物料、活动专题视觉延展；版本更新、角色/皮肤相关视觉包装。

最小公开样本、原始 href、精确资源 URL 和 UTC 时间见 evidence.json；连通路线见 ROUTE_REVIEW.json。资源域名来自页面实际请求；sentry 遥测未加入许可范围，允许平台阻止非必要遥测。未出现登录/验证码；页面普通“登录”按钮未操作。

## 离线测试与审计

以下命令均于 2026-09-19 成功，退出码 0：

- `node plugins.local/company-cfdc418a-9735-4e36-92c5-badceb8120f8/test/smoke.mjs`：纯内存 fixture，无网络；覆盖字段映射、长字符串编号、同名不同 ID、重复 ID、空/畸形列表、错误公司/URL、单次 reader 调用及异常传播。
- `node --check plugins.local/company-cfdc418a-9735-4e36-92c5-badceb8120f8/index.mjs`
- `node --check plugins.local/company-cfdc418a-9735-4e36-92c5-badceb8120f8/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-cfdc418a-9735-4e36-92c5-badceb8120f8`：audit clean。

离线测试不证明官网当前有效。上述真实抽查属于开发期 Ego 验证，未替代平台的独立匿名读取及详情核验。

## 启用及页面验收

待平台执行；未运行 scan.mjs、verify-portals.mjs、批量扫描、AI 评估或投递。没有修改旧版、绑定、信任或全局配置。独立 Ego 任务空间 19 已清理。无未解决开发阻塞，因此没有 BLOCKED.md。

限制：使用 Moka 当前固定 DOM 类名，页面改版应失败关闭并重新核验；原 campus 域名证书问题通过官方招聘入口恢复，未修复其证书。平台仍需独立验证新入口、精确域名及资源加载，成功后才可安装绑定；失败保留旧版。浏览器运行零模型 Token，但需要 Chromium 和资源开销。三条抽查不保证其他岗位当前可投递。
