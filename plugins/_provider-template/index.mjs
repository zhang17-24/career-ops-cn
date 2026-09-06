// @ts-check
// Generated provider template. Runtime behavior must stay deterministic: HTTP + parsing only, no model calls.

const COMPANY = '{{COMPANY}}';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export default {
  provider: {
    id: '{{NAME}}',
    'fetch': async (entry, ctx) => {
      // Agent: replace this fixture-shaped example with the observed public API or HTML parser.
      // Prefer entry.api so endpoint changes remain configuration, not code changes.
      if (!entry.api) throw new Error('{{NAME}} needs an api URL in portals.yml');
      const payload = await ctx.fetchJson(entry.api, { redirect: 'error' });
      const rows = Array.isArray(payload?.jobs) ? payload.jobs : [];
      return rows.map((job) => ({
        title: clean(job.title || job.name),
        url: clean(job.url || job.applyUrl),
        company: clean(job.company) || COMPANY,
        location: clean(job.location || job.city),
        postedAt: Date.parse(job.postedAt || job.publishTime || '') || undefined,
      })).filter((job) => job.title && /^https?:\/\//i.test(job.url));
    },
  },
};
