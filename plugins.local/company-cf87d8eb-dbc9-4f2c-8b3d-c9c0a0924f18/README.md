# 宁德时代校招 Moka 适配器

使用平台 browserListing 固定 DOM reader，生产仅调用 ctx.browserJobs；无模型、无缓存或 fixture 兜底。保留原始字段并从官网 #/job/ 路由提取字符串编号，重复编号或结构变化报错。

仅首屏，不点击或翻页；本次观察30条，平台上限100条。依赖平台匿名 Chromium 与精确域名许可。选择器来自2026-09-13公开DOM，网站更新时需重新核验。无发布日期或描述字段输出。

离线检查：node plugins.local/company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18/test/smoke.mjs

候选未启用；开发证据见 ACCEPTANCE.md。平台独立验收通过才安装并绑定。
