import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { storeResume, fileDir, readResume, writePrivate, MAX_UPLOAD } from '../src/lib/cv/files.mjs';

test('resume originals are private, deduplicated, retained alongside reusable markdown', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-test-'));
  try {
    assert.throws(() => fileDir(root, '../secret'));
    await assert.rejects(storeResume(root, 'x.html', Buffer.from('bad')));
    await assert.rejects(storeResume(root, 'x.pdf', Buffer.from('not pdf')));
    await assert.rejects(storeResume(root, 'x.txt', Buffer.alloc(MAX_UPLOAD + 1)));
    const f = await storeResume(root, '测试简历.txt', Buffer.from('测试用户\n技能：TypeScript'));
    assert.match(f.text, /TypeScript/);
    const dir = fileDir(root, f.id);
    writePrivate(path.join(dir, 'parsed.md'), '# 测试用户');
    assert.equal((await storeResume(root, '重命名.txt', Buffer.from(f.text))).id, f.id);
    assert.equal(readResume(root, f.id).name, '测试简历.txt');
    assert.equal(fs.readFileSync(path.join(dir, 'parsed.md'), 'utf8'), '# 测试用户');
    assert.equal(fs.readFileSync(path.join(dir, 'original.txt'), 'utf8'), f.text);
    assert.equal(fs.statSync(path.join(dir, 'original.txt')).mode & 0o777, 0o600);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
