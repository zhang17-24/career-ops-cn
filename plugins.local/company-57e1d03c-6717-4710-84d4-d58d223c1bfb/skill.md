---
name: career-ops-provider-company-57e1d03c-6717-4710-84d4-d58d223c1bfb
description: Operate the deterministic 三六零 recruitment-source adapter.
license: MIT
---

# 三六零 recruitment source

This plugin only reads public job listings from `360campus.zhiye.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-57e1d03c-6717-4710-84d4-d58d223c1bfb --confirm`
- Disable without deleting: `node plugins.mjs disable company-57e1d03c-6717-4710-84d4-d58d223c1bfb`
- Uninstall: `node plugins.mjs remove company-57e1d03c-6717-4710-84d4-d58d223c1bfb`
- Bind it by setting `provider: company-57e1d03c-6717-4710-84d4-d58d223c1bfb` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
