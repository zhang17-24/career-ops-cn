// Fixed DOM extraction is owned by the platform; no HTTP replay or model calls.
export default {
  provider: {
    id: 'company-21d4065b-1ad5-451b-847c-63c04790a038',
    'fetch': async (entry, ctx) => {
      const rows = await ctx.browserJobs(entry);
      if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('阿里巴巴列表未确认或超过单页上限');
      const ids = new Set();
      return rows.map(job => {
        const url = new URL(job.url);
        const match = /^\/campus\/position\/(\d+)$/.exec(url.pathname);
        if (url.protocol !== 'https:' || url.hostname !== 'campus-talent.alibaba.com' || url.port || url.username || url.password || !match ||
            typeof job.title !== 'string' || !job.title.trim() || typeof job.location !== 'string' || !job.location.trim() || job.company !== '阿里巴巴') {
          throw new Error('阿里巴巴岗位字段或官网链接结构变化');
        }
        const id = match[1];
        if (ids.has(id)) throw new Error('阿里巴巴岗位编号重复');
        ids.add(id);
        return { ...job, id };
      });
    },
  },
};
