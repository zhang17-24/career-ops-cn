"use client";

import { useEffect, useState } from "react";
import {
  Check,
  KeyRound,
  TerminalSquare,
  Terminal,
  Loader2,
  CircleDashed,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { CadenceSettings } from "@/components/followups/cadence-settings";
import { persistCliId, readSavedCliId } from "@/lib/saved-cli";

type Cli = {
  id: string;
  name: string;
  run: string;
  url: string;
  installed: boolean;
  path: string | null;
};

type Mode = "cli" | "key" | "manual";

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic (Claude)" },
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google (Gemini)" },
  { id: "openrouter", label: "OpenRouter" },
] as const;

const STORAGE_KEY = "career-ops:config";

export function ConfigForm() {
  const [mode, setMode] = useState<Mode>("cli");
  const [clis, setClis] = useState<Cli[] | null>(null);
  const [cliId, setCliId] = useState<string>("");
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [logos, setLogos] = useState(true);
  const [saved, setSaved] = useState(false);

  // Load saved prefs
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        // key/manual are not wired yet (nothing reads them) → never restore into
        // those dead panels; only the Installed-CLI path is functional.
        if (v.mode === "cli") setMode("cli");
        if (v.cliId) setCliId(v.cliId);
        if (v.provider) setProvider(v.provider);
        if (typeof v.logos === "boolean") setLogos(v.logos);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Detect installed CLIs
  useEffect(() => {
    fetch("/api/clis")
      .then((r) => r.json())
      .then((d) => {
        const list: Cli[] = d.clis ?? [];
        setClis(list);
        // Highlight + persist the only installed CLI when Config was never saved.
        // Highlight-only used to look configured while jobs still read empty localStorage.
        setCliId((prev) => {
          if (prev) return prev;
          const only = list.filter((c) => c.installed);
          if (only.length !== 1) return list.find((c) => c.installed)?.id || "";
          if (!readSavedCliId()) persistCliId(only[0].id);
          return only[0].id;
        });
      })
      .catch(() => setClis([]));
  }, []);

  function save() {
    // The API key is deliberately NOT persisted: nothing reads it yet (the
    // key/manual panel is unwired) and a secret must never sit in clear-text
    // localStorage. Keys belong in the user's own CLI/provider config.
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, cliId, provider, logos }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const installed = clis?.filter((c) => c.installed) ?? [];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl tracking-tight text-landing">设置</h1>
      <p className="mt-1 text-sm text-muted">
        在本机使用你自己的 AI 工具运行求职工作台。简历和投递数据默认不会离开电脑。
      </p>

      {/* Engine mode */}
      <label className="mt-8 mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        AI 工具
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <ModeCard
          active={mode === "cli"}
          onClick={() => setMode("cli")}
          icon={Terminal}
          title="使用已安装的 AI 工具"
          hint="推荐"
        />
        <ModeCard
          active={mode === "key"}
          onClick={() => setMode("key")}
          icon={KeyRound}
          title="填写 API Key"
          hint="即将推出"
          disabled
        />
        <ModeCard
          active={mode === "manual"}
          onClick={() => setMode("manual")}
          icon={TerminalSquare}
          title="免配置模式"
          hint="即将推出"
          disabled
        />
      </div>

      <div className="mt-6">
        {mode === "cli" && (
          <div>
            <p className="mb-1 text-sm text-muted">
              求职工作台会使用你已经登录的 AI 工具，不需要在这里粘贴密钥。
            </p>
            <p className="mb-3 text-xs text-faint">支持 Claude Code、Codex、OpenCode、Qwen 等工具。</p>
            {clis === null ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" /> 正在检查电脑上已安装的工具…
              </div>
            ) : installed.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
                还没有 AI 工具？可以使用 <span className="text-foreground">OpenCode</span> 搭配 Qwen 或 GLM。{" "}
                <a href="https://career-ops.org/docs/free-ai-engine" target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand hover:underline">
                  查看免费方案 <ExternalLink className="size-3" />
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {clis.map((c) => {
                  const selected = c.id === cliId;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                        selected
                          ? "border-brand/50 bg-brand-soft"
                          : c.installed
                            ? "border-border bg-surface/50"
                            : "border-border/60 bg-surface/20",
                      )}
                    >
                      {c.installed ? (
                        <Check className="size-4 shrink-0 text-emerald-400" />
                      ) : (
                        <CircleDashed className="size-4 shrink-0 text-faint" />
                      )}
                      <button
                        type="button"
                        disabled={!c.installed}
                        onClick={() => setCliId(c.id)}
                        className={cn(
                          "flex flex-1 items-center gap-2 text-left max-sm:min-h-[44px]",
                          c.installed ? "" : "cursor-default",
                        )}
                      >
                        <span
                          className={cn(
                            "font-medium",
                            selected ? "text-foreground" : c.installed ? "" : "text-muted",
                          )}
                        >
                          {c.name}
                        </span>
                        <span className="font-mono text-xs text-faint">{c.run}</span>
                      </button>
                      {c.installed ? (
                        <span className="hidden max-w-[40%] shrink-0 truncate text-xs text-faint sm:block">
                          {c.path}
                        </span>
                      ) : (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex shrink-0 items-center justify-center gap-1 text-xs text-brand hover:underline max-sm:min-h-[44px]"
                        >
                          安装 <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  );
                })}
                {installed.length === 0 && (
                  <p className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-xs text-muted">
                    没有在 PATH 中找到支持的工具。请先安装 Codex、Claude Code、Gemini CLI 或 OpenCode。
                  </p>
                )}
                <p className="mt-2 text-[11px] leading-relaxed text-faint">
                  Codex 和 Claude Code 支持完整流程；其他工具可使用核心评估功能，部分功能可能受限。
                </p>
              </div>
            )}
          </div>
        )}

        {mode === "key" && (
          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                服务商
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProvider(p.id)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-left text-sm transition-colors",
                      provider === p.id
                        ? "border-brand/50 bg-brand-soft text-foreground"
                        : "border-border bg-surface/50 text-muted hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                填写 API Key
              </label>
              <p className="mb-2 text-xs text-faint">支持 OpenAI、Anthropic 等服务商。</p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-…"
                autoComplete="off"
                className="w-full rounded-xl border border-border bg-surface/60 px-4 py-2.5 font-mono text-sm outline-none transition-colors placeholder:text-faint focus:border-brand/50"
              />
              <p className="mt-2 text-xs text-faint">
                只保存在当前浏览器中，仅发送给你选择的服务商。
              </p>
            </div>
          </div>
        )}

        {mode === "manual" && (
          <div className="rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
            免密钥、免设置模式正在规划中。
          </div>
        )}
      </div>

      {/* Appearance / privacy */}
      <label className="mt-8 mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
        外观与隐私
      </label>
      <button
        type="button"
        onClick={() => setLogos((v) => !v)}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface/50 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">公司图标</span>
          <span className="mt-0.5 block text-xs text-faint">
            显示公司的真实图标。本地服务器只请求一次并缓存；关闭后只显示彩色文字图标。
          </span>
        </span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            logos ? "bg-brand" : "bg-surface-hover",
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
              logos ? "translate-x-[1.375rem]" : "translate-x-0.5",
            )}
          />
        </span>
      </button>

      <CadenceSettings />

      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand px-5 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 max-sm:min-h-[44px]"
        >
          {saved ? <Check className="size-4" /> : null}
          {saved ? "已保存" : "保存设置"}
        </button>
        <span className="text-xs text-faint">本地优先 · 中国版</span>
      </div>
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  icon: Icon,
  title,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-1.5 rounded-xl border px-4 py-3 text-left transition-colors",
        disabled
          ? "cursor-not-allowed border-border bg-surface/30 opacity-55"
          : active
            ? "border-brand/50 bg-brand-soft"
            : "border-border bg-surface/50 hover:bg-surface-hover",
      )}
    >
      <Icon className={cn("size-4", active && !disabled ? "text-brand" : "text-muted")} />
      <span className="text-sm font-medium text-foreground">{title}</span>
      <span className="text-xs text-faint">{hint}</span>
    </button>
  );
}
