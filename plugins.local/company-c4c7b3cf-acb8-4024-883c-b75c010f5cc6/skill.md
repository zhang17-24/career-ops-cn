---
name: career-ops-provider-company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6
description: Operate the deterministic 搜狐 recruitment-source adapter.
license: MIT
---

# 搜狐 recruitment source

This plugin only reads public job listings from `hr.sohu.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6 --confirm`
- Disable without deleting: `node plugins.mjs disable company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6`
- Uninstall: `node plugins.mjs remove company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6`
- Bind it by setting `provider: company-c4c7b3cf-acb8-4024-883c-b75c010f5cc6` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
