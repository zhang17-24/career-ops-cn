---
name: career-ops-provider-company-56286487-d911-4432-9a84-da8a2a66dc74
description: Operate the deterministic 唯品会 recruitment-source adapter.
license: MIT
---

# 唯品会 recruitment source

This plugin only reads public job listings from `app-tc.mokahr.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-56286487-d911-4432-9a84-da8a2a66dc74 --confirm`
- Disable without deleting: `node plugins.mjs disable company-56286487-d911-4432-9a84-da8a2a66dc74`
- Uninstall: `node plugins.mjs remove company-56286487-d911-4432-9a84-da8a2a66dc74`
- Bind it by setting `provider: company-56286487-d911-4432-9a84-da8a2a66dc74` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
