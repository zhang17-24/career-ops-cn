---
name: career-ops-provider-company-dbbe8943-7e93-449c-bef8-1e820597a1e2
description: Operate the deterministic 小红书 recruitment-source adapter.
license: MIT
---

# 小红书 recruitment source

This plugin only reads public job listings from `job.xiaohongshu.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-dbbe8943-7e93-449c-bef8-1e820597a1e2 --confirm`
- Disable without deleting: `node plugins.mjs disable company-dbbe8943-7e93-449c-bef8-1e820597a1e2`
- Uninstall: `node plugins.mjs remove company-dbbe8943-7e93-449c-bef8-1e820597a1e2`
- Bind it by setting `provider: company-dbbe8943-7e93-449c-bef8-1e820597a1e2` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
