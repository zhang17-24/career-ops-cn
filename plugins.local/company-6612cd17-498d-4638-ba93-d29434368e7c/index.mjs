// Fixed Moka DOM parsing is delegated to the platform browserListing reader.
// No HTTP decoding, credentials, model calls, pagination or fallback data.
export function preserveIds(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('公开列表未确认或超过单页上限');
  const ids = new Set();
  return rows.map(job => {
    const u = new URL(job.url);
    if (u.origin !== 'https://app.mokahr.com' || u.pathname !== '/campus-recruitment/pwrd/172467' ||
        u.search !== '?locale=zh-CN' || !/^#\/job\/[^/?&#]+$/.test(u.hash) ||
        !job.title?.trim() || !job.location?.trim() || job.company !== '完美世界') throw new Error('公开岗位结构变化');
    const id = u.hash.slice('#/job/'.length);
    if (ids.has(id)) throw new Error('重复岗位编号');
    ids.add(id);
    return { title: job.title, url: job.url, company: job.company, location: job.location, id };
  });
}
export default {
  provider: {
    id: 'company-6612cd17-498d-4638-ba93-d29434368e7c',
    'fetch': async (entry, ctx) => preserveIds(await ctx.browserJobs(entry)),
  },
};
