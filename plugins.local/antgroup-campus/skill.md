---
name: career-ops-provider-antgroup-campus
description: Operate the deterministic 蚂蚁集团 recruitment-source adapter.
license: MIT
---

# 蚂蚁集团 recruitment source

This plugin only reads public job listings from `hrcareersweb.antgroup.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable antgroup-campus --confirm`
- Disable without deleting: `node plugins.mjs disable antgroup-campus`
- Uninstall: `node plugins.mjs remove antgroup-campus`
- Bind it by setting `provider: antgroup-campus` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
