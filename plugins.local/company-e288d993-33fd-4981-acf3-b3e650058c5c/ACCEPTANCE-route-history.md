# 理想汽车候选：等待路线审核，未完成适配

- 候选：`company-e288d993-33fd-4981-acf3-b3e650058c5c`
- 核验时间：2026-09-13 15:31 UTC（北京时间 23:31）。
- 本次只检查指定企业；候选原有模板，无历史 ACCEPTANCE、BLOCKED 或路线提案。
- 已完整读取适配技能与招聘源验收 SOP；技能中心轻量目录返回空数组，使用用户明确指定的项目技能及 Ego Browser、Ponytail full。

## 实际入口与方法证据

1. Ego Lite 独立空间 59 打开配置校招入口 `https://www.lixiang.com/employ/campus/list.html`。页面标题为“理想汽车丨理想，给车和家赋予生命。 | 职位列表”，正文含“加入我们”“校园招聘与实习”“社会招聘”，企业身份一致。无需另搜产品官网反向链接。
2. 初始快照尚无岗位；随后读取同一页 DOM，列表正常出现。页面含登录入口，但读取岗位未要求登录，未出现验证码。未把初始空壳判为失败。
3. pageInfo 与 listTabs 均显示 `https://www.lixiang.com/employ/campus/list.html?fromJob=1`。Navigation Timing 保留配置地址且 redirectCount=0，因此只能认定页面端地址变化，未证明 HTTP 重定向。
4. 读取该页 Resource Timing 中公开列表请求：`https://api-web.lixiang.com/osd-hr-recruitment-website/v1/recruit/school/job-page?page=1&page_size=10`，initiatorType 为 xmlhttprequest。未重放、未调用 getResponseBody、未读取请求头、Cookie 或账户响应。
5. DOM 显示“共1031个职位”，当前十条；此总数仅是页面陈述，不代表完整扫描。前三条最小公开样本：高速选址运营实习生（北京）、充电网络工程供应管理实习生（上海）、电力大客户实习生（北京）。尚未获取真实字符串 ID 或 API 描述，不能据这些标题构造岗位或详情 URL。

## 路线审核与下一步

当前生产权限只有 `www.lixiang.com`。正常列表请求涉及新的 `api-web.lixiang.com`，入口也发生变化，已按精确 schema 保存 ROUTE_REVIEW.json，等待企业页面批准。无其他已知独立开发阻塞，因此不新增 BLOCKED.md；路线提案不代表批准。

方法评估：公开 XHR 已给出具体列表端点，审批后应优先核实真实响应并选择固定 JSON/HTML 解析；尚无公共 ATS 的证据，不能预判采用 Moka 等适配器。初始加载请求可在审批后使用 publicCapturePreload，先启用 Page，精确限定文档并 finally 清理。当前未尝试任何捕获或生产请求，因为域名审核是明确停止边界。browserListing、inlineDetails 或点击路由取证不能解除域名权限，也没有必要在已有有效提案时追加无关发现。后续只补缺失工作，保持路线 JSON 原样。

## 分阶段验证

- 离线检查：`node plugin-audit.mjs plugins.local/company-e288d993-33fd-4981-acf3-b3e650058c5c` 通过；`node plugins.local/company-e288d993-33fd-4981-acf3-b3e650058c5c/test/smoke.mjs` 通过；`node --check plugins.local/company-e288d993-33fd-4981-acf3-b3e650058c5c/index.mjs` 通过。均为已有生成模板检查；模板测试中的示例不是官网证据，不证明固定解析器已实现。本次遵守路线审核停止边界，未修改模板代码。
- 真实详情抽查：0/3；仅正常读取一页列表，没有详情导航、没有翻页。编号、描述、详情有效性、字段映射与分页行为均待审批后开发核验。
- 启用及页面验收：未执行、未安装、未启用、未绑定。未运行 scan、verify-portals、批量任务、AI 评估或投递。平台需在开发完成后独立验收；现有模板不得作为完成适配安装。
- 运行目标为确定性零 Token；本次 Agent 开发本身消耗 Token。未保存完整生产响应、凭证或个人资料。
