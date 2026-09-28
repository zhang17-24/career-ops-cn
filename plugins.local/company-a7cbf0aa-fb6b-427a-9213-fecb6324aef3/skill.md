---
name: career-ops-provider-company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3
description: Read 百度 public campus recruitment first-page SSR data deterministically.
license: MIT
---

# 百度招聘源

仅读取批准的 talent.baidu.com 校招首屏，最多 10 条；不翻页、不调用模型、不提交申请。运行通过平台 ctx.fetch 获取官方 HTML，严格解析内嵌 listData。

此候选属于企业托管任务，保持停用。由平台独立核验真实列表与三个详情后安装绑定；不要手动修改绑定或信任。

网站要求登录或验证码时停止交给用户；结构变化或请求失败须报错，不返回示例岗位。证据及已知范围见 ACCEPTANCE.md。
