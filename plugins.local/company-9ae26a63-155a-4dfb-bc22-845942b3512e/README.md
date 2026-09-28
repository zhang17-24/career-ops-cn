# 金山办公招聘源候选

使用平台通用 browserListing 固定 DOM reader，读取批准的 Moka 校招项目第一页，运行零模型 Token。生产代码仅委托 ctx.browserJobs 并校验官方链接与字符串编号，测试 fixture 不参与正式结果。

仅供金山办公，禁止扩大到其他租户。候选保持禁用，平台独立验收通过后才安装绑定。开发证据见 ACCEPTANCE.md；历史 HTTP 失败记录已归档。

验证：`node plugins.local/company-9ae26a63-155a-4dfb-bc22-845942b3512e/test/smoke.mjs`。离线测试依赖本 checkout 的平台 reader 契约，不调用网络。
