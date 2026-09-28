---
name: career-ops-provider-meituan-campus
description: Operate the deterministic 美团 recruitment-source adapter.
license: MIT
---

# 美团 recruitment source

This plugin only reads public job listings from `zhaopin.meituan.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable meituan-campus --confirm`
- Disable without deleting: `node plugins.mjs disable meituan-campus`
- Uninstall: `node plugins.mjs remove meituan-campus`
- Bind it by setting `provider: meituan-campus` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
