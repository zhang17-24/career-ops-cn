// Deterministic Feishu ATS DOM extraction is owned by the platform reader.
export default {
  provider: {
    id: 'company-180b53de-8915-427b-b815-5061ee3e8adc',
    'fetch': async (entry, ctx) => ctx.browserJobs(entry),
  },
};
