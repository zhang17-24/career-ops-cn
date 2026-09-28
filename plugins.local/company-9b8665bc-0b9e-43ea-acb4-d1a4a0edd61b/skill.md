---
name: career-ops-provider-company-9b8665bc-0b9e-43ea-acb4-d1a4a0edd61b
description: Read the public Tencent campus list deterministically.
license: MIT
---

# 腾讯招聘源

仅通过 join.qq.com 的公开 HTTP 响应读取 2027 校园招聘第一页，固定最多 10 条。
不调用模型、不投递、不保存凭证。遇登录或验证码立即停止并交由用户处理。
这是托管候选，保持停用；安装、绑定和启用由平台独立验收后完成。
核验证据与限制见 ACCEPTANCE.md；离线测试运行 node test/smoke.mjs。
