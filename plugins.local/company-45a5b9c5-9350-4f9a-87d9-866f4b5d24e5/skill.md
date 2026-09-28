---
name: career-ops-provider-company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5
description: Operate the deterministic 虎牙 recruitment-source adapter.
license: MIT
---

# 虎牙 recruitment source

This plugin only reads public job listings from `hr.huya.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5 --confirm`
- Disable without deleting: `node plugins.mjs disable company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5`
- Uninstall: `node plugins.mjs remove company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5`
- Bind it by setting `provider: company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
