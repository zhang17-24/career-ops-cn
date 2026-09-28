// @ts-check
// Deterministic, zero-token provider for 快手 campus recruitment (campus.kuaishou.cn).
// Runtime behavior is HTTP + fixed parsing only — no model calls.
//
// Observed with Ego Lite on the live campus site (2026-09-10):
//   POST /recruit/campus/e/api/v1/open/positions/simple
//   { "recruitSubProjectCodes": ["20271779425607", "20271772783534"],
//     "pageSize": 100, "pageNum": N }
//   → { code, message, result: { total: …, list: […], pageNum, … } }
//   list[i] fields (relevant): name (title), id (numeric — drives the detail route),
//     code (32-char STRING id), workLocationDicts[{name}], description, positionDemand,
//     updateTime (epoch ms = publish date), positionNatureCode, positionCategoryCode,
//     positionStatusCode ("Release" = live), departmentName.
//
// The campus board is split into sub-projects (school fresh-grad + internship). The two
// active codes below are read from the site's own nav links and accepted together in one
// paginated request (combined total 491 as of 2026-09-10).
//
// Detail route (observed by clicking a real card; same-tab hash route):
//   https://campus.kuaishou.cn/#/campus/job-info/<id>
//   (detail API: GET /recruit/campus/e/api/v1/open/positions/find?id=<id>)
// The listing payload already carries the full description + requirements, so this adapter
// builds descriptions from the list and does NOT issue a per-job detail request.

const COMPANY = '快手';
// Public campus list endpoint (POST). Configurable via portals.yml `api`.
const DEFAULT_API = 'https://campus.kuaishou.cn/recruit/campus/e/api/v1/open/positions/simple';
// Public detail page — the list payload carries only a numeric `id` and a string `code`, never a URL.
const DETAIL_PAGE = 'https://campus.kuaishou.cn/#/campus/job-info';
const PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 10;
// A small inter-page pause keeps the scans polite; not evidence of any rate limit.
const INTER_PAGE_DELAY_MS = 200;
// Fresh-grad (应届招聘) + internship (实习招聘) sub-project codes, read from the site's nav.
const DEFAULT_SUBPROJECT_CODES = ['20271779425607', '20271772783534'];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** workLocationDicts items are object(s) like {name: "北京", code: "beijing"} */
function names(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .map(x => (typeof x === 'string' ? x : x && typeof x === 'object' ? clean(x.name) : ''))
    .filter(Boolean)
    .join('/');
}

function toEpochMs(v, fallbackStr) {
  if (typeof v === 'number' && v > 0) return v > 1e12 ? v : v * 1000;
  // Some rows only carry a "YYYY-MM-DD HH:mm:ss" releaseTime string.
  if (typeof fallbackStr === 'string' && fallbackStr.trim()) {
    const parsed = Date.parse(fallbackStr.trim().replace(' ', 'T'));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** @param {string[]} subProjectCodes @param {number} pageNo */
function buildBody(subProjectCodes, pageNo) {
  return JSON.stringify({
    recruitSubProjectCodes: subProjectCodes,
    pageSize: PAGE_SIZE,
    pageNum: pageNo,
  });
}

/**
 * Parse one page of the positions/simple payload. Exported for tests.
 * The string `code` is kept verbatim (never coerced through Number); the numeric `id`
 * is preserved as a string on the output URL so it is not precision-clipped.
 * @param {any} json
 * @param {string} companyName
 * @returns {{ jobs: import('../../plugins/_types.js').Job[], total: number }}
 */
export function parseKuaishouResponse(json, companyName) {
  const list = json?.result?.list;
  const total = Number(json?.result?.total) || 0;
  if (json?.code !== 0 || !Array.isArray(list)) throw new Error('快手接口异常或结构变化');

  const jobs = [];
  for (const p of list) {
    if (!p || typeof p !== 'object') continue;
    const title = clean(p.name);
    const id = p.id;
    const code = clean(p.code);
    // A row must have a title AND a non-empty id/code to produce a viable detail route.
    if (!title || id == null || (typeof id === 'number' && !Number.isSafeInteger(id))) continue;
    if (p.positionStatusCode && p.positionStatusCode !== 'Release') continue;
    const idStr = id == null ? '' : String(id);
    if (idStr === '' && code === '') continue;

    const description = [
      p.positionCategoryCode && `类别: ${clean(p.positionCategoryCode)}`,
      p.positionNatureCode && `性质: ${clean(p.positionNatureCode)}`,
      p.departmentName && `部门: ${clean(p.departmentName)}`,
      code && `职位编号: ${code}`,
      p.description,
      p.positionDemand,
    ].filter(Boolean).join('\n').slice(0, 4000);

    // id drives the observed detail route; code (if present) is the stable string id.
    const url = idStr !== ''
      ? `${DETAIL_PAGE}/${encodeURIComponent(idStr)}`
      : `${DETAIL_PAGE}/${encodeURIComponent(code)}`;

    jobs.push({
      title,
      url,
      company: companyName,
      location: names(p.workLocationDicts),
      postedAt: toEpochMs(p.updateTime, p.releaseTime),
      description,
    });
  }
  return { jobs, total };
}

export default {
  provider: {
    id: 'company-8d6ac54e-88e0-44f1-a512-85b02e158346',
    'fetch': async (entry, ctx) => {
      const api = entry.api || DEFAULT_API;
      const codes = Array.isArray(entry.recruitSubProjectCodes) && entry.recruitSubProjectCodes.length
        ? entry.recruitSubProjectCodes
        : DEFAULT_SUBPROJECT_CODES;
      const entryMaxPages = Number(entry.max_pages) > 0 ? Number(entry.max_pages) : DEFAULT_MAX_PAGES;
      const maxPages = entryMaxPages > 0 ? entryMaxPages : DEFAULT_MAX_PAGES;

      /** @type {Map<string, import('../../plugins/_types.js').Job>} */
      const seen = new Map();
      let firstRequest = true;
      let total = 0;

      for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
        if (firstRequest) firstRequest = false;
        else await sleep(INTER_PAGE_DELAY_MS);

        let payload;
        try {
          payload = await ctx.fetchJson(api, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: buildBody(codes, pageNo),
            redirect: 'error',
          });
        } catch (err) {
          // A dead board should read as a failure; a mid-run blip must not discard
          // what is already collected. Keep the partial result.
          console.error(`  ⚠ company-8d6ac54e-88e0-44f1-a512-85b02e158346: page ${pageNo} failed (${err.message}) — keeping the ${seen.size} jobs collected so far`);
          throw err;
        }

        const parsed = parseKuaishouResponse(payload, entry.name || COMPANY);
        if (parsed.total) total = parsed.total;

        if (parsed.jobs.length === 0) {
          // Legitimately past the end, or a transient empty page. Do not fabricate.
          if (total && (pageNo - 1) * PAGE_SIZE >= total) break;
          continue;
        }

        for (const job of parsed.jobs) {
          if (!seen.has(job.url)) seen.set(job.url, job);
        }

        if (parsed.jobs.length < PAGE_SIZE) break;
        if (total && pageNo * PAGE_SIZE >= total) break;
      }

      return [...seen.values()];
    },
  },
};
