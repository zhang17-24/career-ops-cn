# 完美世界：开发验证记录（候选禁用，待服务端独立验收）

- 候选：company-6612cd17-498d-4638-ba93-d29434368e7c。
- 时间：2026-09-19 11:57–12:04 Asia/Shanghai；最终列表读取 2026-09-19T04:04:12.444Z。
- 类型：2027 校园招聘；只读一页列表、三个详情；未投递、未扫描、未绑定、未启用。
- 服务端提示已保存本企业公开委托授权；本文件不授予权限。域名与连通证据见 ROUTE_REVIEW.json，由服务端最终校验。

## 入口恢复与方法选择

1. 原 portals.yml 完美世界入口 https://campus.wanmei.com/ 在 Ego Lite 返回 ERR_CERT_COMMON_NAME_INVALID。未忽略证书，不代表岗位过期。候选初始只有生成模板，没有历史证据或 BLOCKED.md。
2. 一次 Bing 搜索“完美世界 官网 招聘”，仅作导航线索，发现 https://jobs.games.wanmei.com/。该页面加载超时但已提交且 DOM 可读，标题“完美世界招聘官方网站”，页内完美世界集团及游戏等品牌链接一致。“校园招聘”的原始与绝对 href 均为 https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN 。没有猜测域名或租户。
3. 沿官网真实 href 进入 Moka，标题“完美世界 - 校园招聘”，校招职位原始 href 为 #/jobs，解析后为 https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/jobs 。三张导航页面预算以内，无社招/实习列表扩展。
4. 正常列表请求观察到 POST https://app.mokahr.com/api/outer/ats-apply/website/jobs/v2 。公开请求体：`{"orgId":"pwrd","siteId":"172467","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"customFields":{},"site":"campus","locale":"zh-CN"}`。响应 HTTP 200，顶层字段 data、necromancer，data 是不透明字符串。没有解码封装、重放请求或保存完整响应。
5. 开发取证采用 publicCapturePreload，先 Page.enable，精确文档作用域。第一次对当前相同 URL goto 未触发新文档，未捕获；改为正常 reload 后捕获成功。注册及内存 capture 均 finally 清理。不忽略查询参数，不读取请求头/Cookie。
6. HTTP 固定 JSON 解析缺少公开明文字段，而真实 anchor、标题和地点 DOM 可读，因此采用平台 browserListing；不再重复 HTTP 尝试，不需要 inlineDetails 或自建浏览器执行器。复用平台 Moka 可用的通用固定 DOM reader，不新增 ATS 抓取框架。
7. 最终验证尝试导入平台模块在 Ego Node 环境停滞；终止该开发进程，改为从该文件读取原有 extractBrowserListing 函数原文并在 Ego 执行。初次 SPA 导航后立即读取尚无岗位，等待真实选择器出现后成功。平台文件未修改。最终 30 条、30 个唯一 URL，排除右侧 8 个“最新职位”链接，无翻页。页面筛选计数 36，仅覆盖首批 30 条。

## 固定字段与限制

- listUrl 为上述 #/jobs；identityText 为完美世界（文档标题）。
- linkSelector：`a.link-txmgVOCVz9:has(.card-content-eGHrYZMEX6)`。
- titleSelector：`.title-u2qk9xX9Ie`。
- locationSelector：`.ellipsis-s4h2VX0z8O > div:last-child > .no-adaptive-tooltip`，保留官网地域文字。
- url 直接使用可见 anchor.href；id 原样取已观察到的 #/job/ 最后一段，始终字符串。company=完美世界。无虚构发布时间或描述，DOM 描述仅用于本次详情验证。
- 平台匿名浏览器 reader 检查身份、可见性、登录/验证码、域名、空数据和结构；provider 额外检查 URL 租户、必填字段、重复编号及单页 100 条上限。错误直接抛出，不返回 fixture 或空列表掩盖异常。
- 正常页面实际资源域名已记录。126.net 是页面加载的脚本资源，不代表出现验证码；本次未出现验证码或要求登录的拦截。顶部“登录”按钮不影响公开读取。
- CSS 构建类名改变可能导致失败，需要重新观察更新。运行时零模型 Token，仍有匿名浏览器启动成本。本次 Agent 开发消耗开发 Token。

## 三个真实详情抽查

每次点击前对实际 anchor scrollIntoView(center)，等待边界完全在视口内且 elementFromPoint 命中；点击后同时检查 page.info 和 task.tabs，均在同一 p1 正常导航，没有累积详情标签。核验标题、链接中的字符串 ID、完整职责与任职要求，未点击投递。

|字符串 ID|列表及详情标题|地点|实际点击 URL|详情内容核对|
|---|---|---|---|---|
|de498ba8-660d-4225-85cb-92a7fc892c0d|27届秋招-数值策划（MMO）|北京市|https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/de498ba8-660d-4225-85cb-92a7fc892c0d|MMORPG 玩法系统维护优化、策划文档与配置；本科及以上、逻辑思维等要求完整可读，匹配列表 DOM 正文。|
|0e44b052-04aa-492e-a556-452bcc464c96|27届秋招-角色原画（国风玄幻）|北京市|https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/0e44b052-04aa-492e-a556-452bcc464c96|角色场景道具原画设计与细化；美术相关专业、美术基础等要求完整可读，匹配列表 DOM 正文。|
|aa63b164-3376-4ad1-a865-31eb772930b0|27届秋招-品宣视觉设计师|广东·广州市|https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN#/job/aa63b164-3376-4ad1-a865-31eb772930b0|买量素材、商店包装、游戏宣传设计，设计工具及 AI 辅助要求完整可读，匹配列表 DOM 正文。|

三个详情未见岗位关闭/404、登录拦截、短信验证或 CAPTCHA。API 描述不可直接读取，不声称已比对解码 API 正文。其余岗位未逐条核验，抽样不证明全部可投递。

## 离线测试与静态检查

以下命令均通过：

- `node plugins.local/company-6612cd17-498d-4638-ba93-d29434368e7c/test/smoke.mjs`：纯内存 fixture，无网络；字段映射、长字符串编号、同名不同 ID、重复 ID、空及异常结构、单页上限、错误传播。
- `node --check plugins.local/company-6612cd17-498d-4638-ba93-d29434368e7c/index.mjs`
- `node --check plugins.local/company-6612cd17-498d-4638-ba93-d29434368e7c/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-6612cd17-498d-4638-ba93-d29434368e7c`：audit clean。

离线测试不代表真实验收；DOM 选择器另经上述真实一页验证。

## 启用及页面验收

未执行。保持候选禁用，无配置/绑定/锁文件更改；服务端后续独立匿名读取一页列表与三个详情，通过后才安装并替换绑定。未解决开发阻塞：无。原入口证书问题已通过实际官网导航恢复，不删除或修改旧版本。本次 Ego 任务空间 18 已 finish({keep:[]}) 清理。
