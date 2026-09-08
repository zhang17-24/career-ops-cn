"use client";
import { useEffect, useState } from 'react';
type Skill = { id: string; group: string; version: number; name: string; description: string; entry: string; enabled: boolean; deleted: boolean; ready: boolean; files: { path: string; size: number }[] };
const btn = 'rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-40';
export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]); const [id, setId] = useState('');
  const [trash, setTrash] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [name, setName] = useState(''); const [description, setDescription] = useState(''); const [entry, setEntry] = useState('');
  const [file, setFile] = useState(''); const [preview, setPreview] = useState(''); const [group, setGroup] = useState('');
  const selected = skills.find(s => s.id === id);
  async function request(init?: RequestInit) { const r = await fetch('/api/skills', init); const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; }
  async function refresh() { setSkills((await request()).skills); }
  useEffect(() => { refresh().catch(e => setError(e.message)); }, []);
  useEffect(() => { setName(selected?.name || ''); setDescription(selected?.description || ''); setEntry(selected?.entry || ''); setFile(''); setPreview(''); }, [selected]);
  async function act(fn: () => Promise<void>) { setBusy(true); setError(''); try { await fn(); } catch(e) { setError(e instanceof Error ? e.message : '操作失败'); } finally { setBusy(false); } }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    await act(async () => { const list = Array.from(files); if (list.length > 500 || list.reduce((n,f) => n+f.size,0)>50*1024*1024) throw new Error('最多500个文件、50 MB');
      const form = new FormData(); for (const f of list) { form.append('files', f); form.append('paths', f.webkitRelativePath || f.name); } form.append('group', group);
      const d = await request({ method:'POST', body:form }); await refresh(); setTrash(false); setId(d.id);
    });
  }
  async function update(action: string) {
    if (!selected) return;
    if (action === 'enable' && !confirm('确认已审核此版本？外部 Agent 可按具体任务读取并执行本地代码；此操作不会立即执行，且会停用同技能的旧版本。')) return;
    if (action === 'delete' && !confirm('移入回收区？文件仍保留，可恢复。')) return;
    await act(async () => { await request({ method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,action,name,description,entry}) }); await refresh(); });
  }
  async function view(rel: string) { await act(async () => { const r=await fetch(`/api/skills?id=${id}&file=${encodeURIComponent(rel)}`); const d=await r.json(); if(!r.ok)throw new Error(d.error);setFile(rel);setPreview(d.content === null ? '此类型不提供在线预览，请下载原文件查看。' : d.content + (d.truncated ? '\n（仅预览前100 KB，下载可查看完整内容）' : '')); }); }
  return <main className="mx-auto max-w-7xl p-6">
    <h1 className="text-2xl font-semibold">技能库</h1>
    <p className="my-3 text-sm text-muted">完整保存代码、文档和嵌套目录。上传默认停用，不执行文件。仅外部 Codex、Claude Code 等工具按需读取，暂不接平台内 Agent。</p>
    <div className="rounded-xl border border-border bg-surface p-4 text-sm">外部 Agent 在项目根目录执行 <code>node skill-center.mjs</code>，只获得启用技能的名称、用途和入口，再按任务读取必要文件。技能不会绕过外部工具的权限；删除数据、发送简历、投递、向外上传文件仍须单独确认。</div>
    <div className="my-4 flex flex-wrap gap-3 items-center">
      <select aria-label="上传版本归属" className={btn} value={group} onChange={e=>setGroup(e.target.value)}><option value="">上传为新技能</option>{skills.filter((s,i,a)=>a.findIndex(x=>x.group===s.group)===i).map(s=><option key={s.group} value={s.group}>新版本：{s.name || '未命名技能'}</option>)}</select>
      <label className={btn}>上传 ZIP<input aria-label="上传 ZIP" className="block max-w-60" type="file" accept=".zip" disabled={busy} onChange={e=>{void upload(e.target.files);e.target.value='';}} /></label>
      <label className={btn}>上传文件夹<input aria-label="上传文件夹" className="block max-w-60" type="file" multiple {...{webkitdirectory:''}} disabled={busy} onChange={e=>{void upload(e.target.files);e.target.value='';}} /></label>
      <button className={btn} onClick={()=>setTrash(!trash)}>{trash?'返回技能库':'回收区'}</button>
    </div>
    <p className="text-xs text-muted">每包最多50 MB、500个文件；拒绝符号链接和越界路径。文本可预览，其他文件保留原件下载。</p>
    {error&&<p role="alert" className="my-3 text-red-500">{error}</p>}{busy&&<p role="status">处理中…</p>}
    <div className="mt-5 grid gap-5 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-2">{skills.filter(s=>s.deleted===trash).map(s=><button key={s.id} className={`${btn} w-full text-left ${id===s.id?'border-brand':''}`} onClick={()=>setId(s.id)}>{s.name||'待完善技能'} · v{s.version}<span className="block text-xs text-muted">{s.deleted?'回收区':s.enabled?'已启用':s.ready?'停用':'待完善'} · {s.files.length} 个文件</span></button>)}{!skills.some(s=>s.deleted===trash)&&<p>这里还没有技能。</p>}</aside>
      {selected&&<section className="min-w-0 rounded-xl border border-border p-4 space-y-3">
        <label className="block">名称<input className={`${btn} block w-full`} maxLength={80} value={name} disabled={busy||selected.enabled} onChange={e=>setName(e.target.value)}/></label>
        <label className="block">用途描述<textarea className={`${btn} block w-full`} maxLength={500} value={description} disabled={busy||selected.enabled} onChange={e=>setDescription(e.target.value)}/></label>
        <label className="block">入口文件<select className={`${btn} block w-full`} value={entry} disabled={busy||selected.enabled} onChange={e=>setEntry(e.target.value)}><option value="">请选择</option>{selected.files.map(f=><option key={f.path}>{f.path}</option>)}</select></label>
        <div className="flex flex-wrap gap-2"><button className={btn} disabled={busy||selected.enabled} onClick={()=>void update('metadata')}>保存说明</button>{selected.deleted?<button className={btn} disabled={busy} onClick={()=>void update('restore')}>恢复（保持停用）</button>:<><button className={btn} disabled={busy||!selected.ready} onClick={()=>void update(selected.enabled?'disable':'enable')}>{selected.enabled?'停用':'启用此版本'}</button><button className={btn} disabled={busy} onClick={()=>void update('delete')}>移入回收区</button></>}</div>
        <h2>文件列表（只读）</h2><div className="max-h-48 overflow-auto">{selected.files.map(f=><button className="block text-sm text-brand underline" key={f.path} disabled={busy} onClick={()=>void view(f.path)}>{f.path} · {f.size} 字节</button>)}</div>
        {file&&<><a className="text-brand underline" href={`/api/skills?id=${id}&file=${encodeURIComponent(file)}&download=1`}>下载原文件：{file}</a><pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs">{preview}</pre></>}
      </section>}
    </div>
  </main>;
}
