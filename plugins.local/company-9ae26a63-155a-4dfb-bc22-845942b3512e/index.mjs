// Public Moka anchors are read by the platform's fixed, host-restricted reader.
export default {
  provider: {
    id: 'company-9ae26a63-155a-4dfb-bc22-845942b3512e',
    'fetch': async (entry, ctx) => {
      if (entry.name !== '金山办公') throw new Error('企业身份不符');
      const jobs = await ctx.browserJobs(entry);
      if (!Array.isArray(jobs) || !jobs.length || jobs.length > 100) throw new Error('单页岗位未确认');
      const ids = new Set();
      return jobs.map(job => {
        const url = new URL(job.url);
        const match = /^#\/job\/([^/?#&]+)$/.exec(url.hash);
        if (url.protocol !== 'https:' || url.hostname !== 'app.mokahr.com' ||
            url.pathname !== '/campus-recruitment/wps/41436' || url.username || url.password || url.port ||
            !match || !job.title?.trim() || !job.location?.trim() || job.company !== entry.name) {
          throw new Error('岗位字段或官方详情链接结构变化');
        }
        const id = match[1];
        if (ids.has(id)) throw new Error('重复岗位编号');
        ids.add(id);
        return { ...job, id };
      });
    },
  },
};
