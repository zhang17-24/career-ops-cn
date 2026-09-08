// External-agent routing: metadata only by default, no script execution.
import { catalog } from './web/src/lib/user-skills.mjs';
import fs from 'node:fs';
import path from 'node:path';
const repo = import.meta.dirname;
const marker = path.join(repo, '.career-ops-data');
const root = path.resolve(repo, process.env.CAREER_OPS_ROOT || process.env.CAREER_OPS_DATA_DIR || (fs.existsSync(marker) ? fs.readFileSync(marker, 'utf8').trim() : repo));
try { console.log(JSON.stringify(catalog(root), null, 2)); }
catch (e) { console.error('技能目录读取失败：' + e.message); process.exitCode = 1; }
