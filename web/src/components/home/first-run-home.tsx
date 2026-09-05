"use client";

import { instrumentSerif } from "@/lib/fonts";
import { HeroGlow } from "@/components/hero-glow";
import { CvIngest } from "@/components/cv/cv-ingest";

// The first-run takeover: when cv.md is missing, the CV-upload hero IS the home.
// One input, value-coming framing (not a form), the same product chrome (HeroGlow
// + dot-bg) so it feels like the app, not a gate. The whole aha (CV → free matches
// → first score) flows from here.
export function FirstRunHome() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
      <section className="dot-bg relative overflow-hidden rounded-2xl border border-border bg-surface/40 px-7 py-10 md:px-10 md:py-12">
        <HeroGlow />
        {/* Readability scrim between the animated glow (z-0) and the copy (z-10):
            the glow still reads at the edges, but text always sits on a surface that
            clears WCAG AA contrast instead of washing out over a bright corner. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-surface/55 backdrop-blur-[2px] dark:bg-background/45" />
        <div className="relative z-10">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
            <span className="text-faint">//</span> 本地优先 · 数据留在你的电脑
          </p>
          <h1 className={`${instrumentSerif.className} mt-3 text-4xl leading-[1.05] text-landing md:text-5xl`}>
            放入简历，60 秒开始找国内岗位。
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted">
            不需要注册账号。粘贴文字或放入 .md / .txt 文件即可开始。处理 PDF 前需在{" "}
            <a href="/config" className="text-foreground underline-offset-2 hover:underline">
              设置
            </a>{" "}
            中连接 AI 工具。扫描企业官网<span className="text-foreground">免费</span>，只有详细评估岗位时才会使用 AI 额度。
          </p>
          <div className="mt-7">
            <CvIngest />
          </div>
        </div>
      </section>
    </div>
  );
}
