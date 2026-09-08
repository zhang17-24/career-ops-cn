// Small, auditable local vocabulary. Unknown terms stay literal; never expand
// a generic “工程师” into all professions. Negative filters remain in the core.
const groups = [
  ['前端', '前端开发', '前端工程师', 'frontend', 'front-end', 'web前端'],
  ['后端', '后端开发', '后端工程师', '服务端', 'backend', 'back-end'],
  ['全栈', '全栈工程师', 'fullstack', 'full-stack', 'full stack'],
  ['人工智能', 'ai', '大模型', 'aigc', 'llm', 'agent', '智能体'],
  ['产品经理', '产品管理', 'product manager'],
  ['软件工程师', '软件开发', '研发工程师', 'software engineer', 'software developer'],
  ['数据分析', '数据分析师', 'data analyst', 'data analytics'],
  ['测试工程师', '软件测试', '质量保证', 'qa engineer'],
];
const norm = value => String(value || '').normalize('NFKC').toLowerCase().trim();
function contains(title, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${/^[a-z0-9]/.test(word) ? '(?<![a-z0-9])' : ''}${escaped}${/[a-z0-9]$/.test(word) ? '(?![a-z0-9])' : ''}`, 'i').test(title);
}
export function matchJobKeyword(title, keywords = []) {
  const text = norm(title);
  const terms = keywords.filter(k => norm(k));
  if (!terms.length) return { kind: 'all', rank: 0, reason: '' };
  for (const keyword of terms) if (contains(text, norm(keyword))) return { kind: 'exact', rank: 0, reason: `精确匹配：${keyword}` };
  for (const keyword of terms) {
    const group = groups.find(g => g.includes(norm(keyword)));
    const hit = group?.find(alias => contains(text, alias));
    if (hit) return { kind: 'related', rank: 1, reason: `相关词：${keyword} → ${hit}` };
  }
  return { kind: 'none', rank: 2, reason: '未匹配关键词（放宽后显示）' };
}
