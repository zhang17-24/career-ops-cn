"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bot, ExternalLink, HelpCircle, Loader2, Pencil, Plus, Radar, Search, Trash2, Wrench, X } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { useJobs, type Job } from "@/components/jobs/job-store";
import { cn } from "@/lib/cn";

type CatalogCompany = { name: string; url: string; category: string; note: string; automatic: boolean; provider: string; state?: string };
type HealthCompany = { name: string; status: string; detail: string };
type Result = { available: boolean; configured: boolean; companies: HealthCompany[] };
type Adapter = { id: string; name: string; description: string; version: string; hosts: string[]; enabled: boolean; local: boolean; companies: string[] };
type RouteReview = { digest: string; entryUrl: string; officialUrl: string; allowedHosts: string[]; evidence: { fromUrl: string; toUrl: string; kind: string; note: string }[] };
type EnterpriseRun = { ticket: string; id: string; company: string; status: string; reason?: string; routeReview?: RouteReview; routeApproved?: boolean; routeError?: string; resumeBlocked?: string; publicAdaptationAuthorizedAt?: string };

const TONE: Record<string, { dot: string; label: string; chip: string }> = {
  live: { dot: "bg-emerald-500", label: "正常", chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  empty: { dot: "bg-amber-500", label: "正常 · 暂无岗位", chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  broken: { dot: "bg-red-500", label: "失效", chip: "bg-red-500/15 text-red-700 dark:text-red-400" },
  skipped: { dot: "bg-zinc-400", label: "不支持自动读取", chip: "bg-surface-hover text-muted" },
};
const ORDER: Record<string, number> = { broken: 0, empty: 1, live: 2, skipped: 3 };

export function PortalsView() {
  const searchParams = useSearchParams();
  const requestedAdapter = searchParams.get('adapter');
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
  const [enterpriseRuns, setEnterpriseRuns] = useState<EnterpriseRun[]>([]);
  const [adapterCompany, setAdapterCompany] = useState<CatalogCompany | null>(null);
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
      .then((data) => { setAdapters(Array.isArray(data.adapters) ? data.adapters : []); setEnterpriseRuns(Array.isArray(data.enterpriseRuns) ? data.enterpriseRuns : []); })
      .catch(() => setAdapters([]));
  }

  useEffect(() => {
    void loadCatalog();
    void loadAdapters();
  }, []);

  // A task's review action opens exactly its enterprise; never starts AI or approves.
  const [openedAdapter, setOpenedAdapter] = useState<string | null>(null);
  useEffect(() => {
    if (!requestedAdapter || openedAdapter === requestedAdapter) return;
    const company = catalog.find(c => c.name === requestedAdapter);
    if (company) { setQuery(company.name); setAdapterCompany(company); setOpenedAdapter(requestedAdapter); }
  }, [requestedAdapter, openedAdapter, catalog]);

  const jobStates = jobs.map(j => `${j.id}:${j.status}`).join("|");
  useEffect(() => { void loadAdapters(); void loadCatalog(); }, [jobStates]);

  function belongs(adapter: Adapter, company: CatalogCompany) {
    return adapter.companies.includes(company.name) || enterpriseRuns.some(r => r.id === adapter.id && r.company === company.name) || adapter.name.replace(/\s*(校招)?\s*招聘源适配器$/, "").trim() === company.name;
  }

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
        <span className="text-xs text-muted">适配器在对应企业的「适配器设置」中管理</span>
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
        共 <span className="font-medium text-foreground">{catalog.length}</span> 家 · {categories.length - 1} 类 · {automatic} 家已配置自动读取（待检查） · 当前显示 {shown.length} 家
      </p>

      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {shown.map((company) => {
          const checked = health.get(company.name);
          const tone = checked ? (TONE[checked.status] ?? TONE.skipped) : null;
          const existingAdapter = adapters.find((adapter) => belongs(adapter, company));
          return (
            <li key={company.name} className="rounded-2xl border border-border bg-surface/40 p-4">
              <div className="flex items-start gap-3">
                <CompanyLogo name={company.name} size={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{company.name}</span>
                    <span className="rounded bg-surface-hover px-1.5 py-0.5 text-[10px] text-muted">{company.category}</span>
                    <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", company.automatic ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-blue-500/10 text-blue-700 dark:text-blue-300")}>
                      {tone ? tone.label : company.state || "官网手动打开"}
                    </span>
                    {tone && <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", tone.chip)}>{tone.label}</span>}
                  </div>
                  {company.note && <p className="mt-1.5 text-xs leading-5 text-faint">{company.note}</p>}
                  {checked?.detail && <p className="mt-1.5 text-xs leading-5 text-muted">检查结果：{checked.detail}</p>}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] text-faint" title={company.url}>{company.url}</span>
                <div className="flex items-center gap-2">
                  {checked?.status === "broken" && <FixAffordance company={company.name} job={fixByCompany.get(company.name)} onFix={() => startJob({ title: `修复 · ${company.name}`, subtitle: "重新查找校招官网", kind: "fix-portal", input: company.name, page: "/portals" })} />}
                  <button type="button" onClick={() => { setAdapterCompany(company); void loadAdapters(); }} className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted hover:border-brand/40 hover:text-brand"><Wrench className="size-3" />{existingAdapter ? "适配器设置" : "Agent 适配"}</button>
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
{adapterCompany && <EnterpriseAdapterPanel company={adapterCompany} adapters={adapters.filter(a => belongs(a, adapterCompany))} runs={enterpriseRuns.filter(r => r.company === adapterCompany.name)} onClose={() => setAdapterCompany(null)} onChanged={async () => { await Promise.all([loadAdapters(), loadCatalog()]); }} onStart={(adapterTicket, recoveryNote, managedPublic) => { startJob({ title: `${adapterTicket ? "续接适配" : "适配"} · ${adapterCompany.name}`, subtitle: "真实验收通过后自动安装绑定；失败保留旧版", kind: "adapt-provider", input: adapterCompany.name, page: "/portals", adapterTicket, recoveryNote, managedPublic }); setAdapterCompany(null); }} />}
      {tutorialCompany !== undefined && (
        <AdapterTutorial
          company={tutorialCompany}
          adapter={tutorialCompany ? adapters.find((item) => item.companies.includes(tutorialCompany.name) || item.name.includes(tutorialCompany.name)) : undefined}
          onClose={() => setTutorialCompany(undefined)}
          onManage={() => { if (tutorialCompany) setAdapterCompany(tutorialCompany); setTutorialCompany(undefined); }}
          onStart={(target) => {
            setTutorialCompany(undefined);
            setAdapterCompany(target);
            void loadAdapters();
          }}
        />
      )}
    </div>
  );
}

function EnterpriseAdapterPanel({ company, adapters, runs, onClose, onChanged, onStart }: { company: CatalogCompany; adapters: Adapter[]; runs: EnterpriseRun[]; onClose: () => void; onChanged: () => Promise<void>; onStart: (ticket?: string, recoveryNote?: string, managedPublic?: boolean) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [confirmedDigest, setConfirmedDigest] = useState("");
  const [recoveryNote, setRecoveryNote] = useState("");
  const [managedPublic, setManagedPublic] = useState(false);
  const active = runs.some(r => ["developing", "verifying"].includes(r.status));
  async function action(action: string, extra: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/portals/adapters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, company: company.name, ...extra }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "操作失败");
      setDeleteId(""); await onChanged();
    } catch (e) { setError(e instanceof Error ? e.message : "操作失败"); } finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="enterprise-adapter-title">
    <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
      <div className="flex items-center justify-between"><h2 id="enterprise-adapter-title" className="text-lg font-semibold">{company.name} · 适配器设置</h2><button aria-label="关闭适配器设置" onClick={onClose}><X className="size-5" /></button></div>
      <p className="mt-3 text-sm text-muted">只管理这家企业。一次授权后，Agent 可沿官网公开招聘链接、API 和必要资源连续适配，不反复审批普通路线变化。平台仍须验证真实列表和三个详情，成功自动安装，失败保留旧版；不会自动循环消耗 Token。</p>
      <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" checked={managedPublic} onChange={e => setManagedPublic(e.target.checked)} />一次授权本候选公开招聘适配及验收后安装（保存后重试沿用）。不含投递、登录凭证、内网或其他企业；不勾选则逐次审核路线。</label>
      {error && <p role="alert" className="mt-3 text-sm text-red-500">{error}</p>}
      <button disabled={busy || active} onClick={() => onStart(undefined, undefined, managedPublic)} className="mt-4 rounded-lg bg-brand px-4 py-2 text-sm text-brand-foreground disabled:opacity-40">{active ? "适配任务进行中" : managedPublic ? "授权并开始适配（保留旧版）" : adapters.length ? "重新适配（保留旧版）" : "开始 Agent 适配"}</button>
      <p className="mt-2 text-xs text-faint">点击会启动 AI 开发任务并消耗 Token；不是日常零 Token 扫描。</p>
      {runs.filter(r => ["failed", "awaiting_review"].includes(r.status)).map(r => <div key={`retry-${r.ticket}`} className="mt-3 rounded-lg border border-border p-3 text-xs">
        <p className="break-all">候选 {r.id}</p>
        {r.reason && <p role="alert" className={r.status === "failed" ? "mt-2 text-red-500" : "mt-2 text-amber-600"}>{r.reason}</p>}
        {r.publicAdaptationAuthorizedAt && <p className="mt-2 text-emerald-600">已保存一次授权，重试无需再次授权。</p>}
        {r.routeError && <p role="alert" className="mt-2 text-red-500">路线申请无效：{r.routeError}</p>}
        {r.routeReview && <details open={!r.routeApproved} className={`mt-3 space-y-2 rounded-lg border p-3 text-sm ${r.routeApproved ? "border-border" : "border-amber-500/40"}`}>
          <summary className="cursor-pointer font-semibold">{r.routeApproved ? "招聘路线已授权（点击查看）" : "招聘入口与域名待审核"}</summary>
          <p>原入口：<span className="break-all">{company.url}</span></p>
          <p>拟用入口：<a className="break-all text-brand underline" href={r.routeReview.entryUrl} target="_blank" rel="noreferrer">{r.routeReview.entryUrl}</a></p>
          <p className="break-all">申请访问的精确域名：{r.routeReview.allowedHosts.join("、")}</p>
          <p className="text-muted">以下是 Agent 提供的线索，不等于已验证。请核实企业身份和官方招聘跳转，不要仅凭域名相似就批准。</p>
          <ol className="list-inside list-decimal space-y-2">{r.routeReview.evidence.map((e, i) => <li key={i} className="break-all"><a href={e.fromUrl} target="_blank" rel="noreferrer" className="text-brand underline">{e.fromUrl}</a> → <a href={e.toUrl} target="_blank" rel="noreferrer" className="text-brand underline">{e.toUrl}</a><p className="text-muted">{e.note}</p></li>)}</ol>
          {!r.routeApproved && <>
            <label className="flex items-start gap-2"><input type="checkbox" checked={confirmedDigest === r.routeReview.digest} onChange={e => setConfirmedDigest(e.target.checked ? r.routeReview!.digest : "")} />我已核对以上官网证据，同意仅此候选访问列出的域名</label>
            <button disabled={busy || active || confirmedDigest !== r.routeReview.digest} onClick={() => void action("approve-route", { ticket: r.ticket, digest: r.routeReview!.digest, confirmed: true })} className="rounded-lg bg-brand px-3 py-2 text-brand-foreground disabled:opacity-40">批准路线（不调用 AI、不安装）</button>
          </>}
        </details>}
        {r.resumeBlocked && <p role="status" className="mt-2 text-muted">{r.resumeBlocked}</p>}
        <label className="mt-2 block">补充说明（可选，不需要你提供技术方案）<textarea value={recoveryNote} onChange={e => setRecoveryNote(e.target.value)} maxLength={500} className="mt-1 w-full rounded border border-border bg-[var(--surface)] p-2" placeholder="可以留空，Agent 会读取上次失败原因并修复" /></label>
        <button disabled={busy || active || (!(managedPublic || r.publicAdaptationAuthorizedAt) && (!!r.routeError || (!!r.routeReview && !r.routeApproved)))} onClick={() => onStart(r.ticket, recoveryNote, managedPublic)} className="mr-2 mt-2 rounded-lg border border-brand px-3 py-2 text-brand disabled:opacity-40">{managedPublic && !r.publicAdaptationAuthorizedAt ? "授权并重试修复" : "重试修复"}（原候选，消耗 Token）</button>
        <button disabled={busy || active || !!r.routeError || (!!r.routeReview && !r.routeApproved)} onClick={() => void action("retry", { ticket: r.ticket })} className="mt-2 rounded-lg border border-border px-3 py-2 disabled:opacity-40">{busy ? "正在处理…" : "仅重新验收（零 Token）"}</button>
        <p className="mt-1 text-muted">代码修复后可用。只检查此候选的一页列表和三条详情，通过自动安装；不调用模型、不重新开发。旧绑定保留到验收通过。</p>
      </div>)}
      {adapters.map(a => <div key={a.id} className="mt-3 rounded-xl border border-border p-3 text-sm"><p>{a.name} · {a.enabled && a.companies.includes(company.name) ? "已启用并绑定" : "未启用或未绑定"}</p><p className="text-xs text-faint">{a.id}</p>{a.local && <button disabled={busy || active} onClick={() => setDeleteId(a.id)} className="mt-2 text-red-500 disabled:opacity-40">删除到回收区</button>}</div>)}
      {deleteId && <div className="mt-3 rounded-xl border border-red-500/30 p-3 text-sm"><p>删除此适配器并解除绑定？企业入口、岗位和投递记录不受影响，可从下方恢复文件。</p><button disabled={busy} onClick={() => void action("trash", { id: deleteId })} className="mr-4 mt-2 text-red-500">确认移入回收区</button><button onClick={() => setDeleteId("")}>取消</button></div>}
      {runs.map(r => <div key={r.ticket} className="mt-3 border-t border-border pt-3 text-xs"><p>{r.id} · {({ developing: "开发中", verifying: "验收中", awaiting_review: "等待路线审核（未安装）", installed: "验收通过并安装", failed: "未安装", trashed: "回收区", restored: "已恢复文件（停用）", cancelled: "已取消" } as Record<string,string>)[r.status] || r.status}</p>{r.reason && <p role="status" className="mt-1 text-amber-700 dark:text-amber-400">{r.reason}</p>}{r.status === "trashed" && <button disabled={busy} onClick={() => void action("restore", { ticket: r.ticket })} className="mt-2 text-brand">恢复文件（不自动启用）</button>}{["developing", "verifying"].includes(r.status) && <button disabled={busy} onClick={() => void action("cancel", { ticket: r.ticket })} className="mt-2 text-red-500">取消自动安装资格（不会停止 AI 进程）</button>}</div>)}
    </div>
  </div>;
}

function AdapterTutorial({ company, adapter, onClose, onManage, onStart }: { company: CatalogCompany | null; adapter?: Adapter; onClose: () => void; onManage: () => void; onStart: (company: CatalogCompany) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="adapter-tutorial-title">
      <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div><h2 id="adapter-tutorial-title" className="text-lg font-semibold">招聘源自动适配教程</h2><p className="mt-1 text-sm text-muted">{adapter ? `${company?.name} 的适配器 ${adapter.id} 已生成。请在该企业的适配器设置中查看状态或重新适配。` : company ? `${company.name} 目前还没有已启用并绑定的适配器，所以只能手动打开官网。` : "把“官网手动打开”升级为“可自动读取”，需要完成下面四步。"}</p></div>
          <button type="button" onClick={onClose} aria-label="关闭教程" className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"><X className="size-4" /></button>
        </div>

        <details className="mt-4 rounded-xl border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium">真实数据验收规则（Agent 必须遵守）</summary>
          <p className="mt-3 text-muted">正式结果禁止使用 mock 或示例兜底。必须记录官网来源与时间，实际点击核对最多三个岗位的名称、编号和详情；不能猜链接，也不能用离线测试代替真实验收。</p>
          <p className="mt-2 text-muted">下线、404 标失效；登录、验证码、超时标待确认。新插件默认停用，审核启用后检查绑定、文件信任和实际加载，再只扫描该企业验收。修改后的插件须审核后更新信任。</p>
          <p className="mt-2 text-muted">证据保存在插件目录 ACCEPTANCE.md。缺少证据只能标待验收，不能宣布成功。完整规则：docs/招聘源适配验收SOP.md。</p>
        </details>
        <details className="mt-4 rounded-xl border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium">官网打不开、跳转飞书或 Moka，怎么继续？</summary>
          <p className="mt-3 text-muted">Agent 会先核实企业官网，再沿“加入我们/招聘”的实际链接找入口。最多一次企业搜索和三个导航页面；不会猜接口或用搜索结果当岗位。</p>
          <p className="mt-2 text-muted">推荐在企业设置勾选“一次授权”再开始。授权保存在该候选中，Agent 沿本企业官网公开路线连续开发，不因普通入口或必要资源变化反复审批。没有开启一次授权时，才逐次核实来源链、批准路线。</p>
          <p className="mt-2 text-muted">失败可直接“重试修复”，无需填写技术方案；代码已完成可“仅重新验收（零 Token）”。真实列表和三个详情通过后自动绑定，失败保留旧版。登录、验证码、来源身份冲突仍需人工处理；不会自动循环调用 AI。</p>
        </details>
        <details className="mt-4 rounded-xl border border-border p-4 text-sm">
          <summary className="cursor-pointer font-medium">Agent 报错或接口 401，怎么处理？</summary>
          <p className="mt-3 text-muted">点击前先滚动让目标出现在屏幕内，确认没有遮挡；全页快照中的元素可能仍在屏幕外。点击失败先核对真实 href，并检查新标签；已有验收记录中的真实官网链接可直接重新打开核验当前正文，不必重复弹窗点击。核验后关闭临时详情标签。等待职位正文加载，不把空壳当404。代码交付前必须通过插件静态检查。代码修好后可点企业设置里的“仅重新验收（零 Token）”，无需重新跑 Agent；通过才自动安装。</p>
          <p className="mt-3 text-muted">Codex 报“只读 / 无法创建临时文件”：到设置查看“Codex 完全访问（仅本平台）”。开启会持久保存，新任务生效；允许访问项目外文件，请了解风险。平台在调用模型前检查候选写权限和 Ego Lite 连接，失败不调用 AI。旧失败任务不会自动重跑。项目网页常驻不等于 Agent 已有写权限。</p>
          <p className="mt-3 text-muted">先查错误末行和已有 ACCEPTANCE.md，不重跑整套任务。AI 服务政策拒绝不代表官网不可读；不自动重试或切换模型规避政策。</p>
          <p className="mt-2 text-muted">接口 401 时，先从官网导航打开列表，等待真实岗位加载。浏览器能读就记录浏览器路线；可用固定脚本解析真实页面，但必须另做插件接入与验收。页面确实要求登录或验证码时，才交给用户完成，不绕过。</p>
          <p className="mt-2 text-muted">只查一页列表、最多三个详情。同一失败最多一次有依据的修正验证；不猜接口、不反复分析前端包。2026-09-10 已分别核对小红书 21907、快手 13101 的真实详情，证明浏览器路线可行，不代表插件已启用或全面验收。</p>
        </details>
        <ol className="mt-5 grid gap-3 text-sm">
          <li className="rounded-xl border border-border p-4"><strong>1. Agent 观察网站</strong><p className="mt-1 text-muted">Agent 用 Ego Lite 打开招聘官网，寻找公开 API 或页面数据。遇到登录、短信或验证码，会停下来交给你。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>2. 生成并测试插件</strong><p className="mt-1 text-muted">Agent 按模板生成固定解析规则，只测试这一家和离线样本，不运行全量岗位扫描。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>3. 平台验收并自动安装</strong><p className="mt-1 text-muted">平台独立核验真实列表和三个详情，通过后自动启用并绑定本企业；失败保留旧版。</p></li>
          <li className="rounded-xl border border-border p-4"><strong>4. 日常零 Token 读取</strong><p className="mt-1 text-muted">以后读取岗位只运行接口请求和固定解析代码，不调用模型。只有开发新适配器的这一次 Agent 任务消耗 Token。</p></li>
        </ol>

        <div className="mt-5 rounded-xl bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-300">
          开始前请先在“设置”中配置可用的 Codex、Claude Code 或其他 AI 工具。没有配置时，任务无法启动。
        </div>

        {company && <p className="mt-4 break-all text-xs text-faint">目标：{company.name} · {company.url}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">先不适配</button>
          {company && <a href={company.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-sm">手动打开官网 <ExternalLink className="size-3.5" /></a>}
          {adapter ? <button type="button" onClick={onManage} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"><Wrench className="size-4" />打开企业适配器设置</button> : company && <button type="button" onClick={() => onStart(company)} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"><Bot className="size-4" />开始 Agent 适配</button>}
        </div>
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
