// Moka DOM extraction is performed by the platform's constrained browser reader.
// Preserve source fields and the observed SPA route's string ID; never paginate.
export function parseJobs(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('招聘列表未确认');
  const ids = new Set();
  return rows.map(row => {
    if (!row || typeof row.title !== 'string' || !row.title.trim() ||
        typeof row.location !== 'string' || !row.location.trim() || row.company !== '完美世界') {
      throw new Error('岗位字段或企业身份不符');
    }
    const url = new URL(row.url);
    const match = /^#\/job\/([A-Za-z0-9-]+)$/.exec(url.hash);
    if (url.origin !== 'https://app.mokahr.com' || url.username || url.password ||
        url.pathname !== '/campus-recruitment/pwrd/172467' || url.search !== '?locale=zh-CN' || !match) {
      throw new Error('岗位链接不属于已观察的完美世界校招路线');
    }
    const id = match[1];
    if (ids.has(id)) throw new Error('重复岗位编号');
    ids.add(id);
    return { title: row.title, url: row.url, location: row.location, company: row.company, id };
  });
}

export default {
  provider: {
    id: 'company-cfdc418a-9735-4e36-92c5-badceb8120f8',
    'fetch': async (entry, ctx) => parseJobs(await ctx.browserJobs(entry)),
  },
};
