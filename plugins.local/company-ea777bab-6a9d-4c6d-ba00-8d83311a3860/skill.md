---
name: career-ops-provider-company-ea777bab-6a9d-4c6d-ba00-8d83311a3860
description: Operate the deterministic 名创优品 recruitment-source adapter.
license: MIT
---

# 名创优品 recruitment source

This plugin only reads public job listings from `campus.miniso.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-ea777bab-6a9d-4c6d-ba00-8d83311a3860 --confirm`
- Disable without deleting: `node plugins.mjs disable company-ea777bab-6a9d-4c6d-ba00-8d83311a3860`
- Uninstall: `node plugins.mjs remove company-ea777bab-6a9d-4c6d-ba00-8d83311a3860`
- Bind it by setting `provider: company-ea777bab-6a9d-4c6d-ba00-8d83311a3860` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
