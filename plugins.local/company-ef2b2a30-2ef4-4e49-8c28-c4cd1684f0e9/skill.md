---
name: career-ops-provider-company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9
description: Operate the deterministic 腾讯 recruitment-source adapter.
license: MIT
---

# 腾讯 recruitment source

This plugin only reads public job listings from `join.qq.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9 --confirm`
- Disable without deleting: `node plugins.mjs disable company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9`
- Uninstall: `node plugins.mjs remove company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9`
- Bind it by setting `provider: company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
