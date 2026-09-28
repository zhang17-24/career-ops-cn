---
name: career-ops-provider-jd-campus
description: Operate the deterministic 京东 recruitment-source adapter.
license: MIT
---

# 京东 recruitment source

This plugin only reads public job listings from `campus.jd.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable jd-campus --confirm`
- Disable without deleting: `node plugins.mjs disable jd-campus`
- Uninstall: `node plugins.mjs remove jd-campus`
- Bind it by setting `provider: jd-campus` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
