// Official self-hosted school recruitment API; intentionally reads page 1 only.
export const LIST_URL = 'https://api-web.lixiang.com/osd-hr-recruitment-website/v1/recruit/school/job-page?page=1&page_size=10';

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${field}`);
  return value.trim();
}

export function parseJobs(payload) {
  const data = payload?.data;
  if (payload?.code !== 0 || !data || !Array.isArray(data.items) ||
      data.page !== 1 || data.page_size !== 10 || data.items.length > 10 ||
      !Number.isSafeInteger(data.total_count) || data.total_count < data.items.length ||
      !Number.isSafeInteger(data.total_pages) || data.total_pages < 0 ||
      data.total_pages !== Math.ceil(data.total_count / 10) ||
      data.items.length !== Math.min(data.total_count, 10)) {
    throw new Error('Unconfirmed official list: response status, schema or pagination changed');
  }
  const ids = new Set();
  return data.items.map(row => {
    if (!row || typeof row !== 'object') throw new Error('Invalid job row');
    // Safe small JSON numbers are lossless; long IDs must arrive as strings.
    const id = typeof row.id === 'string' ? row.id :
      Number.isSafeInteger(row.id) && row.id > 0 ? String(row.id) : '';
    if (!/^[1-9]\d*$/.test(id) || ids.has(id)) throw new Error('Invalid or duplicate job ID');
    ids.add(id);
    const code = requiredText(row.code, 'job code');
    if (!/^[A-Za-z0-9]+$/.test(code)) throw new Error('Invalid job code');
    return {
      id,
      title: requiredText(row.title, 'title'),
      company: '理想汽车',
      location: requiredText(row.location_title, 'location'),
      // Public card handler + three actual click destinations (see ACCEPTANCE.md).
      url: `https://www.lixiang.com/employ/detail/${id}.html?jobCode=${code}&fromJob=1`,
    };
  });
}

export default {
  provider: {
    id: 'company-e288d993-33fd-4981-acf3-b3e650058c5c',
    'fetch': async (entry, ctx) => parseJobs(await ctx.fetchJson(LIST_URL, { redirect: 'error' })),
  },
};
