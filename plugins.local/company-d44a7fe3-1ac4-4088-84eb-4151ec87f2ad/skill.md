---
name: career-ops-provider-company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad
description: Operate the deterministic 名创优品 recruitment-source adapter.
license: MIT
---

# 名创优品 recruitment source

This plugin only reads public job listings from `campus.miniso.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad --confirm`
- Disable without deleting: `node plugins.mjs disable company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad`
- Uninstall: `node plugins.mjs remove company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad`
- Bind it by setting `provider: company-d44a7fe3-1ac4-4088-84eb-4151ec87f2ad` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
