# 小鹏汽车招聘源候选

复用平台 browserListing 固定 DOM reader，读取飞书校招官网第一页（当前每页 10 条），不翻页。生产只调用 ctx.browserJobs(entry)，无模型、缓存岗位或 mock 回退。仅适配本企业。

真实编号保留在官方 URL 中；URL 末段是 detail，故不输出不符合平台编号契约的 id 字段。地点使用官网原文，不推测发布时间或描述。

候选保持禁用。平台独立匿名验收列表及三个详情，通过后才安装并切换绑定。测试及抽查见 ACCEPTANCE.md。
