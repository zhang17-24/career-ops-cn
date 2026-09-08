import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { careerOpsRoot } from '@/lib/career-ops';
import path from 'node:path';
export const runtime = 'nodejs';
export const maxDuration = 45;
let busy = false;
export async function POST(req: Request) {
  if (busy) return Response.json({ error: '已有检查在进行，请稍后再试' }, { status: 429 });
  let url: URL;
  try {
    const body = await req.json();
    if (typeof body.url !== 'string' || body.url.length > 4096) throw new Error();
    url = new URL(body.url);
    // Only the currently supported China recruiting hosts; core also guards
    // private destinations and redirects before browser navigation.
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['join.qq.com', 'jobs.bytedance.com', 'app.mokahr.com'].includes(url.hostname) && !url.hostname.endsWith('.jobs.feishu.cn')) throw new Error();
  } catch { return Response.json({ error: '仅支持国内已接入招聘官网的 HTTPS 岗位链接' }, { status: 400 }); }
  busy = true;
  try {
    const { stdout } = await promisify(execFile)(process.execPath, [path.join(careerOpsRoot(), 'check-job-json.mjs'), url.href], { timeout: 35000, maxBuffer: 100000 });
    return Response.json({ ...JSON.parse(stdout.trim()), checkedAt: new Date().toISOString() });
  } catch { return Response.json({ result: 'uncertain', reason: '检查超时或浏览器不可用，请打开官网确认' }); }
  finally { busy = false; }
}
