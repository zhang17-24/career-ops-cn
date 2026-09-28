---
name: career-ops-provider-company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6
description: Operate the deterministic 唯品会 recruitment-source adapter.
license: MIT
---

# 唯品会 recruitment source

This plugin only reads public job listings from `app-tc.mokahr.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6 --confirm`
- Disable without deleting: `node plugins.mjs disable company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6`
- Uninstall: `node plugins.mjs remove company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6`
- Bind it by setting `provider: company-65f17e44-48c6-4c1e-9cdf-67b4743e1bb6` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
