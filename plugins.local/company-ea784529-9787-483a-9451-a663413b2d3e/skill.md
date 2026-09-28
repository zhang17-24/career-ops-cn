---
name: career-ops-provider-company-ea784529-9787-483a-9451-a663413b2d3e
description: Operate the deterministic 比亚迪 recruitment-source adapter.
license: MIT
---

# 比亚迪 recruitment source

This plugin only reads public job listings from `job.byd.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-ea784529-9787-483a-9451-a663413b2d3e --confirm`
- Disable without deleting: `node plugins.mjs disable company-ea784529-9787-483a-9451-a663413b2d3e`
- Uninstall: `node plugins.mjs remove company-ea784529-9787-483a-9451-a663413b2d3e`
- Bind it by setting `provider: company-ea784529-9787-483a-9451-a663413b2d3e` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
