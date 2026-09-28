// Public company-owned API; one observed campus page, no browser/model runtime.
export const LIST_URL = 'https://hr.g-bits.com/web/index.html#/post-web/post-list/';
export const ENDPOINT = 'https://joinserverfast.g-bits.com/humanResource/recruitmentExtranet/ExtrannetCampusPost/queryRecuitPost';
export const QUERY = Object.freeze({ currentPage: 1, pageSize: 20, recruitsType: 'CAMPUS_RECRUITING', recruitProjectId: '', recruitmentType: null, workPlace: null, postTypes: null });

function required(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${field}`);
  return value.trim();
}

export function parseJobs(payload) {
  if (payload?.success !== true || payload.status !== 10010) throw new Error('吉比特 API response unsuccessful');
  const { list, count } = payload.data || {};
  if (!Array.isArray(list) || !Number.isSafeInteger(count) || count < 0 || list.length !== Math.min(count, 20)) throw new Error('Invalid first-page schema/count');
  const ids = new Set();
  return list.map(row => {
    if (!row || typeof row !== 'object') throw new Error('Invalid job');
    const id = required(row.id, 'id');
    if (id !== row.id || ids.has(id)) throw new Error('Invalid or duplicate job ID');
    ids.add(id);
    const title = required(row.postName, 'postName');
    const location = required(row.workCity?.desc, 'workCity.desc');
    const description = required(row.description, 'description');
    // The observed API supplies plain text. New markup needs fresh verification.
    if (/<[^>]+>|&(?:#\w+|[a-z]+);/i.test(description) || description.replace(/\s+/g, '').length < 50) throw new Error('Unverified description format');
    if (row.jobStatus !== '正常') throw new Error('Job status requires revalidation');
    const url = LIST_URL + ':~:text=' + encodeURIComponent(title).replace(/-/g, '%2D') + '&careerops-id=' + encodeURIComponent(id);
    return { id, title, url, company: '吉比特', location, description };
  });
}

export default {
  provider: {
    id: 'company-243ef6bd-bafc-4c7c-8f96-fb93be905d21',
    'fetch': async (entry, ctx) => {
      const payload = await ctx.fetchJson(ENDPOINT, {
        method: 'POST', redirect: 'error', credentials: 'omit',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(QUERY),
      });
      return parseJobs(payload);
    },
  },
};
