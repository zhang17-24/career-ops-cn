#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';
import { loadProviders, resolveProvider } from '../providers/_registry.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(root, 'templates/china-campus-companies.md'));
const markdown = readFileSync(source, 'utf8');

const companies = [];
let category = '';
for (const line of markdown.split(/\r?\n/)) {
  const heading = line.match(/^## (.+)$/);
  if (heading) {
    category = heading[1].trim();
    continue;
  }
  if (!category || category === '分类索引(共 223 家)' || category === '使用注意') continue;
  const row = line.match(/^\|\s*([^|]+?)\s*\|\s*(https?:\/\/[^|\s]+)\s*\|\s*([^|]*?)\s*\|$/);
  if (!row || row[1] === '企业') continue;
  companies.push({
    name: row[1].trim(),
    careers_url: row[2].trim(),
    category,
    note: row[3].trim(),
  });
}

if (companies.length !== 223) {
  throw new Error(`期望读取 223 家企业，实际读取 ${companies.length} 家；请检查 companies.md 表格格式。`);
}

const providers = await loadProviders(path.join(root, 'providers'));
// These adapters currently target social/global listings rather than the campus
// page in the source catalog. Keep them on official-site AI search until a true
// campus endpoint exists; returning the wrong hiring track is worse than fewer
// zero-token results.
const campusOnlyWebsearch = new Set(['美团', 'Amazon']);

for (const company of companies) {
  const resolved = campusOnlyWebsearch.has(company.name)
    ? null
    : resolveProvider(company, providers);
  if (resolved?.provider) {
    company.provider = resolved.provider.id;
  } else {
    company.scan_method = 'websearch';
    company.scan_query = `${company.name} 校招 岗位`;
  }
  company.max_pages = 3;
}

const config = {
  title_filter: {
    positive: ['产品经理', '软件工程师', '前端', '后端', '算法', '数据', '人工智能', '大模型'],
    negative: [],
  },
  location_filter: {
    allow: ['中国', '北京', '上海', '深圳', '广州', '杭州', '成都', '南京', '武汉', '西安', '苏州', '远程'],
    block_hard: ['美国', '英国', '新加坡', '印度', 'United States', 'United Kingdom', 'Singapore', 'India'],
  },
  max_posting_age_days: 30,
  tracked_companies: companies,
};

const banner = [
  '# 中国校招企业官网配置',
  '# 数据源：job-apply/references/companies.md（223 家、16 类）',
  '# 运行 npm run import:job-sites 可从更新后的 Markdown 重新生成。',
  '',
].join('\n');
const output = banner + yaml.dump(config, { lineWidth: 120, noRefs: true, sortKeys: false });
writeFileSync(path.join(root, 'templates/portals.china.yml'), output);
writeFileSync(path.join(root, 'templates/portals.example.yml'), output);

console.log(`已导入 ${companies.length} 家企业，其中 ${companies.filter((c) => c.provider).length} 家可由现有适配器自动读取。`);
