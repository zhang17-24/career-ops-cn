// Fixed Feishu ATS DOM parsing is provided by the platform browserListing reader.
// No HTTP replay, model calls, fixture imports, pagination or application actions.
export default {
  provider: {
    id: 'company-366fdb82-50b1-44cf-880a-ff842560f54f',
    'fetch': async (entry, ctx) => ctx.browserJobs(entry),
  },
};
