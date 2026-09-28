// @ts-check
// Deterministic, zero-token provider for 美团 campus recruitment (zhaopin.meituan.com/web/campus).
// Runtime behavior is HTTP + fixed parsing only — no model calls.
//
// Observed with Ego Lite on the live campus page (2026-09-09):
//   POST /api/official/job/getJobList
//   { "page": {"pageNo": N, "pageSize": 100},
//     "jobShareType": "1",
//     "keywords": "",                                  ← empty keyword = the whole campus board
//     "cityList": [], "department": [], "jfJgList": [],
//     "jobType": [{"code": "1", "subCode": []},        ← 1 + 2 = 校招 + 实习 (campus board; social uses code "3")
//                 {"code": "2", "subCode": []}],
//     "typeCode": [], "specialCode": [] }
//   → data.list[] items: name, jobUnionId, cityList[{name}], department[{name}], jobDuty,
//     jobRequirement, jobFamily, workYear, projectName, refreshTime, firstPostTime
//
// The campus detail route (observed by clicking a real card, which opens a new tab):
//   https://zhaopin.meituan.com/web/position/detail?jobUnionId=<jobUnionId>&highlightType=campus

const COMPANY = '美团';
// Public campus list endpoint (POST). Configurable via portals.yml `api`.
const DEFAULT_API = 'https://zhaopin.meituan.com/api/official/job/getJobList';
// Public job-detail page; the list payload carries only a jobUnionId, never a URL.
const DETAIL_PAGE = 'https://zhaopin.meituan.com/web/position/detail';
const PAGE_SIZE = 100;
const DEFAULT_MAX_PAGES = 10;
// Every request after the first pays it (campus board rate-limits like its social sibling).
const INTER_PAGE_DELAY_MS = 300;
// Campus board: share type "1"; jobType codes 1 (校招 fresh grad) + 2 (实习 internship).
const JOB_SHARE_TYPE = '1';
const DEFAULT_JOB_TYPE = [{ code: '1', subCode: [] }, { code: '2', subCode: [] }];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/** cityList/department items are object(s) like {name: "北京市"} */
function names(arr) {
  if (!Array.isArray(arr)) return '';
  return arr
    .map(x => (typeof x === 'string' ? x : x && typeof x === 'object' ? x.name : ''))
    .filter(Boolean)
    .join('/');
}

function toEpochMs(v) {
  if (v == null) return undefined;
  if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
  const parsed = Date.parse(v);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** @param {string} keyword @param {number} pageNo @param {Array<{code: string, subCode: any[]}>} [jobType] */
function buildBody(keyword, pageNo, jobType = DEFAULT_JOB_TYPE) {
  return JSON.stringify({
    page: { pageNo, pageSize: PAGE_SIZE },
    jobShareType: JOB_SHARE_TYPE,
    keywords: keyword,
    cityList: [],
    department: [],
    jfJgList: [],
    jobType,
    typeCode: [],
    specialCode: [],
  });
}

/**
 * Parse one page of the getJobList payload. Exported for tests.
 * jobUnionId is a STRING id ("4721378720"); it is never coerced through Number.
 * @param {any} json
 * @param {string} companyName
 * @returns {{ jobs: import('../../plugins/_types.js').Job[], total: number }}
 */
export function parseMeituanCampusResponse(json, companyName) {
  const list = json?.data?.list;
  const total = Number(json?.data?.page?.totalCount) || 0;
  if (!Array.isArray(list)) return { jobs: [], total };

  const jobs = [];
  for (const p of list) {
    if (!p || typeof p !== 'object') continue;
    const title = clean(p.name);
    const id = p.jobUnionId;
    // A row must have a title AND a non-empty jobUnionId string to produce a URL.
    if (!title || id == null || String(id) === '') continue;
    const idStr = String(id);

    const description = [
      names(p.department) && `部门: ${names(p.department)}`,
      p.jobFamily && `序列: ${p.jobFamily}`,
      p.workYear && `经验: ${p.workYear}`,
      p.projectName && `项目: ${p.projectName}`,
      p.jobDuty,
      p.jobRequirement,
    ].filter(Boolean).join('\n').slice(0, 4000);

    jobs.push({
      title,
      url: `${DETAIL_PAGE}?jobUnionId=${encodeURIComponent(idStr)}&highlightType=campus`,
      company: companyName,
      location: names(p.cityList),
      postedAt: toEpochMs(p.refreshTime ?? p.firstPostTime),
      description,
    });
  }
  return { jobs, total };
}

export default {
  provider: {
    id: 'meituan-campus',
    'fetch': async (entry, ctx) => {
      const api = entry.api || DEFAULT_API;
      const keywords = Array.isArray(entry.keywords) && entry.keywords.length ? entry.keywords : [''];
      const entryMaxPages = Number(entry.max_pages) > 0 ? Number(entry.max_pages) : DEFAULT_MAX_PAGES;
      const maxPages = entryMaxPages > 0 ? entryMaxPages : DEFAULT_MAX_PAGES;
      const jobType = Array.isArray(entry.jobType) && entry.jobType.length ? entry.jobType : DEFAULT_JOB_TYPE;

      /** @type {Map<string, import('../../plugins/_types.js').Job>} */
      const seen = new Map();
      let firstRequest = true;

      for (const keyword of keywords) {
        let total = 0;

        for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
          if (firstRequest) firstRequest = false;
          else await sleep(INTER_PAGE_DELAY_MS);

          let payload;
          try {
            payload = await ctx.fetchJson(api, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: buildBody(keyword, pageNo, jobType),
              redirect: 'error',
            });
          } catch (err) {
            // A dead board should read as a failure; a mid-run blip must not discard
            // what is already collected. Keep the partial result.
            console.error(`  ⚠ meituan-campus: keyword "${keyword}" page ${pageNo} failed (${err.message}) — keeping the ${seen.size} jobs collected so far`);
            return [...seen.values()];
          }

          const parsed = parseMeituanCampusResponse(payload, entry.name || COMPANY);
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
      }

      return [...seen.values()];
    },
  },
};
