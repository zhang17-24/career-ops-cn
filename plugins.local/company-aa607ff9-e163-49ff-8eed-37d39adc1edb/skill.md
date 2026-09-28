---
name: career-ops-provider-company-aa607ff9-e163-49ff-8eed-37d39adc1edb
description: 携程校招首屏公开 HTTP 固定解析适配器。
license: MIT
---

仅处理携程公开校招列表，首屏最多10条，不调用模型、不投递、不读取凭证。
错误或结构变化抛错，不以空列表或测试数据兜底。真实空列表必须 total=0。
候选停用，交由企业托管平台独立核验；不得自行修改配置、绑定、信任或启用。
遇登录或验证码停止并交用户接管。验收证据见 ACCEPTANCE.md。
