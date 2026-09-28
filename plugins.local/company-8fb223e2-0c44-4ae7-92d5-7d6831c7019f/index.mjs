// Fixed Feishu public-careers DOM parsing is supplied by the platform reader.
// One page, no pagination, no model, no cached jobs or HTTP fallback.
export default {
  provider: {
    id: 'company-8fb223e2-0c44-4ae7-92d5-7d6831c7019f',
    'fetch': async (entry, ctx) => ctx.browserJobs(entry),
  },
};
