---
name: career-ops-provider-company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0
description: Operate the deterministic 金山办公 recruitment-source adapter.
license: MIT
---

# 金山办公 recruitment source

This plugin only reads public job listings from `join.wps.cn`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0 --confirm`
- Disable without deleting: `node plugins.mjs disable company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0`
- Uninstall: `node plugins.mjs remove company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0`
- Bind it by setting `provider: company-94c1cb3b-915e-46aa-bd87-91993cbfb4c0` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
