# 美的集团候选：等待路线审核（未完成开发）

- 候选：`company-c6db03fe-0829-475c-9d0b-e19cd68113df`
- 记录时间：2026-09-13T02:59:57Z（北京时间 2026-09-13 10:59:57）。
- 当前平台批准的生产域名仅为 `campus.midea.com`。本次没有新增授权、启用或绑定操作。
- 读取了候选所有实现/说明/测试文件；没有既有 ACCEPTANCE、BLOCKED 或 ROUTE_REVIEW。候选仍是生成模板，尚非可用美的解析器。

## 官方入口发现

1. Ego Lite 独立任务空间 49 打开配置入口 `https://campus.midea.com/`，显示“意外终止了连接”、`ERR_CONNECTION_CLOSED`。这不是岗位过期或登录证据。
2. 仅一次搜索“美的集团 官网 招聘”，搜索结果提供 `https://www.midea.com.cn/zh/careers` 导航线索。未把搜索结果作为岗位证据。
3. 读取该官网“加入美的”页：正文明确美的集团、页脚“©2026美的集团股份有限公司版权所有”。初始 document.body 暂未形成，等待同一页面渲染后可读；没有再次导航或重试接口。
4. “应届毕业生招聘”链接的原始属性和绝对 href 都是 `https://careers.midea.com/schoolOut/home`。直接打开这个实际 href，页面标题“美的集团-校园招聘官网”，正文“美的集团 2027 届校园招聘”，提供应届博士、应届生、实习生入口。
5. 同页正常加载观察到公开语言配置 API，详见 ROUTE_REVIEW.json。另观察到项目列表 XHR：`https://careers.midea.com/backend/school/position/common/project/list?status=1&projectTypes=1,2,9,5&employementCategories=1,4&_ihr_log_trackId=5bc8d039-1ede-4af2-b72c-aae83179fe10`。这仅为请求地址证据，未捕获/重放响应，未宣称其为岗位列表。

只读恢复预算：一次搜索、两个官网/导航页面；岗位列表读取 0 页、详情 0 页。没有点击投递、读取个人接口正文或保存完整响应。页面“登录”导航按钮未作为登录阻塞；未遇验证码。

## 路线审核

`ROUTE_REVIEW.json` 申请入口 `https://careers.midea.com/schoolOut/home`，精确域名 `careers.midea.com`、`apiprod.midea.com`。后者是已观察的前端语言配置依赖。分析/客服请求未作为职位来源，也未申请授权。若后续采用 browserListing，须另核实必要资源域名，新增范围仍需审核。

当前唯一待处理事项是平台路线审核，不添加独立的入口发现 BLOCKED.md。原入口连接问题已通过真实官方链接找到替代入口；新入口未获生产授权，按 SOP 停止开发。未据未经授权的响应编写固定解析器；公共 ATS 复用类型、岗位 schema、分页和详情路线尚未确认。

## 离线检查（只验证已有模板）

以下命令均退出 0：

- `node plugin-audit.mjs plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df` → audit clean。
- `node plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs` → provider fixture smoke ok。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/index.mjs`。
- `node --check plugins.local/company-c6db03fe-0829-475c-9d0b-e19cd68113df/test/smoke.mjs`。

这是平台生成模板的零网络 fixture 检查，示例岗位不是生产结果。没有真实固定解析器的测试结论，不能据此宣称适配完成。生产模块未导入 fixture。

## 真实详情抽查

未执行；标题、字符串编号与职责匹配均未验证。没有任何已验证真实岗位样本。

## 启用及页面验收

未执行、未安装、保持禁用。未运行 scan、verify-portals、批量扫描、AI 评估或申请流程；未修改旧版本、配置、绑定或信任文件。

平台批准路线后续接此候选，保持申请 JSON 原样；再补确定性解析器、严格异常/重复 ID/分页等零网络测试（assert 导入使用 node:assert 的 strict）、一页真实列表和最多三个详情，重新运行 audit 和语法检查。完成后由平台独立验收，失败保留旧版本。
