---
name: career-ops-provider-company-e3452584-5386-41af-9751-be88c78767f3
description: Operate the deterministic 名创优品 recruitment-source adapter.
license: MIT
---

# 名创优品 recruitment source

This plugin only reads public job listings from `campus.miniso.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-e3452584-5386-41af-9751-be88c78767f3 --confirm`
- Disable without deleting: `node plugins.mjs disable company-e3452584-5386-41af-9751-be88c78767f3`
- Uninstall: `node plugins.mjs remove company-e3452584-5386-41af-9751-be88c78767f3`
- Bind it by setting `provider: company-e3452584-5386-41af-9751-be88c78767f3` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
