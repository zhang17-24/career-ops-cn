---
name: career-ops-provider-company-210af4de-c4b0-4fe9-abea-82d2ee905e18
description: Operate the deterministic 新浪微博 recruitment-source adapter.
license: MIT
---

# 新浪微博 recruitment source

This plugin only reads public job listings from `career.sina.com.cn`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-210af4de-c4b0-4fe9-abea-82d2ee905e18 --confirm`
- Disable without deleting: `node plugins.mjs disable company-210af4de-c4b0-4fe9-abea-82d2ee905e18`
- Uninstall: `node plugins.mjs remove company-210af4de-c4b0-4fe9-abea-82d2ee905e18`
- Bind it by setting `provider: company-210af4de-c4b0-4fe9-abea-82d2ee905e18` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
