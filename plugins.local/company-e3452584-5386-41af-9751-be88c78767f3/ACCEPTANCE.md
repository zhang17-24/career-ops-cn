# 名创优品候选开发验收记录

候选：`company-e3452584-5386-41af-9751-be88c78767f3`。核验日期：2026-09-19。

## 来源、范围与方法

- 配置入口 `https://campus.miniso.com/` 已失效：DNS 无记录，Ego Lite 打开返回 `ERR_CONNECTION_CLOSED`，curl 经代理返回 502 CONNECT tunnel failed。因此启动 SOP「招聘入口发现与域名审核」流程。
- 一次官方搜索确认：WebSearch 返回「名创优品招聘官网 https://miniso.zhiye.com/」及北森校园招聘详情链接。
- 官方首页链接：Ego Lite 打开中文官网 `https://www.miniso.cn/`，页面标题含「名创优品MINISO」，可见「招聘」锚点，原始 href 与解析后绝对 href 均为 `https://miniso.zhiye.com/`。
- 招聘官网身份：Ego Lite 打开 `https://miniso.zhiye.com/`，标题为「名创优品招聘官网」。SPA 在当前 Ego 环境中未渲染出可见岗位卡片（脚本加载后 body 为空壳），但公开接口可用。
- 仅读取一页校招列表、未翻页、未投递；未运行 scan.mjs/verify-portals.mjs/批量扫描/AI 评估。

## 公开接口与固定解析

- 列表端点：`POST https://miniso.zhiye.com/api/Jobad/GetJobAdPageList`
- 请求体与北森公开校招 schema 一致：

```json
{"PageIndex":0,"PageSize":20,"Category":["2"],"KeyWords":"","SpecialType":0,"PortalId":"","DisplayFields":["Category","Kind","LocId","WorkWeChatQrCode"]}
```

- 匿名 HTTP 返回 200，Code=200，Count=30，Data=20 条；所有样本 CategoryId='2'、Status=1；id 字段为 UUID 字符串。
- 字段映射：Id→id（字符串）；JobAdName→title；LocNames→location；Duty+Require→description；company 固定为「名创优品」；detail URL 采用 `/campus/detail?jobAdId=<Id>`（北森校园标准路由）。不写 postedAt（列表 PostDate 为占位值）。
- 解析器拒绝异常 schema、重复 ID、非活动/非校招记录及缺失职责；仅返回 20 条第一页。

## 离线测试

- `node --check` 通过 `index.mjs` 与 `test/smoke.mjs`。
- `node plugin-audit.mjs plugins.local/company-e3452584-5386-41af-9751-be88c78767f3` 通过（无非法导入、无全局 fetch、无敏感词）。
- `node plugins.local/company-e3452584-5386-41af-9751-be88c78767f3/test/smoke.mjs` 通过。

## 真实详情抽查

- 仅通过匿名 HTTP 访问一条详情 URL `https://miniso.zhiye.com/campus/detail?jobAdId=d37d3b2f-2a99-4449-865f-6ff6c896af2b`，返回 200 但页面为北森 SPA 空壳（仅有 BSGlobal 配置，无可见职责正文），未能在 Ego Lite 中渲染；按 SOP 标记为「待确认/空壳」，不构成三条详情验收。
- 平台独立验收阶段需在已批准路线上重新读取列表并核对三个真实详情。

## 路线审核状态

- 招聘域名已从 `campus.miniso.com` 变更为 `miniso.zhiye.com`（北森公共 ATS）。
- 当前平台路线记录仅批准 `campus.miniso.com`；新域名 `miniso.zhiye.com` 尚未获批。
- 已按 SOP 在候选目录写入 `ROUTE_REVIEW.json`，并写 `BLOCKED.md` 等待用户审核新路线。
- 候选保持 DISABLED，未修改绑定/信任配置。
