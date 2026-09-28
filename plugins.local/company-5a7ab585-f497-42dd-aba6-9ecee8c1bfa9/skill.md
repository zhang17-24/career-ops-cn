---
name: career-ops-provider-company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9
description: Operate the deterministic 蚂蚁集团 recruitment-source adapter.
license: MIT
---

# 蚂蚁集团 recruitment source

This plugin only reads public job listings from `talent.antgroup.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9 --confirm`
- Disable without deleting: `node plugins.mjs disable company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9`
- Uninstall: `node plugins.mjs remove company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9`
- Bind it by setting `provider: company-5a7ab585-f497-42dd-aba6-9ecee8c1bfa9` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
