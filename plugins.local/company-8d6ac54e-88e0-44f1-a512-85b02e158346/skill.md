---
name: career-ops-provider-company-8d6ac54e-88e0-44f1-a512-85b02e158346
description: Operate the deterministic 快手 recruitment-source adapter.
license: MIT
---

# 快手 recruitment source

This plugin only reads public job listings from `campus.kuaishou.cn`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-8d6ac54e-88e0-44f1-a512-85b02e158346 --confirm`
- Disable without deleting: `node plugins.mjs disable company-8d6ac54e-88e0-44f1-a512-85b02e158346`
- Uninstall: `node plugins.mjs remove company-8d6ac54e-88e0-44f1-a512-85b02e158346`
- Bind it by setting `provider: company-8d6ac54e-88e0-44f1-a512-85b02e158346` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
