import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

export const MAX_UPLOAD = 15 * 1024 * 1024;
export const TYPES = { '.pdf': 'application/pdf', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.doc': 'application/msword', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.txt': 'text/plain', '.md': 'text/plain' };
export function fileDir(root, id) {
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('无效的简历编号');
  return path.join(root, 'data', 'resumes', id);
}
export function writePrivate(file, text) {
  const temp = `${file}.${randomUUID()}.tmp`;
  fs.writeFileSync(temp, text, { mode: 0o600 });
  fs.renameSync(temp, file);
}
export function readResume(root, id) {
  const dir = fileDir(root, id);
  return JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
}
export async function storeResume(root, name, buffer) {
  const ext = path.extname(name).toLowerCase();
  if (!TYPES[ext]) throw new Error('支持 PDF、Word、PNG、JPG、WebP、TXT、MD');
  if (!buffer.length || buffer.length > MAX_UPLOAD) throw new Error('文件须为 1 字节至 15 MB');
  const signatures = { '.pdf': '25504446', '.docx': '504b0304', '.doc': 'd0cf11e0', '.png': '89504e47', '.jpg': 'ffd8ff', '.jpeg': 'ffd8ff', '.webp': '52494646' };
  if (signatures[ext] && !buffer.toString('hex', 0, 4).startsWith(signatures[ext])) throw new Error('文件内容与扩展名不符');
  const id = createHash('sha256').update(ext).update(buffer).digest('hex');
  const dir = fileDir(root, id);
  if (fs.existsSync(path.join(dir, 'meta.json'))) return readResume(root, id);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const original = path.join(dir, `original${ext}`);
  if (!fs.existsSync(original)) fs.writeFileSync(original, buffer, { flag: 'wx', mode: 0o600 });
  let text = '', warning = '';
  try {
    if (ext === '.pdf') {
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: buffer });
      try {
        const result = await parser.getText();
        text = result.pages.map(p => p.text).join('\n\n');
        if (result.pages.some(p => p.text.trim().length < 20)) { text = ''; warning = '包含扫描页，请点击 Agent 分析进行视觉识别。'; }
      } finally { await parser.destroy(); }
    } else if (ext === '.docx') {
      const mammoth = await import('mammoth');
      text = (await mammoth.extractRawText({ buffer })).value;
    } else if (ext === '.doc') {
      if (process.platform !== 'darwin') throw new Error('旧版 DOC 请另存为 DOCX 后上传');
      text = execFileSync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', original], { timeout: 15000, maxBuffer: 1000000 }).toString();
    } else if (ext === '.txt' || ext === '.md') text = buffer.toString('utf8');
  } catch (e) { warning = `文字提取失败：${e.message}`; }
  const meta = { id, name: path.basename(name).slice(0, 200), ext, type: TYPES[ext], size: buffer.length, text, warning, createdAt: new Date().toISOString() };
  writePrivate(path.join(dir, 'meta.json'), JSON.stringify(meta));
  return meta;
}
