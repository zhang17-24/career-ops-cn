// One official SSR listing page; no downloaded script execution or pagination.
const LIST_URL = 'https://talent.baidu.com/jobs/list';
const COMPANY = '百度';

export function parseListing(html) {
  if (typeof html !== 'string' || !/<title>百度校园招聘<\/title>/.test(html)) {
    throw new Error('百度列表身份未确认');
  }
  const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)]
    .map(match => match[1]).filter(script => script.includes('window.__INITIAL_DATA__ ='));
  if (scripts.length !== 1) throw new Error('百度 SSR 列表数据缺失或重复');
  // Other SSR sections can contain JavaScript undefined. Only listData is JSON.
  const match = scripts[0].match(/"listData":(\{[\s\S]*\}),"indexData":/);
  let data;
  try { data = JSON.parse(match?.[1]); }
  catch { throw new Error('百度 listData JSON 结构变化'); }
  const rows = data?.listDetailData;
  if (data.recruitType !== 'GRADUATE' || data.pageNum !== 1 || data.pageSize !== 10 ||
      data.keyWord !== '' || data.projectType !== '' || !Number.isSafeInteger(data.total) || data.total < 0 ||
      !Array.isArray(rows) || rows.length > 10 || rows.length > data.total ||
      (!rows.length && data.total !== 0)) throw new Error('百度首屏字段或分页范围未确认');
  const ids = new Set();
  return rows.map(row => {
    if (!row || ['postId', 'name', 'workPlace', 'workContent', 'serviceCondition', 'publishDate']
      .some(key => typeof row[key] !== 'string' || !row[key].trim()) ||
      !/^[A-Za-z0-9-]+$/.test(row.postId) || ids.has(row.postId) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.publishDate) || !Number.isFinite(Date.parse(row.publishDate))) {
      throw new Error('百度岗位字段无效或编号重复');
    }
    ids.add(row.postId);
    // Public card handler /jobs/detail/<recruitType>/<postId>, verified by three clicks.
    return {
      id: row.postId,
      title: row.name.trim(),
      url: `https://talent.baidu.com/jobs/detail/GRADUATE/${row.postId}`,
      company: COMPANY,
      location: row.workPlace.trim(),
      postedAt: Date.parse(row.publishDate),
      description: `工作职责：\n${row.workContent}\n职责要求：\n${row.serviceCondition}`.replace(/\\n/g, '\n'),
    };
  });
}

export default {
  provider: {
    id: 'company-a7cbf0aa-fb6b-427a-9213-fecb6324aef3',
    'fetch': async (entry, ctx) => {
      if (entry.name && entry.name !== COMPANY) throw new Error('本候选仅支持百度');
      const response = await ctx.fetch(LIST_URL, { redirect: 'error' });
      if (!response.ok) throw new Error(`百度列表 HTTP ${response.status}，未确认`);
      return parseListing(await response.text());
    },
  },
};
