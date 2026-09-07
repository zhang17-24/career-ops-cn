"use client";
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseCvStream } from '@/lib/cv/quality';
type Resume = { id: string; name: string; type: string; ext: string; text: string; warning: string; markdown?: string };
const button = 'rounded-lg border border-border bg-surface px-3 py-2 text-sm disabled:opacity-40';
async function api(url: string, init?: RequestInit) {
  const r = await fetch(url, init); const d = await r.json();
  if (!r.ok) throw new Error(d.error || '请求失败');
  return d;
}
const json = (body: unknown, method = 'POST') => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export function CvWorkspace() {
  const [files, setFiles] = useState<Resume[]>([]);
  const [selected, setSelected] = useState<Resume | null>(null);
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([api('/api/cv'), api('/api/cv/files')]).then(async ([cv, list]) => {
      setFiles(list.files);
      if (list.files.length) {
        const file = await api(`/api/cv/files?id=${list.files[0].id}`);
        setSelected(file); setContent(file.markdown || '');
      } else setContent(cv.content || '');
    }).catch(e => setError(e.message)).finally(() => setBusy(false));
  }, []);
  async function act(fn: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('');
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : '操作失败'); }
    finally { setBusy(false); }
  }
  function canSwitch() { return !dirty || window.confirm('当前结果尚未保存，是否放弃修改？'); }
  async function choose(id: string) {
    if (!canSwitch()) return;
    await act(async () => { const f = await api(`/api/cv/files?id=${id}`); setSelected(f); setContent(f.markdown || ''); setDirty(false); });
  }
  async function upload(file: File) {
    if (!canSwitch()) return;
    await act(async () => {
      if (file.size > 15 * 1024 * 1024) throw new Error('文件不能超过 15 MB');
      const form = new FormData(); form.append('file', file);
      const f = await api('/api/cv/files', { method: 'POST', body: form });
      const full = await api(`/api/cv/files?id=${f.id}`);
      setFiles(prev => [f, ...prev.filter(x => x.id !== f.id)]);
      setSelected(full); setContent(full.markdown || ''); setDirty(false);
      setMessage('原件已保存在本机。上传未调用 AI。');
    });
  }
  async function saveResult(markdown: string) {
    if (selected) await api('/api/cv/files', json({ id: selected.id, markdown }, 'PUT'));
  }
  async function analyze() {
    if (!selected || !canSwitch()) return;
    await act(async () => {
      const existing = await api(`/api/cv/files?id=${selected.id}`);
      if (existing.markdown) { setContent(existing.markdown); setDirty(false); setMessage('已复用保存结果，未调用 AI。'); return; }
      const cliId = JSON.parse(localStorage.getItem('career-ops:config') || '{}').cliId;
      if (!cliId) throw new Error('请先在设置中连接 AI 工具');
      const r = await fetch('/api/cv/ingest', json({ fileId: selected.id, cliId }));
      if (!r.ok) throw new Error((await r.json()).error || '分析失败');
      if (!r.body) throw new Error('没有收到分析结果');
      const reader = r.body.getReader(); const decoder = new TextDecoder(); let output = '';
      for (;;) { const { done, value } = await reader.read(); if (done) break; output += decoder.decode(value, { stream: true }); }
      output += decoder.decode();
      const parsed = parseCvStream(output);
      if (parsed.error || !output.includes('<<cv:end>>') || !parsed.markdown.trim()) throw new Error('分析未完整完成，未保存；请检查 AI 工具连接后重试。');
      setContent(parsed.markdown); setDirty(true);
      await saveResult(parsed.markdown); setDirty(false);
      setMessage('分析结果已保存。核对后可设为当前简历。');
    });
  }
  const original = selected ? `/api/cv/files?id=${selected.id}&original=1` : '';
  return <div className="mx-auto max-w-7xl px-6 py-8">
    <h1 className="text-2xl font-semibold">我的简历</h1>
    <p className="mt-2 text-sm text-muted">上传原件 → 预览 → 按需分析成 Markdown → 确认后供 Agent 使用。</p>
    <p className="mt-1 text-xs text-muted">上传、预览、文字提取不消耗模型 Token。Agent 分析会将材料发送给你配置的模型服务；保存结果可直接复用。</p>
    <div className="my-5 flex flex-wrap items-center gap-3">
      <label className={button}>上传简历<input aria-label="上传简历" type="file" disabled={busy} className="ml-3 max-w-60" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md" onChange={e => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ''; }} /></label>
      <select aria-label="已上传简历" className={button} disabled={busy} value={selected?.id || ''} onChange={e => void choose(e.target.value)}>
        {!files.length && <option value="">尚未上传原件</option>}{files.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select><span className="text-xs text-muted">PDF、Word、图片，最大 15 MB</span>
    </div>
    {error && <p role="alert" className="mb-4 text-red-500">{error}</p>}
    <p role="status" className="mb-4 text-sm text-muted">{busy ? '处理中，请稍候…' : message}</p>
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between"><h2>简历原件</h2>{selected && <a className="text-sm text-brand" href={original} target="_blank" rel="noreferrer">打开 / 下载原件</a>}</div>
        {!selected ? <p className="py-20 text-center text-muted">上传后，这里显示原件预览。</p>
          : selected.type.startsWith('image/') ? <img src={original} alt={selected.name} className="max-h-[70vh] w-full object-contain bg-white" />
          : selected.ext === '.pdf' ? <iframe title="简历 PDF 原件" src={original} className="h-[70vh] w-full rounded-lg bg-white" />
          : <><p className="mb-2 text-xs text-muted">文字预览（Word 排版请下载原件查看）</p><pre className="h-[65vh] overflow-auto whitespace-pre-wrap text-sm">{selected.text || '未提取到文字'}</pre></>}
        {selected?.warning && <p className="mt-3 text-sm text-amber-600">{selected.warning}</p>}
      </section>
      <section className="min-w-0 rounded-2xl border border-border bg-surface p-4">
        <h2 className="mb-3">Markdown 结果</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <button className={button} disabled={busy || !selected} onClick={() => void analyze()}>Agent 分析 / 复用结果</button>
          <button className={button} disabled={busy || !selected?.text || !!content} onClick={() => { setContent(selected!.text); setDirty(true); }}>使用提取文字（零 Token）</button>
          <button className={button} disabled={busy} onClick={() => setEditing(!editing)}>{editing ? '预览' : '编辑 Markdown'}</button>
          <button className={button} disabled={busy || !dirty || !content.trim() || !selected} onClick={() => void act(async () => { await saveResult(content); setDirty(false); setMessage('结果已保存'); })}>保存结果</button>
          <button className={button} disabled={busy || !content.trim()} onClick={() => {
            if (!window.confirm('确认内容准确，并替换当前 cv.md？旧版本会备份。')) return;
            void act(async () => { await saveResult(content); await api('/api/cv', json({ content })); setDirty(false); setMessage('已设为当前简历，Agent 可读取 cv.md；未启动岗位扫描。'); });
          }}>确认，设为当前简历</button>
        </div>
        {editing ? <textarea aria-label="Markdown 简历" className="min-h-[60vh] w-full rounded-lg border border-border p-4 font-mono text-sm" value={content} disabled={busy} onChange={e => { setContent(e.target.value); setDirty(true); }} />
          : <article className="report-prose min-h-[60vh] overflow-auto">{content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : <p className="text-muted">尚未分析。可直接使用提取文字，或点击 Agent 分析整理成中文简历。</p>}</article>}
      </section>
    </div>
  </div>;
}
