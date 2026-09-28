// Fixed Moka DOM extraction is owned by the platform browserListing reader.
export function preserveIds(jobs) {
  if (!Array.isArray(jobs) || !jobs.length || jobs.length > 100) throw new Error('公开列表未确认或超过单页上限');
  const ids = new Set();
  return jobs.map(job => {
    if (!job || !job.title || !job.location || !job.company) throw new Error('岗位字段不完整');
    const url = new URL(job.url);
    const match = url.hash.match(/^#\/job\/([^/?&#]+)$/);
    if (url.protocol !== 'https:' || !match || ids.has(match[1])) throw new Error('岗位路由变化或编号重复');
    ids.add(match[1]);
    return { ...job, id: match[1] };
  });
}

export default {
  provider: {
    id: 'company-cf87d8eb-dbc9-4f2c-8b3d-c9c0a0924f18',
    'fetch': async (entry, ctx) => preserveIds(await ctx.browserJobs(entry)),
  },
};
