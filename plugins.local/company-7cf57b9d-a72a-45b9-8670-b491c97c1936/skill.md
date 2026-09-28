---
name: career-ops-provider-company-7cf57b9d-a72a-45b9-8670-b491c97c1936
description: Operate the deterministic 名创优品 recruitment-source adapter.
license: MIT
---

# 名创优品 recruitment source

This plugin only reads public job listings from `campus.miniso.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-7cf57b9d-a72a-45b9-8670-b491c97c1936 --confirm`
- Disable without deleting: `node plugins.mjs disable company-7cf57b9d-a72a-45b9-8670-b491c97c1936`
- Uninstall: `node plugins.mjs remove company-7cf57b9d-a72a-45b9-8670-b491c97c1936`
- Bind it by setting `provider: company-7cf57b9d-a72a-45b9-8670-b491c97c1936` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
