// @ts-check
// Deterministic, zero-token provider for 京东 campus recruitment (campus.jd.com).
// Runtime behavior is HTTP + fixed parsing only — no model calls.
//
// Observed with Ego Lite on the live campus SPA (2026-09-10):
//   POST /api/wx/position/page?type=present
//   { "pageSize": 10, "pageIndex": 0,
//     "parameter": { "positionName": "", "planIdList": [], "jobDirectionCodeList": [],
//                    "workCityCodeList": [], "positionDeptList": [] } }
//   → { "success": true, "body": { "totalNumber": 126, "pageCount": 0,
//        "items": [ { "publishId": 9329, "reqId": 2464, "positionName": "销售拓展",
//                     "jobDirection": "一线销售方向", "publishTime": 1786938503000,
//                     "workContent": "...", "qualification": "...",
//                     "requirementVoList": [ { "workCity": "上海市-上海市",
//                        "positionBg": "京东物流", "interviewCity": "远程面试", ... } ] } ] } }
//
// pageIndex is 0-based; pagination stops on totalNumber or a short page (pageCount is 0/unreliable).
// The LIST payload already carries the full JD (workContent + qualification) and the per-requirement
// workCity/province, so a single listing request is enough — no per-job detail request is needed.
//
// The detail click route (observed by clicking a real card, which swaps the SPA view under the same
// hash-nav base):  https://campus.jd.com/#/details?id=<publishId>
// detail API (not required by this adapter, but verified): POST /api/wx/position/detail/<publishId>

const COMPANY = '京东';
// Public campus list endpoint (POST). Configurable via portals.yml `api`.
const DEFAULT_API = 'https://campus.jd.com/api/wx/position/page';
// Public job-detail SPA route; the list payload carries only a publishId, never a URL.
const DETAIL_PREFIX = 'https://campus.jd.com/#/details';
const PAGE_SIZE = 10;           // observed pageSize (server honors exactly 10/page)
const DEFAULT_MAX_PAGES = 10;   // 10 * PAGE_SIZE = 100 postings ceiling per keyword
// Observed default board used by the jobs page ("present" = 校招应届 board). Override via
// portals.yml `positionType` if JD splits the boards (tgt / intern / ...) behind other values.
const DEFAULT_POSITION_TYPE = 'present';
// Every request after the first pays it (campus board rate-limits like its social sibling).
const INTER_PAGE_DELAY_MS = 300;

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Extract distinct PROVINCE names from requirementVoList[].workCity.
 * workCity is "province-city" (e.g. "上海市-上海市", "陕西省-西安市"), and scan.mjs's
 * location_filter matches case-insensitive substrings against province/country names, so
 * province-level dedup is both compact and filter-friendly.
 * @param {any} item
 * @returns {string[]}
 */
function extractLocations(item) {
  const reqs = Array.isArray(item.requirementVoList) ? item.requirementVoList : [];
  const seen = new Set();
  const out = [];
  for (const r of reqs) {
    const raw = clean(r && r.workCity);
    if (!raw) continue;
    const province = (raw.split('-')[0] || raw).trim();
    if (province && !seen.has(province)) {
      seen.add(province);
      out.push(province);
    }
  }
  return out;
}

function buildDescription(item) {
  const reqs = Array.isArray(item.requirementVoList) ? item.requirementVoList : [];
  const bg = clean(reqs[0] && reqs[0].positionBg);
  return [
    clean(item.jobDirection) && `方向: ${clean(item.jobDirection)}`,
    bg && `业务: ${bg}`,
    clean(item.workContent),
    clean(item.qualification) && `任职要求:\n${clean(item.qualification)}`,
  ].filter(Boolean).join('\n').slice(0, 4000);
}

function toEpochMs(v) {
  if (v == null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v > 1e12 ? v : v * 1000;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** @param {string} positionType */
function buildListUrl(api, positionType) {
  const sep = api.includes('?') ? '&' : '?';
  return `${api}${sep}type=${encodeURIComponent(positionType)}`;
}

/**
 * @param {string} keyword @param {number} pageIndex 0-based
 */
function buildBody(keyword, pageIndex) {
  return JSON.stringify({
    pageSize: PAGE_SIZE,
    pageIndex,
    parameter: {
      positionName: keyword,
      planIdList: [],
      jobDirectionCodeList: [],
      workCityCodeList: [],
      positionDeptList: [],
    },
  });
}

/**
 * Parse one page of the position/page payload. Exported for tests.
 * publishId is kept as a STRING id (e.g. "9329"); it is never coerced through Number.
 * @param {any} json
 * @param {string} companyName
 * @returns {{ jobs: import('../../plugins/_types.js').Job[], total: number }}
 */
export function parseJdCampusPage(json, companyName) {
  const body = json?.body;
  const items = Array.isArray(body?.items) ? body.items : [];
  const total = Number(body?.totalNumber) || 0;
  if (items.length === 0) return { jobs: [], total };

  const jobs = [];
  for (const p of items) {
    if (!p || typeof p !== 'object') continue;
    const title = clean(p.positionName);
    const id = p.publishId;
    // A row must have a title AND a non-empty publishId string to produce a URL.
    if (!title || id == null || String(id) === '') continue;
    const idStr = String(id);

    const locations = extractLocations(p);
    jobs.push({
      title,
      url: `${DETAIL_PREFIX}?id=${encodeURIComponent(idStr)}`,
      company: companyName,
      location: locations.join('/'),
      postedAt: toEpochMs(p.publishTime),
      description: buildDescription(p),
    });
  }
  return { jobs, total };
}

export default {
  provider: {
    id: 'jd-campus',
    'fetch': async (entry, ctx) => {
      const api = entry.api || DEFAULT_API;
      const keywords = Array.isArray(entry.keywords) && entry.keywords.length ? entry.keywords : [''];
      const positionType = entry.positionType || DEFAULT_POSITION_TYPE;
      const entryMaxPages = Number(entry.max_pages) > 0 ? Number(entry.max_pages) : DEFAULT_MAX_PAGES;
      const maxPages = entryMaxPages > 0 ? entryMaxPages : DEFAULT_MAX_PAGES;
      const listUrl = buildListUrl(api, positionType);

      /** @type {Map<string, import('../../plugins/_types.js').Job>} */
      const seen = new Map();
      let firstRequest = true;

      for (const keyword of keywords) {
        let total = 0;

        for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
          if (firstRequest) firstRequest = false;
          else await sleep(INTER_PAGE_DELAY_MS);

          let payload;
          try {
            payload = await ctx.fetchJson(listUrl, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: buildBody(keyword, pageIndex),
              redirect: 'error',
            });
          } catch (err) {
            // A dead board should read as a failure; a mid-run blip must not discard
            // what is already collected. Keep the partial result.
            console.error(`  ⚠ jd-campus: keyword "${keyword}" page ${pageIndex + 1} failed (${err.message}) — keeping the ${seen.size} jobs collected so far`);
            return [...seen.values()];
          }

          const parsed = parseJdCampusPage(payload, entry.name || COMPANY);
          if (parsed.total) total = parsed.total;

          if (parsed.jobs.length === 0) {
            // Legitimately past the end, or a transient empty page. Do not fabricate.
            if (total && (pageIndex + 1) * PAGE_SIZE >= total) break;
            continue;
          }

          for (const job of parsed.jobs) {
            if (!seen.has(job.url)) seen.set(job.url, job);
          }

          if (parsed.jobs.length < PAGE_SIZE) break;
          if (total && (pageIndex + 1) * PAGE_SIZE >= total) break;
        }
      }

      return [...seen.values()];
    },
  },
};
