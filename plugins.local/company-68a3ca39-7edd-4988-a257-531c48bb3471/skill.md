---
name: career-ops-provider-company-68a3ca39-7edd-4988-a257-531c48bb3471
description: Operate the deterministic 哔哩哔哩 recruitment-source adapter.
license: MIT
---

# 哔哩哔哩 recruitment source

This plugin only reads public job listings from `jobs.bilibili.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-68a3ca39-7edd-4988-a257-531c48bb3471 --confirm`
- Disable without deleting: `node plugins.mjs disable company-68a3ca39-7edd-4988-a257-531c48bb3471`
- Uninstall: `node plugins.mjs remove company-68a3ca39-7edd-4988-a257-531c48bb3471`
- Bind it by setting `provider: company-68a3ca39-7edd-4988-a257-531c48bb3471` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
