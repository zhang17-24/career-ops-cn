---
name: career-ops-provider-company-b8bd62c1-c77f-421a-a565-63ffb577ed40
description: Operate the deterministic 哔哩哔哩 recruitment-source adapter.
license: MIT
---

# 哔哩哔哩 recruitment source

This plugin only reads public job listings from `jobs.bilibili.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-b8bd62c1-c77f-421a-a565-63ffb577ed40 --confirm`
- Disable without deleting: `node plugins.mjs disable company-b8bd62c1-c77f-421a-a565-63ffb577ed40`
- Uninstall: `node plugins.mjs remove company-b8bd62c1-c77f-421a-a565-63ffb577ed40`
- Bind it by setting `provider: company-b8bd62c1-c77f-421a-a565-63ffb577ed40` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
