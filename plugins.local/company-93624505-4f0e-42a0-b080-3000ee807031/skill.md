---
name: career-ops-provider-company-93624505-4f0e-42a0-b080-3000ee807031
description: Operate the deterministic 网易 recruitment-source adapter.
license: MIT
---

# 网易 recruitment source

This plugin only reads public job listings from `campus.163.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-93624505-4f0e-42a0-b080-3000ee807031 --confirm`
- Disable without deleting: `node plugins.mjs disable company-93624505-4f0e-42a0-b080-3000ee807031`
- Uninstall: `node plugins.mjs remove company-93624505-4f0e-42a0-b080-3000ee807031`
- Bind it by setting `provider: company-93624505-4f0e-42a0-b080-3000ee807031` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
