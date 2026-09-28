// Moka public anchors are read by the platform's restricted, anonymous DOM reader.
// One listing page only; no API decoding, pagination, cached jobs or model calls.
export function preserveIds(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('岗位列表未确认或超过单页上限');
  const ids = new Set();
  return rows.map(row => {
    if (!row || typeof row.title !== 'string' || !row.title.trim() ||
        typeof row.location !== 'string' || !row.location.trim() || row.company !== '滴滴') throw new Error('岗位字段无效');
    const url = new URL(row.url);
    if (url.origin !== 'https://campus.didiglobal.com' || url.username || url.password ||
        url.pathname !== '/campus_apply/didiglobal/96064' || url.search ||
        !/^#\/job\/[^/?&#]+$/.test(url.hash)) throw new Error('岗位链接结构变化');
    const id = url.hash.split('/').at(-1);
    if (ids.has(id)) throw new Error('岗位编号重复');
    ids.add(id);
    return { title: row.title, url: row.url, company: row.company, location: row.location, id };
  });
}

export default {
  provider: {
    id: 'company-2e98d49e-9aa1-402e-bbd7-f0ece4406153',
    'fetch': async (entry, ctx) => preserveIds(await ctx.browserJobs(entry)),
  },
};
