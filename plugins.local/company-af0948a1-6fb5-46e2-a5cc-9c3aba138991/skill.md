---
name: career-ops-provider-company-af0948a1-6fb5-46e2-a5cc-9c3aba138991
description: Operate the deterministic 百度 recruitment-source adapter.
license: MIT
---

# 百度 recruitment source

This plugin only reads public job listings from `talent.baidu.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-af0948a1-6fb5-46e2-a5cc-9c3aba138991 --confirm`
- Disable without deleting: `node plugins.mjs disable company-af0948a1-6fb5-46e2-a5cc-9c3aba138991`
- Uninstall: `node plugins.mjs remove company-af0948a1-6fb5-46e2-a5cc-9c3aba138991`
- Bind it by setting `provider: company-af0948a1-6fb5-46e2-a5cc-9c3aba138991` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
