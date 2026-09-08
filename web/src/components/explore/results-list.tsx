"use client";

import { useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import type { DiscoveredOffer } from "@/lib/explore";
import { CostBadge } from "@/components/cost/cost-badge";
import { DiscoveryCard } from "./discovery-card";
import { useExplore } from "./explore-provider";
import { matchJobKeyword } from "@/lib/job-keywords.mjs";

export type EnrichedOffer = DiscoveredOffer & { inPipeline: boolean; evaluatedN?: string };

export function ResultsList({ offers }: { offers: EnrichedOffer[] }) {
  const { companiesScanned, partial, addToPipeline, added, mode, filters } = useExplore();
  const isAi = mode === "ai";
  const [sort, setSort] = useState<"fresh" | "company">("fresh");
  const [q, setQ] = useState("");
  const [expiredUrls, setExpiredUrls] = useState<Set<string>>(new Set());
  const [relaxedFor, setRelaxedFor] = useState<string | null>(null);
  const filterKey = JSON.stringify(filters.positive);
  const relaxed = relaxedFor === filterKey;
  const candidates = useMemo(() => offers.map(o => {
    const match = matchJobKeyword(o.title, filters.positive);
    return { ...o, keywordRank: isAi ? 0 : match.rank, matchedKeyword: isAi ? o.matchedKeyword : match.reason };
  }), [offers, filters.positive, isAi]);
  const unmatched = candidates.filter(o => o.keywordRank === 2).length;

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = candidates.filter(o => relaxed || o.keywordRank < 2);
    if (needle) list = list.filter((o) => matchJobKeyword(o.title, [needle]).kind !== 'none' || o.company.toLowerCase().includes(needle));
    const sorted = [...list].sort((a, b) =>
      a.keywordRank - b.keywordRank || (sort === "fresh" ? (b.postedAt || "").localeCompare(a.postedAt || "") : a.company.localeCompare(b.company)),
    );
    return sorted;
  }, [candidates, q, sort, relaxed]);

  const addable = view.filter((o) => !expiredUrls.has(o.url) && !o.inPipeline && !o.evaluatedN && !added.has(o.url));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{view.length}</span> 个{isAi ? "候选岗位" : "匹配岗位"}
            <CostBadge kind={isAi ? "spend" : "free-network"} size="xs" className="ml-2 align-middle" />
          </p>
          <p className="text-[12px] text-faint">
            {isAi
              ? "由 AI 从公开网页找到，评估时会再次验证"
              : `${companiesScanned > 0 ? `已扫描 ${companiesScanned.toLocaleString()} 家企业 · ` : ""}不消耗 AI 额度${partial ? " · 部分来源暂时不可访问" : ""}`}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface/40 px-2.5 py-1.5">
            <Search className="size-3.5 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="筛选结果…"
              className="w-32 bg-transparent text-[13px] outline-none placeholder:text-faint"
            />
          </div>
          <div className="inline-flex rounded-lg border border-border bg-surface/40 p-0.5 text-xs">
            {(["fresh", "company"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={cn("rounded-md px-2.5 py-1 font-medium capitalize transition-colors", sort === s ? "bg-brand-soft text-brand" : "text-muted hover:text-foreground")}
              >
                {s === "fresh" ? "最新" : "公司"}
              </button>
            ))}
          </div>
          {addable.length > 1 && (
            <button
              type="button"
              onClick={() => addToPipeline(addable)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface/40 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-brand-soft hover:text-brand"
            >
              <Plus className="size-3.5" /> 全部加入（{addable.length}）
            </button>
          )}
        </div>
      </div>

      {!isAi && unmatched > 0 && <div className="rounded-lg border border-border bg-surface p-3 text-sm">
        已读取另 {unmatched} 个未匹配关键词的岗位。城市、排除词等限制仍保留。
        <button className="ml-2 text-brand underline" onClick={() => { setRelaxedFor(relaxed ? null : filterKey); setQ(''); }}>
          {relaxed ? '恢复关键词筛选' : '查看不限关键词的已读取岗位（不重新扫描）'}
        </button>
      </div>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {view.map((o) => (
          <DiscoveryCard key={o.url} offer={o} inPipeline={o.inPipeline} evaluatedN={o.evaluatedN} onExpired={url => setExpiredUrls(prev => new Set([...prev, url]))} />
        ))}
      </div>

      {view.length === 0 && <p className="py-10 text-center text-sm text-faint">暂时没有匹配当前关键词的结果，可使用上方放宽选项查看已读取岗位。</p>}
    </div>
  );
}
