// Reuse the platform public ATS DOM reader; no HTTP replay or cached jobs.
export default {
  provider: {
    id: 'company-cdbf507f-4de4-4a7e-a44b-3a271aac6b6c',
    'fetch': async (entry, ctx) => {
      const jobs = await ctx.browserJobs(entry);
      if (!Array.isArray(jobs) || !jobs.length || jobs.length > 100) throw new Error('Momenta listing unconfirmed');
      const ids = new Set();
      for (const job of jobs) {
        const url = new URL(job.url);
        const id = url.pathname.match(/^\/campus\/position\/(\d+)\/detail$/)?.[1];
        if (url.origin !== 'https://momenta.jobs.feishu.cn' || url.username || url.password ||
            url.search || url.hash || !id || ids.has(id) || job.company !== 'Momenta' ||
            typeof job.title !== 'string' || !job.title.trim() ||
            typeof job.location !== 'string' || !job.location.trim()) throw new Error('Momenta source fields or IDs changed');
        ids.add(id);
      }
      // Numeric IDs remain exact strings inside source URLs. The platform's optional
      // id field supports last-segment IDs only; these URLs end in /detail.
      return jobs;
    },
  },
};
