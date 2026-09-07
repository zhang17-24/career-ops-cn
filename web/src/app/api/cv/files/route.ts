import fs from 'node:fs';
import path from 'node:path';
import { careerOpsRoot } from '@/lib/career-ops';
import { fileDir, readResume, storeResume, writePrivate, MAX_UPLOAD } from '@/lib/cv/files.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const root = careerOpsRoot();
    const query = new URL(req.url).searchParams;
    const id = query.get('id');
    if (!id) {
      const base = path.join(root, 'data', 'resumes');
      const ids = fs.existsSync(base) ? fs.readdirSync(base).filter(x => /^[a-f0-9]{64}$/.test(x) && fs.existsSync(path.join(base, x, 'meta.json'))) : [];
      const files = ids.map(x => readResume(root, x)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return Response.json({ files }, { headers: { 'Cache-Control': 'no-store' } });
    }
    const meta = readResume(root, id);
    const dir = fileDir(root, id);
    if (query.has('original')) return new Response(fs.readFileSync(path.join(dir, `original${meta.ext}`)), { headers: {
      'Content-Type': meta.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `${meta.type.startsWith('image/') || meta.ext === '.pdf' ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(meta.name)}`,
    } });
    const result = path.join(dir, 'parsed.md');
    return Response.json({ ...meta, markdown: fs.existsSync(result) ? fs.readFileSync(result, 'utf8') : '' }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: '无法读取简历文件' }, { status: 400 }); }
}
export async function POST(req: Request) {
  try {
    if (Number(req.headers.get('content-length')) > MAX_UPLOAD + 10000) return Response.json({ error: '文件不能超过 15 MB' }, { status: 413 });
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) throw new Error('请选择文件');
    return Response.json(await storeResume(careerOpsRoot(), file.name, Buffer.from(await file.arrayBuffer())));
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : '上传失败' }, { status: 400 }); }
}
export async function PUT(req: Request) {
  try {
    const { id, markdown } = await req.json();
    if (typeof markdown !== 'string' || !markdown.trim() || Buffer.byteLength(markdown) > 200000) throw new Error('解析结果为空或超过 200 KB');
    readResume(careerOpsRoot(), id);
    writePrivate(path.join(fileDir(careerOpsRoot(), id), 'parsed.md'), markdown);
    return Response.json({ ok: true });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : '保存失败' }, { status: 400 }); }
}
