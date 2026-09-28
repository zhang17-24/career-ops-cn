"use client";

import { use } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Loader2, Wrench, CircleDot, Check, X } from "lucide-react";
import { useJobs } from "@/components/jobs/job-store";
import { HeroGlow } from "@/components/hero-glow";
import { Badge } from "@/components/ui/badge";
import { adapterPendingHint, jobErrorHint } from "@/lib/job-error-hint.mjs";

export default function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { jobs } = useJobs();
  const job = jobs.find((j) => j.id === id);
  const pending = adapterPendingHint(job);
  const errorHint = jobErrorHint(job);

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-brand">
          <ArrowLeft className="size-4" /> 投递看板
        </Link>
        <p className="mt-8 text-sm text-muted">
          这条后台任务已不在当前记录中，可能已完成或页面曾重新加载。
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link href="/pipeline" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-brand">
        <ArrowLeft className="size-4" /> 投递看板
      </Link>

      <section className="dot-bg relative mt-5 overflow-hidden rounded-2xl border border-border bg-surface/40 px-6 py-7">
        {job.status === "running" && <HeroGlow />}
        <div className="relative z-10">
          <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-faint">
            {job.status === "running" ? (
              <><Loader2 className="size-3 animate-spin text-brand" /> 运行中</>
            ) : pending ? (
              <><CircleDot className="size-3 text-amber-500" /> {pending.title}</>
            ) : job.status === "done" ? (
              <><Check className="size-3 text-emerald-500" /> 已完成</>
            ) : (
              <><X className="size-3 text-red-400" /> 失败</>
            )}
          </p>
          <h1 className="mt-2 font-display text-2xl tracking-tight text-landing">{job.title}</h1>
          {job.subtitle && <p className="mt-1 text-sm text-muted">{job.subtitle}</p>}
          {(pending || errorHint) && <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">{pending?.text ?? errorHint?.text}</p>}
          {pending?.href && <Link href={pending.href} className="mt-4 inline-flex rounded-lg border border-amber-500/40 bg-surface px-4 py-2 text-sm text-brand">前往本企业审核并继续</Link>}
          {!pending && job.status === "error" && job.kind === "adapt-provider" && <Link href={"/portals?adapter=" + encodeURIComponent(job.input || "")} className="mt-4 inline-flex rounded-lg border border-red-500/40 px-4 py-2 text-sm text-brand">重试 / 零 Token 重新验收</Link>}
          {!pending && job.result?.score != null && (
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <Badge tone={job.result.tone}>{job.result.score}/5</Badge>
              {job.result.summary && <span className="text-sm text-muted">{job.result.summary}</span>}
            </div>
          )}
        </div>
      </section>

      <ol className="mt-6 space-y-2">
        {job.steps.map((s, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            {s.kind === "tool" ? (
              <Wrench className="mt-0.5 size-3.5 shrink-0 text-brand" />
            ) : (
              <CircleDot className="mt-0.5 size-3.5 shrink-0 text-faint" />
            )}
            <span className={s.kind === "tool" ? "font-medium" : "text-muted"}>
              {s.kind === "tool" ? `正在使用 ${s.label}` : s.label}
            </span>
          </li>
        ))}
        {job.status === "running" && (
          <li className="flex items-center gap-2.5 text-sm text-muted">
            <Loader2 className="size-3.5 animate-spin text-brand" /> 正在处理…
          </li>
        )}
      </ol>

      {job.text && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">输出</h2>
          <div className="report-prose mt-3 rounded-2xl border border-border bg-surface/40 p-5">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.text}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
