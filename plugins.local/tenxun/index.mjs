// @ts-check
// Deterministic, zero-token provider for 腾讯 campus recruitment (join.qq.com).
// Runtime behavior is HTTP + fixed parsing only — no model calls.

const COMPANY = '腾讯';
// Public campus-search endpoint (POST). Override via portals.yml `api` so an
// endpoint change stays configuration, not code.
const DEFAULT_API = 'https://join.qq.com/api/v1/position/searchPosition';
// Public job-detail page; the list payload carries only a postId, never a URL.
const DETAIL_PAGE = 'https://join.qq.com/post_detail.html';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

// The list payload joins multiple cities with spaces and trailing spaces
// ("深圳总部 北京 上海 "). Collapse to a single space-separated string.
function cleanCities(value) {
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean).join(' ') : '';
}

// Absolute job URL. Prefer an explicit positionUrl when the payload provides
// one (some sources do); otherwise build the canonical postId detail page.
function jobUrl(job) {
  const explicit = clean(job.positionUrl);
  if (/^https?:\/\//i.test(explicit)) return explicit;
  const postId = clean(job.postId);
  if (!postId) return '';
  return `${DETAIL_PAGE}?postid=${encodeURIComponent(postId)}`;
}

export default {
  provider: {
    id: 'tenxun',
    'fetch': async (entry, ctx) => {
      const api = entry.api || DEFAULT_API;
      const body = {
        projectId: entry.projectId ?? 2,
        keyword: entry.keyword ?? '',
        workCountryType: 1,
        pageIndex: entry.pageIndex ?? 1,
        pageSize: entry.pageSize ?? 100,
      };
      const payload = await ctx.fetchJson(api, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const rows = Array.isArray(payload?.data?.positionList) ? payload.data.positionList : [];
      return rows.filter((job) => job && typeof job === 'object').map((job) => {
        const title = clean(job.positionTitle);
        const url = jobUrl(job);
        return {
          title,
          url,
          company: clean(job.company) || COMPANY,
          location: cleanCities(job.workCities),
        };
      }).filter((job) => job.title && /^https?:\/\//i.test(job.url));
    },
  },
};
