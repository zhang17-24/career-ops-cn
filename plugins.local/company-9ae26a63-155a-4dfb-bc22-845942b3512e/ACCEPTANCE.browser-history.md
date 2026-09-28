# 金山办公：开发未完成，禁止作为安装依据

核验时间：2026-09-12T14:23:31.885007+00:00
候选：company-9ae26a63-155a-4dfb-bc22-845942b3512e。

## 路线及真实列表

ROUTE_REVIEW.json 字节不变；平台已批准 join.wps.cn 与 app.mokahr.com。继续使用批准入口，未重启官网搜索。页面标题“金山办公软件 - 校园招聘”。入口与官方链详见原始路线文件。

列表：https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/jobs?page=1&anchorName=jobsList&project%5B0%5D=100102183

该项目第一页显示 13 结果、30 行/页，仅第 1 页；未切换项目或翻页。只核验该页，不能代表全部校招岗位。浏览器有登录按钮但读取不需登录。DOM 岗位 anchor 的 raw href 为 #/job/ 加真实 UUID；resolved href 如下。三个编号保留字符串。

实际列表请求：POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2

公开参数：orgId=wps、siteId=41436、limit=30、offset=0、needStat=true、jobIdTopList=[]、projectFolderIds=["100102183"]、customFields={}、site=campus、locale=zh-CN；sourceToken 原样来自批准公开导航（见入口）。未读取请求头、Cookie 或个人信息。

通过 development-only publicCaptureScript 捕获正常导航响应，HTTP 200；顶层键 data、necromancer 均为字符串，data 长度9260。没有直接岗位数组，未将其解释为无岗位。未保存完整响应、重放请求或逆向安全机制。固定字段映射与匿名 HTTP 尚未验证。capture 已停止。

## 真实详情抽查：3 条 DOM 可读

- [政企营销（AI应用专项）-面向2027届-北京](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/18e7ef00-1329-4766-baf0-b9f023c29e8b)：字符串 ID `18e7ef00-1329-4766-baf0-b9f023c29e8b`；地点 北京市；正文包含“参与公司重点项目的营销工作”。列表标题、实际详情路由编号及详情标题一致，职责和任职要求可读，未见关闭/404或登录阻断。
- [运营专员（AI应用专项）-面向2027届-广州](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/6fe479d6-33ba-4fc3-80aa-6a2fca93a02e)：字符串 ID `6fe479d6-33ba-4fc3-80aa-6a2fca93a02e`；地点 广东·广州市；正文包含“制定运营策略并落地运营方案”。列表标题、实际详情路由编号及详情标题一致，职责和任职要求可读，未见关闭/404或登录阻断。
- [运营专员（AI应用专项）-面向2027届-武汉](https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/job/866ff8e0-96a3-487b-a5e2-ac8a413e7be5)：字符串 ID `866ff8e0-96a3-487b-a5e2-ac8a413e7be5`；地点 湖北·武汉市；正文包含“制定运营策略并落地运营方案”。列表标题、实际详情路由编号及详情标题一致，职责和任职要求可读，未见关闭/404或登录阻断。

首条通过滚动、视口命中检查后真实点击；其余两条复用同一详情标签，打开该列表 DOM 已读出的 exact resolved href。未猜路由，未点击申请。详情正文与封装 API description 无法比对；这些结果只证明当前 DOM 可读，不保证全部岗位有效或能够提交申请。

## 离线测试及静态检查

本轮命令均退出 0：`node plugin-audit.mjs plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e`（audit clean）；`node plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs`（blocked-provider offline check passed）；`node --check plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/index.mjs`。生产模块改为明确抛出阻塞错误，零网络 fixture 仅验证失败关闭；没有已实现解析器的字段、分页测试。不得将此测试解释为接入完成。

## 启用及页面验收

未执行，由平台独立决定。BLOCKED.md 仍有效，候选保持禁用；没有扫描、AI评估、投递、绑定、信任变更。日常目标为 HTTP 固定解析零 Token，但当前未实现；本次开发消耗 Agent Token。


## 续接复核 2026-09-12T14:53:29.877Z

本轮先读现有代码、测试、路线与阻塞历史。路线已批准，但没有新增公开响应或固定解析证据。遵守 SOP“无新证据立即记录阻塞”及“同一失败最多一次有明确依据的修正验证”，不重复上一轮已经完成的 Ego Lite 取证或三个详情访问；本轮新增真实列表/详情核验均为 0，历史 DOM 可读结果不作为本轮实时验收。未创建浏览器任务空间，无本轮空间需要清理。

重新运行 plugin-audit（audit clean）、test/smoke.mjs（blocked-provider offline check passed; production parser NOT implemented）、node --check index.mjs，均退出 0。离线测试仅验证明确抛错且不请求网络，不代表字段映射、分页或生产解析器完成。

未解决：jobs/v2 的 data/necromancer 字符串封装没有经过验证的公开固定解析方式；缺少真实响应字段映射及 API 描述比对。没有逆向、猜测端点、请求重放或 mock 兜底。需要新的可解析公开响应证据或平台支持确定性浏览器 provider 才能继续；单纯再次批准相同路线不解除本阻塞。

候选仍未完成，BLOCKED.md 保留有效；未执行启用及页面验收，未修改配置、绑定、旧版、锁文件或批准路线。


## browserListing 新方案续接 2026-09-12T15:09:20.688190+00:00

本轮已阅读平台 adapter-browser-listing.mjs 契约，未重复 HTTP 捕获。Ego Lite 独立任务空间 36 打开原批准 entryUrl，一页列表显示 13 结果、30 行/页，标题“金山办公软件 - 校园招聘”，未见登录或验证码阻断。未翻页、未访问详情、未点击申请。

新增资源证据：正常列表 document.scripts 和 performance resource 同时显示 `https://static-ats.mokahr.com/recruitment-web-client/javascripts/recruitmentWeb-20260910-1545-197e7-release.js`；同域还有 runtime、vendor、initial JS 和 recruitmentWeb CSS。`static-ats.mokahr.com` 不在现有批准域名内，是浏览器列表主程序资源依赖，故提交路线审核后停止开发。未自行授权、未调用生产 browserJobs、未分析脚本或重放 API。观察到的统计脚本 hm.baidu.com 与验证 SDK cstaticdun-v6.126.net 未申请权限；SDK 加载本身不代表出现验证码，其是否为读取必需尚未验证。后续若证明还需额外资源，应另行审核，不自动放行。

最小 DOM 证据：岗位 anchor 类 `link-txmgVOCVz9`，标题 span 类 `title-u2qk9xX9Ie`；地点位于 info-tPG_0QGbhl 下分隔符后的 no-adaptive-tooltip。这些只是续接线索，尚未实现/验证完整固定选择器。

新鲜列表样本（raw href → resolved href 由 DOM 读取，非拼接）：
- 政企营销（AI应用专项）-面向2027届-北京；北京市；raw `#/job/18e7ef00-1329-4766-baf0-b9f023c29e8b`。
- 运营专员（AI应用专项）-面向2027届-广州；广东·广州市；raw `#/job/6fe479d6-33ba-4fc3-80aa-6a2fca93a02e`。
- 运营专员（AI应用专项）-面向2027届-武汉；湖北·武汉市；raw `#/job/866ff8e0-96a3-487b-a5e2-ac8a413e7be5`。
三个 resolved href 与本文件既有详情链接逐字一致，字符串 ID 保留。本轮真实详情检查为 0；历史详情检查不能当作本轮实时验收。

原批准 JSON 字节副本保存在 ROUTE_REVIEW.approved-history.json；ROUTE_REVIEW.json 仅追加新资源域名及其实际连接证据，内容变更需要平台重新审核，旧批准不能授权新增域名。当前生产代码保留失败关闭，不基于未批准域名构建。

启用及页面验收：未执行，候选仍禁用，等待平台路线审核。浏览器方案运行目标为零 Token，本轮 Agent 开发消耗 Token。

本轮离线检查：`node plugin-audit.mjs plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e` → audit clean；`node plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs` → blocked-provider offline check passed; production parser NOT implemented；`node --check plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/index.mjs` → 退出 0。三项通过仅说明现有失败关闭候选的静态/离线检查通过，browserListing 尚未实现。
