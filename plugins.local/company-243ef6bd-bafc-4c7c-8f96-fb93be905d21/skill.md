---
name: career-ops-provider-company-243ef6bd-bafc-4c7c-8f96-fb93be905d21
description: Operate the deterministic 吉比特 recruitment-source adapter.
license: MIT
---

# 吉比特公开校招源

只读取批准的 joinserverfast.g-bits.com 公开列表接口第一页，最多20条；官网展开列表位于 hr.g-bits.com。不调用模型，不提交申请。字段映射、限制和真实样本见 ACCEPTANCE.md。

打开官网后点击同名岗位展开。URL中的careerops-id为平台身份元数据，不是官网详情路径或自动展开承诺；不同ID的同名岗位保留。

本候选由平台管理，保持禁用，独立验收通过后由平台安装绑定。不要手动修改配置、信任或旧版。失败保留旧绑定。登录、短信验证或验证码出现时立即停止并交给用户，不绕过。
