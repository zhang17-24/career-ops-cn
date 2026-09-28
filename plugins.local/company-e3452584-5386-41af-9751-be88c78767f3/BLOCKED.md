# BLOCKED：等待路线审核

## 阻塞原因

名创优品招聘入口域名已从配置中的 `campus.miniso.com`（DNS 无记录、连接关闭）变更为官方招聘门户 `miniso.zhiye.com`（北森 ATS）。新域名不在当前平台批准的路线记录 `{"allowedHosts":["campus.miniso.com"]}` 内。

当前运行模式为「逐次审核模式」，新入口/额外域名必须提交 `ROUTE_REVIEW.json` 并停止开发，等待用户审核。

## 已完成的只读发现证据

1. 官方中文官网 `https://www.miniso.cn/` 可见「招聘」链接，指向 `https://miniso.zhiye.com/`。
2. 招聘官网标题为「名创优品招聘官网」。
3. 匿名 POST `https://miniso.zhiye.com/api/Jobad/GetJobAdPageList` 返回 200，Code=200，Count=30，Data=20 条，字段符合北森公开校招 schema。
4. 详情 URL 格式为 `https://miniso.zhiye.com/campus/detail?jobAdId=<Id>`。

## 待用户/平台动作

- 在平台企业 → 适配器设置中审核 `ROUTE_REVIEW.json` 的新路线（`miniso.zhiye.com`）。
- 路线批准后，平台可独立执行一页列表与三个真实详情验收；候选代码已准备就绪。

## 不适用继续开发的情形

- 未绕过路线审核。
- 未启用插件或修改绑定/信任配置。
- 未在 campus.miniso.com 已失效的情况下继续硬编码旧域名。
