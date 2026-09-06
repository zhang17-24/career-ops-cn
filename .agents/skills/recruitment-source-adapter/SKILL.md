---
name: recruitment-source-adapter
description: 为 career-ops-cn 的企业招聘官网创建、修复或扩展可插拔的零 Token provider 适配器。适用于“适配这个招聘源”“让该企业可自动读取”“新增招聘抓取器”等请求；不用于实际扫描岗位或自动投递。
---

# 招聘源适配器

目标是把一个企业招聘官网变成可安装、可停用、可卸载的确定性 provider。开发时可以使用 Agent；适配器运行时只能通过普通 HTTP 和固定解析规则读取数据，不调用模型。

## 工作边界

- 不运行全量或批量岗位扫描。只对用户指定的一个招聘源进行最小验证。
- 不提交申请、不填写投递表单、不联系任何人。
- 遇到登录、短信验证或验证码，立即把 Ego Lite 控制权交给用户。不得绕过。
- 优先公开 JSON/XHR；其次读取公开 HTML。不要依赖搜索引擎结果页。
- 只访问目标招聘域名和它实际调用的公开 API 域名，并写入 `manifest.json` 的 `allowedHosts`。
- 不把 Cookie、Token、响应中的个人信息或完整生产响应提交到仓库。

## 创建流程

1. 从 `portals.yml` 找到用户指定企业的 `careers_url`，只处理这一家。
2. 使用 Ego Lite 打开该页面。观察页面结构和公开网络请求，确认职位列表、分页、职位详情链接、地点和发布时间字段。
3. 判断适配类型：公共招聘系统尽量做一个可复用适配器；企业自建 API 才做企业专用适配器。
4. 创建模板：

   `node plugins.mjs new-provider <id> --host <api-host> --company <企业名>`

5. 修改 `plugins.local/<id>/index.mjs`。返回规范化 `Job[]`：`title`、绝对 `url`、`company`、`location`，可选 `postedAt` 和 `description`。
6. 用脱敏的最小内存 fixture 更新 `test/smoke.mjs`，不得在测试中访问网络。运行该测试和静态检查。
7. 适配器默认保持停用。只有用户明确要求启用时，才执行 `node plugins.mjs enable <id> --confirm`，并给对应企业配置 `provider: <id>` 与必要的 `api` 字段。
8. 若用户明确要求在线验证，只请求一页并设置严格上限；不得触发其他企业扫描。

## 完成标准

- 插件清单只声明必要域名，不要求模型密钥。
- fixture 测试能证明字段映射、空结果和异常数据不会产生伪岗位。
- 启用、停用和卸载分别使用现有命令：
  - `node plugins.mjs enable <id> --confirm`
  - `node plugins.mjs disable <id>`
  - `node plugins.mjs remove <id>`
- 告知用户：日常读取零 Token；本次 Agent 开发会消耗一次开发 Token。
