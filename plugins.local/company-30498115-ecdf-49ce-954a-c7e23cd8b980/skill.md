---
name: career-ops-provider-company-30498115-ecdf-49ce-954a-c7e23cd8b980
description: Operate the deterministic 网易 recruitment-source adapter.
license: MIT
---

# 网易 recruitment source

This plugin only reads public job listings from `campus.163.com`. It never calls a language model and never submits applications.

- Enable: `node plugins.mjs enable company-30498115-ecdf-49ce-954a-c7e23cd8b980 --confirm`
- Disable without deleting: `node plugins.mjs disable company-30498115-ecdf-49ce-954a-c7e23cd8b980`
- Uninstall: `node plugins.mjs remove company-30498115-ecdf-49ce-954a-c7e23cd8b980`
- Bind it by setting `provider: company-30498115-ecdf-49ce-954a-c7e23cd8b980` on the company in `portals.yml`.

If the site requires login or a CAPTCHA, stop and hand browser control to the user. Never bypass either.
