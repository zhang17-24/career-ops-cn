---
name: career-ops-provider-company-0665c18e-2310-43c5-91d3-f7f37effec03
description: Operate the deterministic 京东 recruitment-source adapter.
license: MIT
---

# 京东 recruitment source

This plugin only reads public job listings from `campus.jd.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-0665c18e-2310-43c5-91d3-f7f37effec03 --confirm`
- Disable without deleting: `node plugins.mjs disable company-0665c18e-2310-43c5-91d3-f7f37effec03`
- Uninstall: `node plugins.mjs remove company-0665c18e-2310-43c5-91d3-f7f37effec03`
- Bind it by setting `provider: company-0665c18e-2310-43c5-91d3-f7f37effec03` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
