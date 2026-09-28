---
name: career-ops-provider-company-7c6cead4-b646-4a36-9c35-a26ae021da9d
description: Operate the deterministic 搜狐 recruitment-source adapter.
license: MIT
---

# 搜狐 recruitment source

This plugin only reads public job listings from `hr.sohu.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-7c6cead4-b646-4a36-9c35-a26ae021da9d --confirm`
- Disable without deleting: `node plugins.mjs disable company-7c6cead4-b646-4a36-9c35-a26ae021da9d`
- Uninstall: `node plugins.mjs remove company-7c6cead4-b646-4a36-9c35-a26ae021da9d`
- Bind it by setting `provider: company-7c6cead4-b646-4a36-9c35-a26ae021da9d` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
