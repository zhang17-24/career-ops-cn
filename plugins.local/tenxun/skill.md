---
name: career-ops-provider-tenxun
description: Operate the deterministic 腾讯 recruitment-source adapter.
license: MIT
---

# 腾讯 recruitment source

This plugin only reads public job listings from `join.qq.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable tenxun --confirm`
- Disable without deleting: `node plugins.mjs disable tenxun`
- Uninstall: `node plugins.mjs remove tenxun`
- Bind it by setting `provider: tenxun` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
