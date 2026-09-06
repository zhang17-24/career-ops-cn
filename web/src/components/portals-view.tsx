"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, ExternalLink, HelpCircle, Loader2, PackagePlus, Pencil, Plus, Power, PowerOff, Radar, Search, Trash2, Wrench, X } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { useJobs, type Job } from "@/components/jobs/job-store";
import { cn } from "@/lib/cn";

type CatalogCompany = { name: string; url: string; category: string; note: string; automatic: boolean; provider: string };
type HealthCompany = { name: string; status: string; detail: string };
type Result = { available: boolean; configured: boolean; companies: HealthCompany[] };
type Adapter = { id: string; name: string; description: string; version: string; hosts: string[]; enabled: boolean; local: boolean; companies: string[] };

const TONE: Record<string, { dot: string; label: string; chip: string }> = {
  live: { dot: "bg-emerald-500", label: "正常", chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  empty: { dot: "bg-amber-500", label: "正常 · 暂无岗位", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  broken: { dot: "bg-red-500", label: "失效", chip: "bg-red-500/15 text-red-700 dark:text-red-400" },
  skipped: { dot: "bg-zinc-400", label: "不支持自动读取", chip: "bg-surface-hover text-muted" },
};
const ORDER: Record<string, number> = { broken: 0, empty: 1, live: 2, skipped: 3 };

export function PortalsView() {
  const [res, setRes] = useState<Result | null>(null);
  const [catalog, setCatalog] = useState<CatalogCompany[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部类别");
  const [loading, setLoading] = useState(false);
  const [editor, setEditor] = useState<CatalogCompany | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<CatalogCompany | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [adapters, setAdapters] = useState<Adapter[]>([]);
  const [adapterOpen, setAdapterOpen] = useState(false);
  const [tutorialCompany, setTutorialCompany] = useState<CatalogCompany | null | undefined>(undefined);
  const { jobs, startJob } = useJobs();

  // map the agentic "fix-portal" workers to the company they're repairing
  const fixByCompany = useMemo(() => {
    const m = new Map<string, (typeof jobs)[number]>();
    for (const j of jobs) {
      if (j.kind !== "fix-portal" || !j.input) continue;
      const ex = m.get(j.input);
      if (!ex || j.startedAt > ex.startedAt) m.set(j.input, j);
    }
    return m;
  }, [jobs]);

  function loadCatalog() {
    return fetch("/api/portals/catalog")
      .then((r) => r.json())
      .then((data) => setCatalog(Array.isArray(data.companies) ? data.companies : []))
      .catch(() => setCatalog([]));
  }

  function loadAdapters() {
    return fetch("/api/portals/adapters")
      .then((r) => r.json())
      .then((data) => setAdapters(Array.isArray(data.adapters) ? data.adapters : []))
      .catch(() => setAdapters([]));
  }

  useEffect(() => {
    void loadCatalog();
    void loadAdapters();
  }, []);

  function openEditor(company?: CatalogCompany) {
    setOriginalName(company?.name || "");
    setEditor(company ? { ...company } : { name: "", url: "", category: "其他", note: "", automatic: false, provider: "" });
    setError("");
  }

  async function saveCompany() {
    if (!editor) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/portals/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalName, name: editor.name, url: editor.url, category: editor.category, note: editor.note }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "无法保存招聘源。");
      await loadCatalog();
      setEditor(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法保存招聘源。");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/portals/catalog", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deleteTarget.name }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "无法删除招聘源。");
      await loadCatalog();
      setDeleteTarget(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法删除招聘源。");
    } finally {
      setSaving(false);
    }
  }

  function check() {
    setLoading(true);
    fetch("/api/portals/verify")
      .then((r) => r.json())
      .then(setRes)
      .catch(() => setRes({ available: false, configured: false, companies: [] }))
      .finally(() => setLoading(false));
  }

  const health = new Map((res?.companies ?? []).map((company) => [company.name, company]));
  const broken = (res?.companies ?? []).filter((c) => c.status === "broken");
  const liveN = (res?.companies ?? []).filter((c) => c.status === "live" || c.status === "empty").length;
  const categories = useMemo(() => ["全部类别", ...Array.from(new Set(catalog.map((c) => c.category)))], [catalog]);
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter((company) => {
      if (category !== "全部类别" && company.category !== category) return false;
      return !needle || `${company.name} ${company.category} ${company.note}`.toLowerCase().includes(needle);
    });
  }, [catalog, category, query]);
  const automatic = catalog.filter((company) => company.automatic).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={check}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand-200 disabled:opacity-50 max-sm:min-h-[44px]"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
          零 Token 检查招聘源
        </button>
        <button
          type="button"
          onClick={() => openEditor()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40 hover:text-brand max-sm:min-h-[44px]"
        >
          <Plus className="size-4" /> 添加企业
        </button>
        <button
          type="button"
          onClick={() => { setAdapterOpen(true); void loadAdapters(); }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40 hover:text-brand max-sm:min-h-[44px]"
        >
          <PackagePlus className="size-4" /> 适配器插件 ({adapters.length})
        </button>
        <button type="button" onClick={() => setTutorialCompany(null)} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40 hover:text-brand max-sm:min-h-[44px]">
          <HelpCircle className="size-4" /> 使用教程
        </button>
        {loading && <span className="text-xs text-faint">正在检查每家企业…（约 30–60 秒）</span>}
      </div>
      <p className="mt-2 text-xs text-faint">添加、编辑和删除只会更新本机配置，不会扫描网站或消耗 Token。</p>

      {res && !res.available && (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
          缺少招聘源检查程序。请确认当前使用的是完整项目，而不是只有网页目录的副本。
        </p>
      )}
      {res && res.available && !res.configured && (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface/30 p-4 text-sm text-muted">
          还没有 <code className="text-foreground">portals.yml</code>。请先复制中国版模板或让助手配置。
        </p>
      )}

      {res && res.configured && (
        <div className="mt-5">
          <p className="text-sm text-muted">
            <span className="tabular-nums text-emerald-600 dark:text-emerald-400">{liveN}</span> 个可用 ·{" "}
            <span className="tabular-nums text-red-600 dark:text-red-400">{broken.length}</span> 个失效 ·{" "}
            <span className="tabular-nums">{res.companies.length}</span> 个已检查
          </p>
          {broken.length > 0 && (
            <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              <span className="font-medium text-red-700 dark:text-red-400">
                {broken.length} 个自动招聘源暂时失效
              </span>{" "}
              <span className="text-muted">
                请更新 <code>portals.yml</code> 中的官网地址，或让助手重新查找并验证入口。
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_15rem]">
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface/40 px-3">
          <Search className="size-4 text-faint" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索企业、行业或备注" className="min-h-11 w-full bg-transparent text-sm outline-none" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-xl border border-border bg-surface/40 px-3 text-sm outline-none">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <p className="mt-3 text-sm text-muted">
        共 <span className="font-medium text-foreground">{catalog.length}</span> 家 · {categories.length - 1} 类 · {automatic} 家可自动读取 · 当前显示 {shown.length} 家
      </p>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {shown.map((company) => {
          const checked = health.get(company.name);
          const tone = checked ? (TONE[checked.status] ?? TONE.skipped) : null;
          const existingAdapter = adapters.find((adapter) => adapter.companies.includes(company.name) || adapter.name.includes(company.name));
          return (
            <li key={company.name} className="rounded-2xl border border-border bg-surface/40 p-4">
              <div className="flex items-start gap-3">
                <CompanyLogo name={company.name} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{company.name}</span>
                    <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted">{company.category}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", company.automatic ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-blue-500/10 text-blue-700 dark:text-blue-300")}>
                      {company.automatic ? "可自动读取" : "官网手动打开"}
                    </span>
                    {tone && <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", tone.chip)}>{tone.label}</span>}
                  </div>
                  {company.note && <p className="mt-1.5 text-xs leading-5 text-faint">{company.note}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] text-faint" title={company.url}>{company.url}</span>
                <div className="flex items-center gap-2">
                  {checked?.status === "broken" && <FixAffordance company={company.name} job={fixByCompany.get(company.name)} onFix={() => startJob({ title: `修复 · ${company.name}`, subtitle: "重新查找校招官网", kind: "fix-portal", input: company.name, page: "/portals" })} />}
                  {!company.automatic && <button type="button" onClick={() => setTutorialCompany(company)} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-brand/40 hover:text-brand" title={existingAdapter ? "适配器已生成，继续启用并绑定" : "先查看适配流程，再决定是否启动 Agent"}>{existingAdapter ? <Wrench className="size-3" /> : <Bot className="size-3" />}{existingAdapter ? "完成配置" : "Agent 适配"}</button>}
                  <button type="button" onClick={() => openEditor(company)} aria-label={`编辑 ${company.name}`} title="编辑招聘源" className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted hover:border-brand/40 hover:text-brand">
                    <Pencil className="size-3.5" />
                  </button>
                  <button type="button" onClick={() => { setDeleteTarget(company); setError(""); }} aria-label={`删除 ${company.name}`} title="删除招聘源" className="inline-flex size-8 items-center justify-center rounded-lg border border-border text-muted hover:border-red-500/40 hover:text-red-500">
                    <Trash2 className="size-3.5" />
                  </button>
                  <a href={company.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-brand/40 hover:text-brand">
                    打开官网 <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editor && (
        <PortalEditor
          company={editor}
          isNew={!originalName}
          categories={categories.filter((item) => item !== "全部类别")}
          saving={saving}
          error={error}
          onChange={setEditor}
          onClose={() => setEditor(null)}
          onSave={() => void saveCompany()}
        />
      )}
      {deleteTarget && (
        <ConfirmDelete
          company={deleteTarget}
          saving={saving}
          error={error}
          onClose={() => setDeleteTarget(null)}
          onDelete={() => void deleteCompany()}
        />
      )}
      {adapterOpen && (
        <AdapterManager
          adapters={adapters}
          companies={catalog}
          onClose={() => setAdapterOpen(false)}
          onChanged={async () => { await Promise.all([loadAdapters(), loadCatalog()]); }}
        />
      )}
      {tutorialCompany !== undefined && (
        <AdapterTutorial
          company={tutorialCompany}
          adapter={tutorialCompany ? adapters.find((item) => item.companies.includes(tutorialCompany.name) || item.name.includes(tutorialCompany.name)) : undefined}
          onClose={() => setTutorialCompany(undefined)}
          onManage={() => { setTutorialCompany(undefined); setAdapterOpen(true); }}
          onStart={(target) => {
            setTutorialCompany(undefined);
            startJob({ title: `适配 · ${target.name}`, subtitle: "用 Ego Lite 创建零 Token 适配器", kind: "adapt-provider", input: target.name, page: "/portals" });
          }}
        />
      )}
    </div>
  );
}

function AdapterTutorial({ company, adapter, onClose, onManage, onStart }: { company: CatalogCompany | null; adapter?: Adapter; onClose: () => void; onManage: () => void; onStart: (company: CatalogCompany) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="adapter-tutorial-title">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="adapter-tutorial-title" className="text-lg font-semibold">招聘源自动适配教程</h2><p className="mt-1 text-sm text-muted">{adapter ? `${company?.name} 的适配器 ${adapter.id} 已生成，但${adapter.enabled ? "尚未绑定企业" : "尚未启用和绑定"}，所以仍显示“官网手动打开”。` : company ? `${company.name} 目前还没有已启用并绑定的适配器，所以只能手动打开官网。` : "把“官网手动打开”升级为“可自动读取”，需要完成下面四步。"}</p></div>
          <button type="button" onClick={onClose} aria-label="关闭教程" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"><X className="size-4" /></button>
        </div>

        <ol className="mt-5 grid gap-3 text-sm">
          <li className="rounded-xl border border-border p-4"><strong>1. Agent 观察网站</strong><p className="mt-1 text-muted">Agent 用 Ego Lite 打开招聘官网，寻找公开 API 或页面数据。遇到登录、短信或验证码，会停下来交给你。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>2. 生成并测试插件</strong><p className="mt-1 text-muted">Agent 按模板生成固定解析规则，只测试这一家和离线样本，不运行全量岗位扫描。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>3. 你审核并启用</strong><p className="mt-1 text-muted">完成后进入“适配器插件”，点击启用，再把插件绑定到对应企业。新插件默认停用。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>4. 日常零 Token 读取</strong><p className="mt-1 text-muted">以后读取岗位只运行接口请求和固定解析代码，不调用模型。只有开发新适配器的这一次 Agent 任务消耗 Token。</p></li>
        </ol>

        <div className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          开始前请先在“设置”中配置可用的 Codex、Claude Code 或其他 AI 工具。没有配置时，任务无法启动。
        </div>

        {company && <p className="mt-4 break-all text-xs text-faint">目标：{company.name} · {company.url}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">先不适配</button>
          {company && <a href={company.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm">手动打开官网 <ExternalLink className="size-3.5" /></a>}
          {adapter ? <button type="button" onClick={onManage} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"><Wrench className="size-4" />打开适配器插件</button> : company && <button type="button" onClick={() => onStart(company)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"><Bot className="size-4" />开始 Agent 适配</button>}
        </div>
      </div>
    </div>
  );
}

function AdapterManager({ adapters, companies, onClose, onChanged }: { adapters: Adapter[]; companies: CatalogCompany[]; onClose: () => void; onChanged: () => Promise<void> }) {
  const [company, setCompany] = useState(companies.find((item) => !item.automatic)?.name || companies[0]?.name || "");
  const selected = companies.find((item) => item.name === company);
  const initialHost = (() => { try { return selected ? new URL(selected.url).hostname : ""; } catch { return ""; } })();
  const [id, setId] = useState("");
  const [host, setHost] = useState(initialHost);
  const [binding, setBinding] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function request(action: string, adapterId: string, extra: Record<string, unknown> = {}) {
    setBusy(`${action}:${adapterId}`); setError(""); setMessage("");
    try {
      const response = await fetch("/api/portals/adapters", {
        method: action === "remove" ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "remove" ? { id: adapterId } : { action, id: adapterId, ...extra }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "操作失败");
      setMessage(data.message || "已保存");
      await onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "操作失败"); }
    finally { setBusy(""); }
  }

  function changeCompany(next: string) {
    setCompany(next);
    const row = companies.find((item) => item.name === next);
    try { setHost(row ? new URL(row.url).hostname : ""); } catch { setHost(""); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="adapter-title">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="adapter-title" className="text-lg font-semibold">招聘源适配器插件</h2><p className="mt-1 text-xs text-faint">运行时只使用固定接口和解析规则，零 Token。点击“Agent 适配”开发新规则时会产生一次 Agent Token。</p></div>
          <button type="button" onClick={onClose} aria-label="关闭" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"><X className="size-4" /></button>
        </div>

        <form onSubmit={(event) => { event.preventDefault(); void request("scaffold", id, { company, host }); }} className="mt-5 grid gap-3 rounded-xl border border-border bg-surface-hover/40 p-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs text-muted">企业<select value={company} onChange={(event) => changeCompany(event.target.value)} className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">{companies.map((item) => <option key={item.name}>{item.name}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs text-muted">适配器 ID<input required pattern="[a-z0-9][a-z0-9-]*" value={id} onChange={(event) => setId(event.target.value.toLowerCase())} placeholder="例如 xiaohongshu" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" /></label>
          <label className="grid gap-1.5 text-xs text-muted sm:col-span-2">允许访问的 API 域名<input required value={host} onChange={(event) => setHost(event.target.value)} placeholder="jobs.example.com" className="min-h-10 rounded-lg border border-border bg-surface px-3 text-sm text-foreground" /></label>
          <div className="flex items-center justify-between gap-3 sm:col-span-2"><p className="text-xs text-faint">这里只生成已安装但未启用的安全模板，不会访问网站。</p><button disabled={!!busy} className="rounded-lg bg-brand px-3 py-2 text-xs font-medium text-brand-foreground disabled:opacity-50">生成插件模板</button></div>
        </form>

        <div className="mt-5 grid gap-3">
          {adapters.length === 0 && <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted">还没有招聘源插件。先生成模板，再让 Agent 完成解析规则。</p>}
          {adapters.map((adapter) => (
            <div key={adapter.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="flex items-center gap-2"><span className="font-medium">{adapter.name}</span><code className="text-xs text-faint">{adapter.id}</code><span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", adapter.enabled ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-surface-hover text-muted")}>{adapter.enabled ? "已启用" : "已停用"}</span></div><p className="mt-1 text-xs text-muted">{adapter.description}</p><p className="mt-1 text-[11px] text-faint">域名：{adapter.hosts.join(", ") || "无"} · 已绑定：{adapter.companies.join("、") || "无"}</p></div>
                <div className="flex gap-2"><button onClick={() => void request(adapter.enabled ? "disable" : "enable", adapter.id)} disabled={!!busy} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-50">{adapter.enabled ? <PowerOff className="size-3" /> : <Power className="size-3" />}{adapter.enabled ? "停用" : "启用"}</button>{adapter.local && <button onClick={() => { if (window.confirm(`卸载 ${adapter.id}？已绑定企业会自动解绑。`)) void request("remove", adapter.id); }} disabled={!!busy} className="rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs text-red-500 disabled:opacity-50">卸载</button>}</div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2"><select value={binding[adapter.id] || ""} onChange={(event) => setBinding({ ...binding, [adapter.id]: event.target.value })} className="min-h-9 rounded-lg border border-border bg-surface px-2 text-xs"><option value="">选择要绑定的企业</option>{companies.map((item) => <option key={item.name}>{item.name}</option>)}</select><button disabled={!binding[adapter.id] || !!busy} onClick={() => void request("bind", adapter.id, { company: binding[adapter.id] })} className="rounded-lg border border-border px-2.5 py-1.5 text-xs disabled:opacity-40">绑定</button></div>
            </div>
          ))}
        </div>
        {message && <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function PortalEditor({ company, isNew, categories, saving, error, onChange, onClose, onSave }: {
  company: CatalogCompany;
  isNew: boolean;
  categories: string[];
  saving: boolean;
  error: string;
  onChange: (company: CatalogCompany) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="portal-editor-title">
      <form onSubmit={(event) => { event.preventDefault(); onSave(); }} className="w-full max-w-lg rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id="portal-editor-title" className="text-lg font-semibold">{isNew ? "添加企业招聘源" : "编辑企业招聘源"}</h2>
          <button type="button" onClick={onClose} aria-label="关闭" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"><X className="size-4" /></button>
        </div>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-1.5 text-sm">企业名称<input required maxLength={120} value={company.name} onChange={(event) => onChange({ ...company, name: event.target.value })} className="min-h-11 rounded-xl border border-border bg-surface px-3 outline-none focus:border-brand/50" placeholder="例如：腾讯" /></label>
          <label className="grid gap-1.5 text-sm">校招官网链接<input required type="url" maxLength={2000} value={company.url} onChange={(event) => onChange({ ...company, url: event.target.value })} className="min-h-11 rounded-xl border border-border bg-surface px-3 outline-none focus:border-brand/50" placeholder="https://…" /></label>
          <label className="grid gap-1.5 text-sm">行业分类<input list="portal-categories" maxLength={120} value={company.category} onChange={(event) => onChange({ ...company, category: event.target.value })} className="min-h-11 rounded-xl border border-border bg-surface px-3 outline-none focus:border-brand/50" /><datalist id="portal-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist></label>
          <label className="grid gap-1.5 text-sm">备注<textarea maxLength={500} rows={3} value={company.note} onChange={(event) => onChange({ ...company, note: event.target.value })} className="rounded-xl border border-border bg-surface px-3 py-2 outline-none focus:border-brand/50" placeholder="登录要求、批次入口或其他说明" /></label>
        </div>
        <p className="mt-3 text-xs text-faint">新增或修改链接后，默认只作为官网入口保存，不会自动扫描。</p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">取消</button>
          <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground disabled:opacity-50">{saving && <Loader2 className="size-4 animate-spin" />}{isNew ? "添加" : "保存"}</button>
        </div>
      </form>
    </div>
  );
}

function ConfirmDelete({ company, saving, error, onClose, onDelete }: { company: CatalogCompany; saving: boolean; error: string; onClose: () => void; onDelete: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="portal-delete-title">
      <div className="w-full max-w-md rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
        <h2 id="portal-delete-title" className="text-lg font-semibold">删除 {company.name}？</h2>
        <p className="mt-2 break-all text-sm text-muted">{company.url}</p>
        <p className="mt-3 text-xs text-faint">只会从本机招聘源列表中删除，原配置会自动备份。</p>
        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">取消</button>
          <button type="button" disabled={saving} onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{saving && <Loader2 className="size-4 animate-spin" />}确认删除</button>
        </div>
      </div>
    </div>
  );
}

function FixAffordance({ company, job, onFix }: { company: string; job?: Job; onFix: () => void }) {
  if (job?.status === "running")
    return (
      <Link href={`/jobs/${job.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-brand">
        <Loader2 className="size-3 animate-spin" /> 正在修复…
      </Link>
    );
  if (job?.status === "done")
    return (
      <Link href={`/jobs/${job.id}`} className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
        已修复 · 重新检查
      </Link>
    );
  return (
    <button
      onClick={onFix}
      title={`让助手重新查找并验证 ${company} 的校招官网`}
      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-brand/40 hover:text-brand"
    >
      <Wrench className="size-3" /> 修复
    </button>
  );
}
