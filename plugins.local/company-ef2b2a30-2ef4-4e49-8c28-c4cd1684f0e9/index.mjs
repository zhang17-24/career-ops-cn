// Public 2027 campus list; no model, credentials or fallback jobs.
export function parsePage(payload) {
  const rows = payload?.data?.positionList;
  const count = payload?.data?.count;
  if (payload?.status !== 0 || !Array.isArray(rows) || !Number.isSafeInteger(count) || count < rows.length || rows.length > 10 || (!rows.length && count !== 0)) throw new Error('腾讯列表响应异常或结构变化');
  const seen = new Set();
  return rows.flatMap(row => {
    if (typeof row?.postId !== 'string' || !/^\d+$/.test(row.postId) || typeof row.positionTitle !== 'string' || !row.positionTitle.trim() || typeof row.workCities !== 'string' || !row.workCities.trim()) throw new Error('腾讯岗位编号、名称或地点缺失');
    if (seen.has(row.postId)) return [];
    seen.add(row.postId);
    return [{ title: row.positionTitle.trim(), company: '腾讯', location: row.workCities.trim().replace(/\s+/g, ' '), url: `https://join.qq.com/post_detail.html?postid=${row.postId}` }];
  });
}
export default { provider: {
  id: 'company-ef2b2a30-2ef4-4e49-8c28-c4cd1684f0e9',
  'fetch': async (_entry, ctx) => parsePage(await ctx.fetchJson('https://join.qq.com/api/v1/position/searchPosition', {
    method: 'POST', redirect: 'error', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectIdList: [], projectMappingIdList: [1], keyword: '', bgList: [], workCountryType: 0, workCityList: [], recruitCityList: [], positionFidList: [], pageIndex: 1, pageSize: 10 }),
  })),
} };
