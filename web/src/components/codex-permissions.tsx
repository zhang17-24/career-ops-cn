"use client";
import { useEffect, useState } from "react";

// Per-CLI consent for the enterprise-adapter runtimes.
//
// Two separate toggles, deliberately. Codex and WorkBuddy are different programs
// with different blast radii, and the enterprise-adapter flow is the only thing
// that needs either — so one switch covering both would let a user who ticked
// "Codex" find an agent writing files under WorkBuddy they never authorised.
// The copy for each says which program it applies to, and the confirm dialog
// names the program too, because the checkbox alone is easy to misread.

type Consent = { fullAccess: boolean; workbuddyFullAccess: boolean };

export function CodexPermissions() {
  const [state, setState] = useState<Consent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirming, setConfirming] = useState<null | "codex" | "workbuddy">(null);

  useEffect(() => {
    fetch("/api/codex-permissions", { cache: "no-store" }).then(async r => {
      const d = await r.json(); if (!r.ok) throw new Error(d.error); setState(d);
    }).catch(e => setMessage(e.message));
  }, []);

  async function save(patch: Partial<Consent>) {
    setBusy(true);
    try {
      const r = await fetch("/api/codex-permissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
      const d = await r.json(); if (!r.ok) throw new Error(d.error);
      setState(d); setMessage("已保存到本机，刷新或重启后保留；新任务生效。");
      setConfirming(null);
    } catch (e) { setMessage(e instanceof Error ? e.message : "保存失败"); }
    finally { setBusy(false); }
  }

  const rows = [
    {
      id: "codex" as const,
      key: "fullAccess" as const,
      title: "Codex 完全访问（仅本平台）",
      hint: "开启后不限制在项目目录内，也不逐次请求批准。关闭后恢复 Codex 原有配置。不修改全局配置，不影响已运行任务，不能绕过 macOS 权限。浏览器使用 Ego Lite；投递仍需用户确认。",
      on: "已开启，设置持久保存",
      off: "未开启，使用 Codex 原有配置",
    },
    {
      id: "workbuddy" as const,
      key: "workbuddyFullAccess" as const,
      title: "WorkBuddy 完全访问（仅本平台）",
      hint: "开启后 WorkBuddy 可以修改项目文件，用于企业适配时生成适配器。与 Codex 的开关相互独立，只影响 WorkBuddy。浏览器使用 Ego Lite；投递仍需用户确认。",
      on: "已开启，设置持久保存",
      off: "未开启，WorkBuddy 仅能使用常规功能",
    },
  ];

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4 text-sm">
      {rows.map((row) => {
        const value = state ? state[row.key] : null;
        return (
          <div key={row.id} className="border-b border-border py-3 first:pt-0 last:border-b-0 last:pb-0">
            <label className="flex items-center gap-3 font-medium">
              <input type="checkbox" checked={value === true} disabled={value === null || busy || confirming !== null} onChange={() => (value ? void save({ [row.key]: false }) : setConfirming(row.id))} />
              {row.title}
            </label>
            <p className="mt-2 text-xs text-muted">{row.hint}</p>
            {confirming === row.id && <div role="group" aria-label={`确认 ${row.title}`} className="mt-3 rounded-lg border border-amber-500 bg-surface p-3">
              <p>完全访问允许修改系统账户可访问的文件，不限于项目。确认仅为本平台的新 {row.id === "codex" ? "Codex" : "WorkBuddy"} 任务开启？</p>
              <div className="mt-3 flex gap-3">
                <button type="button" disabled={busy} onClick={() => void save({ [row.key]: true })} className="rounded-lg border border-border px-3 py-2">{busy ? "正在保存…" : `确认开启 ${row.id === "codex" ? "Codex" : "WorkBuddy"} 完全访问`}</button>
                <button type="button" disabled={busy} onClick={() => setConfirming(null)} className="rounded-lg border border-border px-3 py-2">取消</button>
              </div>
            </div>}
            <p role="status" className="mt-2 text-xs">{value === null ? "正在读取权限…" : value ? row.on : row.off}</p>
          </div>
        );
      })}
      {message && <p role="status" className="mt-2 text-xs">{message}</p>}
    </section>
  );
}
