// Pure, client-side derivations for the inbox triage view. Every signal here is
// FREE — parsed from data the raw posting already carries (URL host, title text,
// first_seen date). 🔴 None of this ranks or scores relevance; it only labels and
// buckets so the cheap facet filters can narrow the firehose with zero tokens.

import type { AtsSource } from "@/lib/explore";

/** Which supported China source a posting lives on, derived from its URL host.
 *  Matches on the registrable domain anchored at a dot boundary (host === base OR
 *  host ends with ".base") — never a bare substring, so "greenhouse.io.evil.com"
 *  or "notlever.co" can't be misread as that ATS. */
export function sourceFromUrl(url: string): AtsSource | null {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
  const domainIs = (base: string) => host === base || host.endsWith(`.${base}`);
  if (domainIs("careers.tencent.com")) return "tencent";
  if (domainIs("zhaopin.meituan.com")) return "meituan";
  if (domainIs("talent.alibaba.com")) return "alibaba";
  if (domainIs("jobs.bytedance.com") || domainIs("jobs.feishu.cn")) return "feishu-jobs";
  if (domainIs("mokahr.com")) return "mokahr";
  return null;
}

// Coarse seniority buckets, detected from the title. Ordered senior→junior so the
// facet chips read top-down; a title that matches nothing gets no tag (still shows,
// just untagged). We only ever surface buckets that actually appear in the data.
export type Seniority = "lead" | "staff" | "senior" | "mid" | "junior" | "intern";
export const SENIORITY_ORDER: Seniority[] = ["lead", "staff", "senior", "mid", "junior", "intern"];
export const SENIORITY_LABEL: Record<Seniority, string> = {
  lead: "负责人 / 经理",
  staff: "专家级",
  senior: "高级",
  mid: "中级",
  junior: "初级 / 应届",
  intern: "实习",
};

export function seniorityFromTitle(title: string): Seniority | null {
  const t = ` ${title.toLowerCase()} `;
  if (/负责人|总监|经理|主管|\b(head|vp|vice president|director|chief|manager|mgr|lead)\b/.test(t)) return "lead";
  if (/\b(staff|principal|distinguished|fellow|architect)\b/.test(t)) return "staff";
  if (/高级|资深|\b(senior|sr\.?|snr)\b/.test(t)) return "senior";
  if (/初级|应届|校招|管培生|\b(junior|jr\.?|entry|graduate|associate)\b/.test(t)) return "junior";
  if (/实习|\b(intern|internship|working student|apprentice)\b/.test(t)) return "intern";
  // an untagged IC role sits in the broad middle
  if (/工程师|开发|科学家|设计师|分析师|产品经理|顾问|\b(engineer|developer|scientist|designer|analyst|manager|specialist|consultant)\b/.test(t)) return "mid";
  return null;
}

/** Whole days between an ISO date (YYYY-MM-DD) and now; null if unparseable. */
export function daysSince(iso: string | undefined, now: number): number | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const t = Date.parse(`${iso}T00:00:00Z`);
  if (Number.isNaN(t)) return null;
  return Math.floor((now - t) / 86_400_000);
}

// Freshness windows mirror the Explore "posted within" segmented control so the two
// surfaces feel like one system. A posting passes a window if its age ≤ the window.
export const FRESHNESS_WINDOWS = [
  { label: "24小时", days: 1 },
  { label: "3天", days: 3 },
  { label: "7天", days: 7 },
  { label: "14天", days: 14 },
  { label: "30天", days: 30 },
] as const;
