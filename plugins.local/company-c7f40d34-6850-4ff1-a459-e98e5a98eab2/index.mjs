// Platform reader owns live DOM parsing, host enforcement and page limits.
export default {
  provider: {
    id: 'company-c7f40d34-6850-4ff1-a459-e98e5a98eab2',
    'fetch': async (entry, ctx) => {
      const rows = await ctx.browserJobs(entry);
      if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('列表未确认或超过单页上限');
      const ids = new Set();
      return rows.map(job => {
        const route = new URL(job.url).hash.slice(1).split(/[?&]/)[0];
        const id = route.split('/').at(-1);
        if (!id || ids.has(id)) throw new Error('岗位编号缺失或重复');
        ids.add(id);
        return { ...job, id };
      });
    },
  },
};
