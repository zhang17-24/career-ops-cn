---
name: career-ops-provider-kuaishou-campus
description: Operate the deterministic 快手 recruitment-source adapter.
license: MIT
---

# 快手 recruitment source

This plugin only reads public job listings from `campus.kuaishou.cn`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable kuaishou-campus --confirm`
- Disable without deleting: `node plugins.mjs disable kuaishou-campus`
- Uninstall: `node plugins.mjs remove kuaishou-campus`
- Bind it by setting `provider: kuaishou-campus` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
