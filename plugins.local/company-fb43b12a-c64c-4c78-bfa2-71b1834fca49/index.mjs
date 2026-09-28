// Candidate is intentionally unavailable until official list/detail evidence is verified.
export default {
  provider: {
    id: 'company-fb43b12a-c64c-4c78-bfa2-71b1834fca49',
    async fetch() {
      throw new Error('网易候选阻塞：官网列表导航未完成，解析器尚未实现；详见 BLOCKED.md');
    },
  },
};
