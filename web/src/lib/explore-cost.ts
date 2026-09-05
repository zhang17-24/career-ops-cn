// The cost-honesty taxonomy — a single source for the FREE vs $ boundary that the
// Explorer teaches by repetition. Discovery (finding roles) is structurally free:
// it calls no LLM. Only evaluation (scoring a role against your CV) spends tokens,
// and only when the user chooses it. The framing is always local-first: "your key,
// your AI, your machine."

export type CostClass = "free" | "free-network" | "spend" | "free-gemini";

export const COST_META: Record<CostClass, { label: string; tip: string }> = {
  "free-network": {
    label: "免费",
    tip: "通过公开接口扫描国内企业招聘官网，不使用 AI 额度；加入岗位前不会写入数据。",
  },
  free: {
    label: "免费",
    tip: "不使用 AI 额度，只读写本地文件。",
  },
  spend: {
    label: "使用 AI 额度",
    tip: "使用你自己的 AI 工具评估岗位，只在你主动选择后运行。",
  },
  "free-gemini": {
    label: "免费 · Gemini",
    tip: "使用 Gemini 免费额度评估。",
  },
};
