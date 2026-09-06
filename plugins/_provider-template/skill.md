---
name: career-ops-provider-{{NAME}}
description: Operate the deterministic {{COMPANY}} recruitment-source adapter.
license: MIT
---

# {{COMPANY}} recruitment source

This plugin only reads public job listings from `{{HOST}}`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable {{NAME}} --confirm`
- Disable without deleting: `node plugins.mjs disable {{NAME}}`
- Uninstall: `node plugins.mjs remove {{NAME}}`
- Bind it by setting `provider: {{NAME}}` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
