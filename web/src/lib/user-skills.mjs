import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import * as yaml from 'js-yaml';
import JSZip from 'jszip';
export const LIMIT = 50 * 1024 * 1024;
const idPattern = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/;
function base(root) { return path.join(root, 'data', 'skills'); }
function safePath(value) {
  if (typeof value !== 'string' || !value || value.length > 500 || /[\\\x00-\x1f:]/.test(value) || value.split('/').some(p => !p || p === '.' || p === '..')) throw new Error('文件路径不安全');
  return value;
}
export function skillDir(root, id) {
  if (!idPattern.test(id)) throw new Error('无效技能编号');
  return path.join(base(root), id);
}
function state(root) {
  try { return JSON.parse(fs.readFileSync(path.join(base(root), 'registry.json'), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return { revisions: [], active: {} }; throw e; }
}
function save(root, data) {
  fs.mkdirSync(base(root), { recursive: true, mode: 0o700 });
  const file = path.join(base(root), 'registry.json'); const temp = `${file}.${randomUUID()}`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), { mode: 0o600 }); fs.renameSync(temp, file);
}
export function listSkills(root) {
  const s = state(root);
  return s.revisions.map(r => ({ ...r, enabled: !r.deleted && s.active[r.group] === r.id, ready: !!(r.name.trim() && r.description.trim() && r.entry) }));
}
export function catalog(root) {
  return listSkills(root).filter(r => r.enabled).map(r => ({ name: r.name, description: r.description, entry: path.join(skillDir(root, r.id), 'files', r.entry), directory: path.join(skillDir(root, r.id), 'files'), version: r.version }));
}
export function readSkillFile(root, id, rel) {
  const r = state(root).revisions.find(r => r.id === id);
  if (!r || !r.files.some(f => f.path === rel)) throw new Error('文件不存在');
  const file = path.join(skillDir(root, id), 'files', safePath(rel));
  if (fs.lstatSync(file).isSymbolicLink()) throw new Error('不允许符号链接');
  return fs.readFileSync(file);
}
export async function uploadSkill(root, uploads, group) {
  let files = [];
  if (uploads.length === 1 && /\.zip$/i.test(uploads[0].name)) {
    const zip = await JSZip.loadAsync(uploads[0].data);
    const entries = Object.values(zip.files).filter(e => !e.dir);
    if (entries.length > 500) throw new Error('最多 500 个文件');
    let declared = 0;
    for (const e of entries) {
      safePath(e.unsafeOriginalName || e.name);
      if ((Number(e.unixPermissions) & 0o170000) === 0o120000) throw new Error('不允许符号链接');
      declared += e._data?.uncompressedSize || 0;
      if (declared > LIMIT) throw new Error('解压后最多 50 MB');
      files.push({ name: e.name, data: await e.async('nodebuffer') });
    }
  } else files = uploads;
  if (!files.length || files.length > 500 || files.reduce((n, f) => n + f.data.length, 0) > LIMIT) throw new Error('最多 500 个文件、总计 50 MB');
  for (const f of files) safePath(f.name);
  const first = files[0].name.split('/')[0];
  if (files.every(f => f.name.startsWith(first + '/'))) files = files.map(f => ({ ...f, name: f.name.slice(first.length + 1) }));
  const names = new Set();
  for (const f of files) { safePath(f.name); const key = f.name.normalize('NFC').toLowerCase(); if (names.has(key)) throw new Error('存在重复文件路径'); names.add(key); }
  const entry = files.find(f => f.name === 'SKILL.md') || files.find(f => /(^|\/)SKILL\.md$/.test(f.name));
  let header = {};
  try { const m = entry?.data.toString('utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/); if (m) header = yaml.load(m[1], { schema: yaml.JSON_SCHEMA }) || {}; } catch { /* retained for manual metadata completion */ }
  const name = typeof header.name === 'string' ? header.name.slice(0, 80) : '';
  const description = typeof header.description === 'string' ? header.description.slice(0, 500) : '';
  const s = state(root);
  if (group && !s.revisions.some(r => r.group === group)) throw new Error('原技能不存在');
  const id = randomUUID(); group ||= id;
  const dir = skillDir(root, id);
  fs.mkdirSync(path.join(dir, 'files'), { recursive: true, mode: 0o700 });
  try {
    for (const f of files) { const target = path.join(dir, 'files', f.name); fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 }); fs.writeFileSync(target, f.data, { mode: 0o600, flag: 'wx' }); }
    s.revisions.push({ id, group, version: 1 + Math.max(0, ...s.revisions.filter(r => r.group === group).map(r => r.version)), name, description, entry: entry?.name || '', createdAt: new Date().toISOString(), deleted: false, files: files.map(f => ({ path: f.name, size: f.data.length })) });
    save(root, s);
  } catch (e) { fs.rmSync(dir, { recursive: true, force: true }); throw e; }
  return id;
}
export function updateSkill(root, body) {
  const s = state(root); const r = s.revisions.find(r => r.id === body.id);
  if (!r) throw new Error('技能不存在');
  if (body.action === 'metadata') {
    if (typeof body.name !== 'string' || typeof body.description !== 'string' || body.name.length > 80 || body.description.length > 500 || !r.files.some(f => f.path === body.entry)) throw new Error('请填写名称（80字内）、用途（500字内）并选择入口');
    if (s.active[r.group] === r.id) throw new Error('请先停用再修改说明');
    Object.assign(r, { name: body.name.trim(), description: body.description.trim(), entry: body.entry });
  } else if (body.action === 'enable') {
    if (r.deleted || !r.name.trim() || !r.description.trim() || !r.entry) throw new Error('请先恢复并补齐名称、用途和入口');
    s.active[r.group] = r.id;
  } else if (body.action === 'disable' || body.action === 'delete') {
    if (s.active[r.group] === r.id) delete s.active[r.group];
    if (body.action === 'delete') r.deleted = true;
  } else if (body.action === 'restore') r.deleted = false;
  else throw new Error('未知操作');
  save(root, s);
}
