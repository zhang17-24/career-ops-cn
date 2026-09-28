---
name: career-ops-provider-company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e
description: Operate the deterministic 帆软 recruitment-source adapter.
license: MIT
---

# 帆软 recruitment source

This plugin only reads public job listings from `join.fanruan.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e --confirm`
- Disable without deleting: `node plugins.mjs disable company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e`
- Uninstall: `node plugins.mjs remove company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e`
- Bind it by setting `provider: company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
