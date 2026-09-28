// Observed public campus request. No models, credentials or fixture fallbacks.
export function parsePage(payload) {
  const rows = payload?.content;
  if (payload?.success !== true || payload.errorCode !== 'success' || !Array.isArray(rows) || !Number.isSafeInteger(payload.totalCount) || payload.totalCount < rows.length || rows.length > 10 || (!rows.length && payload.totalCount > 0)) throw new Error('蚂蚁集团列表返回异常或结构变化');
  const seen = new Set();
  return rows.flatMap(row => {
    const id = typeof row?.id === 'string' ? row.id : Number.isSafeInteger(row?.id) && row.id > 0 ? String(row.id) : '';
    if (!/^\d+$/.test(id) || typeof row.name !== 'string' || !row.name.trim() || !Array.isArray(row.workLocations) || !row.workLocations.length || row.workLocations.some(x => typeof x !== 'string' || !x.trim()) || typeof row.description !== 'string' || !row.description.trim() || typeof row.requirement !== 'string' || !row.requirement.trim()) throw new Error('蚂蚁集团岗位字段缺失或编号不安全');
    const date = row.publishTime ? Date.parse(row.publishTime) : undefined;
    if (row.publishTime && !Number.isFinite(date)) throw new Error('蚂蚁集团发布时间格式变化');
    if (seen.has(id)) return [];
    seen.add(id);
    return [{ title: row.name.trim(), company: '蚂蚁集团', url: `https://talent.antgroup.com/campus-position?positionId=${id}`, location: row.workLocations.map(x => x.trim()).join('、'), description: `${row.description}\n职位要求\n${row.requirement}`, ...(date === undefined ? {} : { postedAt: date }) }];
  });
}

export default { provider: {
  id: 'antgroup-campus',
  'fetch': async (_entry, ctx) => parsePage(await ctx.fetchJson('https://hrcareersweb.antgroup.com/api/campus/position/search', {
    method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel: 'campus_group_official_site', language: 'zh', regions: '', subCategories: '', bgCode: '', key: '', pageIndex: 1, pageSize: 10, recruitType: [], batchIds: ['26040200083752', '25030300059633', '26070900089909'] }),
  })),
} };
