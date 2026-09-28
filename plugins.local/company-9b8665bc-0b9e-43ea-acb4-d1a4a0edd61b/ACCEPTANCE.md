# 腾讯候选：开发核验记录

候选：company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b。保持停用，未修改旧版本、配置、绑定或信任文件。
核验时间：2026-09-11 03:15–03:17 Asia/Shanghai（匿名 HTTP 结果时间 2026-09-10T19:16:18.434Z）。

## 来源与范围

仅腾讯，portals.yml 官网入口 https://join.qq.com/ 。Ego Lite 独立任务空间 21，未操作用户项目页。
2027 校园招聘列表：https://join.qq.com/post.html?query=p_1 。未读取社招或其他实习项目列表。
先只读旧版 company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9 的解析、测试及 ACCEPTANCE.md，再重新打开其中确切列表和详情 URL；没有猜路由、重试弹窗或点击申请。
官网使用自建 position API，未发现公共 ATS 的可复用契约；复用既有腾讯解析器的必要代码。

浏览器资源记录实际出现：
- https://join.qq.com/api/v1/position/searchPosition?timestamp=1789067761061
- 第一条详情实际请求：https://join.qq.com/api/v1/jobDetails/getJobDetailsByPostId?timestamp=1789067768707&postId=1282707398326592512

沿用已有证据中的请求 body，以无 Cookie、无 Token 的 Node HTTP POST 验证同一列表第一页：
`https://join.qq.com/api/v1/position/searchPosition`

```json
{"projectIdList":[],"projectMappingIdList":[1],"keyword":"","bgList":[],"workCountryType":0,"workCityList":[],"recruitCityList":[],"positionFidList":[],"pageIndex":1,"pageSize":10}
```

Content-Type: application/json；redirect: error。HTTP 200，status=0，data.count=117，positionList 长度 10，与浏览器第一页一致。不需要时间戳参数或匿名初始化。不记录完整响应。
生产契约：positionTitle → title，workCities → location（规范化空白），postId 保留字符串并代入已观察且重新核实的官方详情路由；company 固定腾讯。响应无所需发布时间，未伪造 postedAt。列表不提供完整职责，生产不额外请求详情。
固定 pageIndex=1/pageSize=10，仅一页；即使 entry.max_pages=3 也不会扩展。其他 107 条未读取，第一页另 7 条未核验详情。

## 三个真实详情（独立于离线测试）

| 列表名称 | 原始字符串 ID | 重新打开的官方详情 URL | 当前正文核对 |
|---|---|---|---|
| AI全栈工程师 | 1282707398326592512 | https://join.qq.com/post_detail.html?postid=1282707398326592512 | 标题一致；职责包含前后端全栈开发、Agent 架构与 RAG 系统，岗位要求完整可读 |
| Agent开发工程师 | 1282707395466077184 | https://join.qq.com/post_detail.html?postid=1282707395466077184 | 标题一致；职责包含多 Agent 协作、任务调度、记忆与决策、质量评估，岗位要求完整可读 |
| AI应用工程师 | 1282707395466077185 | https://join.qq.com/post_detail.html?postid=1282707395466077185 | 标题一致；职责包含大模型产品交付、智能对话及知识问答、效果反馈，岗位要求完整可读 |

第一条地点：深圳总部、北京、上海、广州、成都、杭州；后两条：深圳总部、北京、上海、广州、成都。
核对以新鲜列表字符串 ID 对照当前详情 URL postid 和当前标题/职责；详情正文不单独显示编号。三个页面 pageInfo 均为“岗位详情 | 腾讯校招”，没有关闭/404、登录拦截或验证码。页面存在“登录”及“投递简历”按钮，未点击。仅证明当前公开详情可读，不证明申请提交能力。
详情复用同一标签；没有反复创建临时详情标签。已知 URL 导航未发生失败，不消耗导航恢复尝试。

## 离线与静态检查

以下命令均退出 0：
- `node plugins.local/company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b/test/smoke.mjs`
- `node --check plugins.local/company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b/index.mjs`
- `node --check plugins.local/company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b/test/smoke.mjs`
- `node plugin-audit.mjs plugins.local/company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b` → audit clean

测试仅内存 fixture 和注入 fetchJson，无网络；覆盖映射、长字符串编号、拒绝数值编号、合法空列表、非法状态/结构/计数/字段、重复编号、一页 10 条上限、禁止翻页、HTTP 错误传播。生产模块不导入测试，不返回 mock，不将失败伪装为空列表。

## 激活与页面验收

开发核验已完成，无活动阻塞。候选保持停用，本次未安装、未绑定、未更新信任、未运行 scan.mjs / verify-portals.mjs 或平台页面扫描。平台结束后独立核验列表及三个真实详情，通过才负责启用替换；失败保留旧版。平台验收与启用状态仍待平台决定，本记录不代替该阶段。
日常适配器运行零模型 Token；本次 Agent 开发消耗开发 Token。
