import { ChevronDown, ExternalLink } from "lucide-react";

// Transparency = our differentiator ("why it's a 4.0 for YOU"). The wording is
// the CANONICAL public text from career-ops.org/methodology + /docs — rendered
// verbatim, NOT a web reinterpretation of the rubric (whose weights live in the
// core, modes/_shared.md). Native <details> → no client JS.

const DIMENSIONS: [string, string][] = [
  ["岗位匹配", "你的简历与岗位要求的匹配程度"],
  ["职业方向", "这个岗位能否帮助你接近长期职业目标"],
  ["薪酬", "岗位薪酬与市场水平的比较；信息不足时不会编造数字"],
  ["文化信号", "招聘信息透露的团队、价值观和工作方式"],
  ["风险提示", "虚假岗位、长期挂岗或明显不匹配等警告"],
  ["综合判断", "汇总以上维度得到的最终评分"],
];

const BLOCKS: [string, string][] = [
  ["A", "岗位摘要"],
  ["B", "逐项比较岗位要求、简历证据、重要程度和差距"],
  ["C", "针对该岗位的求职策略"],
  ["D", "薪酬调研与市场水平比较"],
  ["E", "申请材料的个性化建议"],
  ["F", "面试准备与适合该岗位的 STAR 案例"],
  ["G", "岗位真实性与风险检查"],
];

export function ScoreMethodology() {
  return (
    <details className="group mt-10 overflow-hidden rounded-2xl border border-border bg-surface/30">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors hover:bg-surface-hover">
        评分方法：为什么这个分数适合<span className="text-landing">你</span>
        <ChevronDown className="ml-auto size-4 text-faint transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-5 border-t border-border px-5 py-4 text-sm">
        <p className="text-muted">
          每个岗位从六个维度获得 <strong className="text-foreground">1.0–5.0</strong> 分。{" "}
          <strong className="text-brand">4.0</strong> 是建议投递线；低于 4.0 时通常不建议优先投递。
        </p>
        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-faint">六个评分维度</div>
          <ul className="space-y-1.5">
            {DIMENSIONS.map(([k, v]) => (
              <li key={k}>
                <span className="font-medium text-foreground">{k}</span> <span className="text-muted">— {v}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold tracking-[0.14em] text-faint">报告各部分说明</div>
          <ul className="space-y-2">
            {BLOCKS.map(([k, v]) => (
              <li key={k} className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded bg-brand-soft text-xs font-semibold text-brand">
                  {k}
                </span>
                <span className="text-muted">{v}</span>
              </li>
            ))}
          </ul>
        </div>
        <a
          href="https://career-ops.org/methodology"
          target="_blank"
          rel="noreferrer"
          aria-label="查看完整评分方法（在新标签页打开）"
          className="inline-flex min-h-[24px] items-center gap-1 text-xs text-brand transition-colors hover:underline max-sm:min-h-[44px]"
        >
          查看完整评分方法 <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      </div>
    </details>
  );
}
