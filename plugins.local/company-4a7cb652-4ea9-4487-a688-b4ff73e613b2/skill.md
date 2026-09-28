---
name: career-ops-provider-company-4a7cb652-4ea9-4487-a688-b4ff73e613b2
description: Operate the deterministic 京东 recruitment-source adapter.
license: MIT
---

# 京东 recruitment source

This plugin only reads public job listings from `campus.jd.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-4a7cb652-4ea9-4487-a688-b4ff73e613b2 --confirm`
- Disable without deleting: `node plugins.mjs disable company-4a7cb652-4ea9-4487-a688-b4ff73e613b2`
- Uninstall: `node plugins.mjs remove company-4a7cb652-4ea9-4487-a688-b4ff73e613b2`
- Bind it by setting `provider: company-4a7cb652-4ea9-4487-a688-b4ff73e613b2` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
