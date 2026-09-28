---
name: career-ops-provider-company-ec6099d0-9c3a-4680-89b7-4133f2f16d10
description: Operate the deterministic 智谱AI recruitment-source adapter.
license: MIT
---

# 智谱AI recruitment source

This plugin only reads public job listings from `campus.zhipuai.cn`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-ec6099d0-9c3a-4680-89b7-4133f2f16d10 --confirm`
- Disable without deleting: `node plugins.mjs disable company-ec6099d0-9c3a-4680-89b7-4133f2f16d10`
- Uninstall: `node plugins.mjs remove company-ec6099d0-9c3a-4680-89b7-4133f2f16d10`
- Bind it by setting `provider: company-ec6099d0-9c3a-4680-89b7-4133f2f16d10` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
