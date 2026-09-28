# 金山办公：browserListing 开发核验记录

候选：company-9ae26a63-155a-4dfb-bc22-845942b3512e。
时间：2026-09-12T15:38:41.470Z 至 2026-09-12T15:39:03.471Z（UTC）。
状态：固定 DOM 适配实现完成，候选保持禁用；平台独立验收与安装尚未执行。

## 路线与范围

只读取 portals.yml 的金山办公条目，配置招聘首页 https://join.wps.cn/ 。
按本轮平台提供的 2026-09-12T15:35:19.725Z 路线批准继续，无搜索、无入口重建。
批准入口：https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/jobs?page=1&anchorName=jobsList&project%5B0%5D=100102183
批准精确域名：join.wps.cn, app.mokahr.com, static-ats.mokahr.com。
ROUTE_REVIEW.json 未修改，文件 SHA-256：`ba615fa29c8f8bbda379ebd56b82ddb812a02c38ff01fe64b579001f0d15e7d1`（文件摘要，不是自行签发的批准）。
官方招聘首页 → 重定向招聘首页 → Moka 校招项目页 → static-ats 资源的实际链沿用 ROUTE_REVIEW.json。
页面标题“金山办公软件 - 校园招聘”，租户 wps/site 41436 一致。

仅打开一个项目列表第一页：13 结果，30 行/页，第 1 页，未翻页或切换筛选。
同页固定选择器读取 13 条、13 个独立官方详情链接，无编号重复。
历史任务空间已不在当前列表，本轮创建独立 Ego Lite 空间39，详情复用同一标签，完成后关闭本次空间。
首次本地证据读取因 Ego CLI 工作目录不同失败，改用已知文件绝对路径，尚未触发页面请求；不属于官网连接失败。

## 固定解析与真实请求证据

复用平台 adapter-browser-listing.mjs 的通用 ATS DOM 读取、可见性及身份检查，生产代码通过 ctx.browserJobs(entry) 委托。
manifest.browserListing.listUrl 与批准入口逐字一致，不调用 Ego CLI、不使用模型、不导入测试数据、不回退 mock。

- linkSelector：`.jobs-AkItzswt6b a.link-txmgVOCVz9`
- titleSelector（相对 anchor）：`.title-u2qk9xX9Ie`
- locationSelector（相对 anchor）：`.info-tPG_0QGbhl .separator-_pKVwkeo9b + div .no-adaptive-tooltip`
- title/location 来自可见元素 innerText；url 来自 anchor.href（同时读出 raw href）；company 为固定目标企业。
- id 从已观察详情 URL 的 `#/job/` 后读取，保留原始字符串，不拼接详情地址、不转 Number。缺失、重复编号和其他租户链接均失败关闭。
- 无可验证 postedAt，故不输出；日常列表不读取 description，描述仅本轮三详情抽查。不能据此声称全量或所有岗位可投递。

首次选择器 a.link-txmgVOCVz9 同时命中侧栏最新职位，平台 reader 因其缺少标题/地点节点而拒绝。检查 DOM 后，唯一修正为限定实际主列表父元素 .jobs-AkItzswt6b，原样平台 extractBrowserListing 在同一已加载页面通过，共13条。未重载、没有第二次方法恢复。

正常 SPA performance 资源记录再次观察到 https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2 ，以及 group-by-job、jobs/departments/flat、jobs/departments/structure、jobs/recent；未读取个人数据响应。真实 API 请求体与 data/necromancer 不透明封装仅保留历史说明于 ACCEPTANCE.browser-history.md，本轮不重复捕获、不重放、不解码、不逆向。HTTP 解析仍不可用；新的生产实现完全使用受支持的 browserListing，故 HTTP 限制不再阻塞本实现。

已批准 static-ats.mokahr.com 提供脚本与样式。额外观察 public-cdn.mokahr.com 的 jpg 图片和 png 样式图像，及历史已有 hm.baidu.com 统计、cstaticdun-v6.126.net SDK；没有扩展权限，平台仍须阻止这些未批准域名。未出现验证码。Ego 可读不等于已通过匿名资源限制验收；匿名 Chromium 在三个批准域名内能否完成读取由平台独立检查，若其证明还需要资源域名，应另行路线审核，不自动放行。

## 真实详情抽查：本轮三条

三条 exact href 均由新鲜列表 DOM 读取，与旧 ACCEPTANCE.md 实际观察过的完整 URL 相同。优先打开这些已知真实链接，不拼路由、无弹窗重试。逐条核对当前页面 URL/字符串 ID、标题、地点以及职责/任职要求；无关闭/404、登录或验证码阻断。没有点击申请。

- [政企营销（AI应用专项）-面向2027届-北京](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/18e7ef00-1329-4766-baf0-b9f023c29e8b)
  - ID `18e7ef00-1329-4766-baf0-b9f023c29e8b`；地点 北京市；时间 2026-09-12T15:38:59.425Z。
  - 标题、详情路由 ID、地点一致，职责和任职要求可读。正文最小样本：参与公司重点项目的营销工作；
- [运营专员（AI应用专项）-面向2027届-广州](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/6fe479d6-33ba-4fc3-80aa-6a2fca93a02e)
  - ID `6fe479d6-33ba-4fc3-80aa-6a2fca93a02e`；地点 广东·广州市；时间 2026-09-12T15:39:01.452Z。
  - 标题、详情路由 ID、地点一致，职责和任职要求可读。正文最小样本：制定运营策略并落地运营方案，持续跟踪与分析运营数据效果并提出改进计划
- [运营专员（AI应用专项）-面向2027届-武汉](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/866ff8e0-96a3-487b-a5e2-ac8a413e7be5)
  - ID `866ff8e0-96a3-487b-a5e2-ac8a413e7be5`；地点 湖北·武汉市；时间 2026-09-12T15:39:03.471Z。
  - 标题、详情路由 ID、地点一致，职责和任职要求可读。正文最小样本：制定运营策略并落地运营方案，持续跟踪与分析运营数据效果并提出改进计划

不声称描述与不透明 HTTP API 逐字比对完成；browserListing 按 SOP 走独立 DOM 详情验收，不叠加 inlineDetails/HTTP。

## 离线测试与静态检查

零网络 fixture：test/smoke.mjs 使用最小公开列表样本；测试真实平台 extractBrowserListing / normalizeBrowserJobs 和候选 provider 委托，未启动浏览器、未访问网络。覆盖名称/地点/链接字段、字符串长编号、同名不同编号、重复编号、空列表、异常结构、错误传播、企业身份、验证码提示、批准域名和单页100条上限。
DOM double 只验证读取契约，不模拟真实 CSS 布局；固定选择器与布局由上面新鲜 Ego 页面核验，不把 fixture 当在线证据。

最终检查时间：2026-09-12T15:41:01.272284+00:00。以下均退出 0：

- `node plugin-audit.mjs plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e` → audit clean。
- `node plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs` → offline fixture passed；no network。
- `node --check plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/index.mjs` → 通过。
- `node --check plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs` → 通过。

## 启用及页面验收

未执行启用、安装、绑定、信任变更或产品页面扫描。由服务端独立读取一页列表和三个详情，审核通过后才自动安装；失败保留旧版。本轮未运行 scan.mjs、verify-portals.mjs、批量扫描、AI评估或投递。
原活动阻塞已解决：平台提供 browserListing 且所需主程序域名获批，代码与三详情抽查已完成。历史原文归档为 BLOCKED.browser-history.md 与 ACCEPTANCE.browser-history.md，不作为活动阻塞或本轮新鲜证据。无修改旧版或平台配置。
日常适配运行零模型 Token；本次 Agent 开发使用 Token。
