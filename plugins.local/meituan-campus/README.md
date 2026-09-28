# career-ops-plugin-meituan-campus

Deterministic, zero-token recruitment provider for 美团 校招 (`zhaopin.meituan.com/web/campus`).

Reads the public campus board POST API (`/api/official/job/getJobList`, jobType code 1+2) and maps each job to a normalized `Job[]` with the detail route `https://zhaopin.meituan.com/web/position/detail?jobUnionId=<id>&highlightType=campus`. No model calls, no auth, no per-job detail request.

Runtime behavior is HTTP + fixed parsing only. `jobUnionId` is kept as a string and never coerced through `Number`.

- Enable: `node plugins.mjs enable meituan-campus --confirm`
- Disable: `node plugins.mjs disable meituan-campus`
- Uninstall: `node plugins.mjs remove meituan-campus`
- Bind: set `provider: meituan-campus` on the company in `portals.yml`.

Offline fixture test: `node plugins.local/meituan-campus/test/smoke.mjs`.

See `ACCEPTANCE.md` for live-route evidence, the observed listing request, the 3 verified detail pages, and the outstanding activation/page-acceptance step.
