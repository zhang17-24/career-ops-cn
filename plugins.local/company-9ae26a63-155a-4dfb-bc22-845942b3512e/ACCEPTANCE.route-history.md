# 金山办公候选：未验收

核验时间：2026-09-12T14:09:39.851372+00:00

候选：company-9ae26a63-155a-4dfb-bc22-845942b3512e。当前为路线发现阶段，BLOCKED.md 仍有效。

## 真实证据

配置入口 https://join.wps.cn/ 正常打开为 https://join.wps.cn/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/，标题“金山办公软件 - 校园招聘”。DOM 岗位入口的 raw href 和 absolute href 均为 https://app.mokahr.com/campus-recruitment/wps/41436?sourceToken=8379ee777457c4d22fc65d4439f660b3#/jobs?page=1&anchorName=jobsList&project%5B0%5D=100102183。这是 Moka 公开校招导航线索，优先考虑复用公共 ATS 解析规则，但未读取或构建新域名解析器。

正常首页观察到公开 XHR 地址 https://join.wps.cn/api/outer/ats-apply/website/group-by-job；未取请求/响应正文，未重放，未使用 CDP getResponseBody，不能用此记录证明职位 schema。未存凭证、个人资料或完整响应。

企业官网导航上限已用完，官网介绍能确认金山办公身份，但企业主页到招聘站链接链未补齐；详见 BLOCKED.md。ROUTE_REVIEW.json 以配置的招聘首页起链，须人工审核该限制。

## 分阶段结果

- 离线测试：预创建模板 smoke 仅验证模板，不能验证真实解析器；命令结果另附。
- 真实列表：0 页职位列表。仅检查校招宣传首页；分页、字段映射、ID、最小岗位样本均未确认。
- 真实详情：0/3，未访问详情，不能判断有效或过期。
- 启用及页面验收：未执行，由平台独立决定；候选保持停用，配置未修改。

未完成真实生产适配，日常零 Token 运行能力尚未验证。本次 Agent 开发使用 Token。

## 本轮检查命令

- `node plugin-audit.mjs plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e`：退出 0，audit clean。
- `node plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs`：退出 0，模板 fixture smoke 通过。仅模板测试，不是已实现适配器的测试。
- `node --check plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/index.mjs`：退出 0。

解析器、manifest 与测试模板均未修改；上述检查通过不能解除 BLOCKED.md。
