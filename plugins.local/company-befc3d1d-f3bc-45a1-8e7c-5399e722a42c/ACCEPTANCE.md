# 猿辅导开发取证（生产读取未通过）

时间：2026-09-19T04:41:10.545Z。候选 company-befc3d1d-f3bc-45a1-8e7c-5399e722a42c。独立 Ego Lite 空间20；一页产品/研发类列表、三个不同详情，重导航仅取证同页。

## 来源与方法

- 配置入口 https://hr.yuanfudao.com/，标题“2026届猿辅导集团 - 校园招聘”。内嵌 org.id=fenbi、org.name=猿辅导集团、siteId=47742。未凭租户名猜身份。
- 实际 anchor 原始 href #/jobs?&zhineng%5B0%5D=160479，绝对地址 https://hr.yuanfudao.com/#/jobs?&zhineng%5B0%5D=160479；显示7条、30行/页。未翻页、未访问其他分类。社会招聘链接仅观察，未进入。
- ATS 优先：只读参考 providers/mokahr.mjs；其加密 API 路线不采用。候选使用 Moka 通用 init-data 结构加本企业身份约束，不复制旧 provider 的跨租户逻辑。
- 公开请求：POST https://hr.yuanfudao.com/api/outer/ats-apply/website/jobs/v2；HTTP200。body={"orgId":"fenbi","siteId":"47742","limit":30,"offset":0,"needStat":true,"jobIdTopList":[],"zhinengIds":["160479"],"customFields":{},"site":"campus","locale":"zh-CN"}。响应 schema 为 data:string、necromancer:string，不记录值、不解密。
- 取证：Page.enable → publicCapturePreload(实际端点,精确列表URL) → reload → 确认捕获 → finally 移除注册并 stop。最初 cwd import 失败发生于注册前，改用确切 file URL后成功。未重复失效 CDP requestId。
- DOM 替代：anchor 内有真实标题和链接，但无地点；expand-area 为空。browserListing 必需可见地点不满足；inlineDetails 所需 tr/summary 和 data-id 展开结构不存在，不能伪造选择器。
- 内嵌数据替代成功：公开初始化代码 JSON.parse(input#init-data.value)。Page.getResourceContent 取得真实原始 HTML（79830字符），内嵌15条，按实际 zhineng.id=160479 过滤7条，标题/字符串ID和本页anchors一致。未保存完整文档或响应。parseMokaHtml 对该真实文档运行成功，前三条如下。
- 固定字段：id/title/status/zhineng/location.address → 字符串编号/标题/open过滤/分类过滤/地点地址；缺失地点留空，不从 cityId猜地名。URL模板由实际anchors及三次点击确认；不补造描述和发布时间。首条存在旧closedAt但当前status=open且真实详情可读，因此不使用旧关闭日期判断失效。
- 匿名HTTP：首次GET根路径自动重定向报 redirect count exceeded。为诊断改manual仅检查Location，根路径302到 /campus-recruitment/fenbi/47742/，跟随该观察地址仍302到自身，确认循环。没有读取/重放Cookie、登录凭证；生产使用 redirect:error，错误抛出不返回mock/空列表。此阻塞仍在。

## 真实详情抽查

同一 p1 复用。每次实际 anchor scrollIntoView，等待布局及 viewport/elementFromPoint 命中，再点击；同时检查 page.info 和 task.tabs。等待标题及职位描述正文。没有登录/验证码阻挡，没有申请动作。

- 2025届校招- C端产品实习生（有转正机会）；字符串ID c3404b3e-9cb8-456f-a0df-cc89384f7255；https://hr.yuanfudao.com/#/job/c3404b3e-9cb8-456f-a0df-cc89384f7255。当前标题/编号一致，职责及要求可读。最小正文证据：参与斑马App服务体验的产品工作。未见关闭或404。
- 2026春招-测试工程师；字符串ID e433c6ae-c3f0-4e9e-96a1-4421063b1f69；https://hr.yuanfudao.com/#/job/e433c6ae-c3f0-4e9e-96a1-4421063b1f69。当前标题/编号一致，职责及要求可读。最小正文证据：移动端功能、兼容性测试；测试计划、用例和缺陷跟进。未见关闭或404。
- 2026届春招-AI服务端研发工程师；字符串ID 6ae831e9-eda5-417b-9353-5f229b46a9fb；https://hr.yuanfudao.com/#/job/6ae831e9-eda5-417b-9353-5f229b46a9fb。当前标题/编号一致，职责及要求可读。最小正文证据：猿辅导智能硬件/小猿AI APP/内容中心的服务端研发。未见关闭或404。

## 分层结果

- 离线测试：node plugins.local/company-befc3d1d-f3bc-45a1-8e7c-5399e722a42c/test/smoke.mjs —— PASS，零网络。覆盖字段、超长字符串ID、空列表、关闭、分类过滤、重复ID、结构错误、100条上限、单次请求和失败传播。
- 语法：node --check plugins.local/company-befc3d1d-f3bc-45a1-8e7c-5399e722a42c/index.mjs 及 test/smoke.mjs —— PASS。
- 静态检查：node plugin-audit.mjs plugins.local/company-befc3d1d-f3bc-45a1-8e7c-5399e722a42c —— audit clean（文档更新后再检查）。
- 真实浏览器：HTML解析7条，三个详情核对通过；不代表匿名HTTP成功。
- 启用/绑定/平台独立页面验收：未执行，保持禁用；BLOCKED.md 未解决，不应安装。未跑scan、verify-portals、批处理、AI评估或申请。
- 范围仅当前内嵌页产品/研发类，不承诺全量校招/社招或其余岗位有效。年份按官网原文保留。剩余具体能力缺口见 BLOCKED.md；无待批准域名阻塞，本次路线依据服务器提供的一次授权记录。
