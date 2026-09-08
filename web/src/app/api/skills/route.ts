import { careerOpsRoot } from '@/lib/career-ops';
import { listSkills, readSkillFile, uploadSkill, updateSkill, LIMIT } from '@/lib/user-skills.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
let writing = false;
export async function GET(req: Request) {
  try {
    const q = new URL(req.url).searchParams;
    if (q.has('file')) {
      const buffer = readSkillFile(careerOpsRoot(), q.get('id'), q.get('file'));
      if (q.has('download')) return new Response(buffer, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(q.get('file')!.split('/').pop()!), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
      const binary = buffer.includes(0) || !/\.(md|txt|json|ya?ml|[cm]?[jt]sx?|py|sh|css|html|xml|csv|toml|ini|rs|go|java|swift)$/i.test(q.get('file')!);
      return Response.json({ content: binary ? null : buffer.subarray(0, 100000).toString('utf8'), truncated: buffer.length > 100000 });
    }
    return Response.json({ skills: listSkills(careerOpsRoot()) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch { return Response.json({ error: '文件不存在或技能数据无法读取' }, { status: 400 }); }
}
export async function POST(req: Request) {
  if (writing) return Response.json({ error: '正在保存，请稍后重试' }, { status: 409 });
  writing = true;
  try {
    if (Number(req.headers.get('content-length')) > LIMIT + 1000000) throw new Error('上传最大 50 MB');
    const form = await req.formData(); const values = form.getAll('files'); const paths = form.getAll('paths');
    if (values.length > 500) throw new Error('最多500个文件');
    const files = [];
    let size = 0;
    for (const [i, f] of values.entries()) { if (!(f instanceof File)) throw new Error('请选择文件'); size += f.size; if (size > LIMIT) throw new Error('上传最大50 MB'); files.push({ name: String(paths[i] || f.name), data: Buffer.from(await f.arrayBuffer()) }); }
    return Response.json({ id: await uploadSkill(careerOpsRoot(), files, String(form.get('group') || '')) });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : '上传失败' }, { status: 400 }); }
  finally { writing = false; }
}
export async function PATCH(req: Request) {
  if (writing) return Response.json({ error: '正在保存，请稍后重试' }, { status: 409 });
  writing = true;
  try { updateSkill(careerOpsRoot(), await req.json()); return Response.json({ ok: true }); }
  catch (e) { return Response.json({ error: e instanceof Error ? e.message : '保存失败' }, { status: 400 }); }
  finally { writing = false; }
}
