# career-ops-plugin-jd-campus

Deterministic, zero-token recruitment provider for 京东 (`campus.jd.com`).

Reads the campus (校招) job board via JD's own public SPA API with fixed parsing only — no model calls.

- List: `POST https://campus.jd.com/api/wx/position/page?type=present`
- Body: `{"pageSize":10,"pageIndex":0,"parameter":{"positionName":"","planIdList":[],"jobDirectionCodeList":[],"workCityCodeList":[],"positionDeptList":[]}}`
- Detail route: `https://campus.jd.com/#/details?id=<publishId>` (the list payload already carries the full JD, so no per-job detail request is needed)
- `publishId` is kept as a string; `location` is the deduped province list from `requirementVoList[].workCity`.

Configure an override (`api`, `positionType`, `keywords`, `max_pages`) per company in `portals.yml`. Bind it by setting `provider: jd-campus` on the company entry, then enable with `node plugins.mjs enable jd-campus --confirm`.

See `ACCEPTANCE.md` for validation (offline fixture + real detail checks) and `test/smoke.mjs` for the zero-network fixture test.
