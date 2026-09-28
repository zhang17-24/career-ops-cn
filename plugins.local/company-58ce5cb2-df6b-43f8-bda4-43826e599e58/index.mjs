// One public campus listing page. No credentials, pagination, or fallback data.
export const ENDPOINT = 'https://careers.ctrip.com/api/hrrecruit/getJobAd';
export const REQUEST = {
  condition: { fromId: [], keyword: '', kind: [], country: [], city: [], bucode: [], jobFamilyCode: [], jobFamilyGroupCode: [], category: 2 },
  pager: { index: '1', size: '10' },
  head: { language: 'zh_CN', version: '1' },
};

export function parseJobs(payload) {
  const value = payload?.retValue;
  if (payload?.retCode !== '201' || !Number.isSafeInteger(value?.total) || value.total < 0 ||
      !Array.isArray(value.recruitJobAdList)) throw new Error('携程公开列表响应未确认');
  const rows = value.recruitJobAdList;
  if (rows.length > 10 || rows.length > value.total || (!rows.length && value.total !== 0))
    throw new Error('携程列表分页或总数异常');
  const ids = new Set();
  return rows.map(row => {
    if (!row || typeof row.fromId !== 'string' || !/^MJ\d+$/.test(row.fromId) ||
        typeof row.id !== 'string' || !row.id || ids.has(row.fromId) ||
        typeof row.jobTitle !== 'string' || !row.jobTitle.trim() ||
        typeof row.cityName !== 'string' || !row.cityName.trim() ||
        typeof row.requirements !== 'string' || !row.requirements.trim())
      throw new Error('携程岗位字段缺失或编号重复');
    ids.add(row.fromId);
    // Public recruit-item-link code uses pathname `${n}/${e.fromId}`;
    // campus n and three real clicks are recorded in ACCEPTANCE.md.
    return {
      id: row.fromId,
      title: row.jobTitle.trim(),
      url: `https://careers.ctrip.com/#/campus/job-detail/${row.fromId}`,
      company: '携程',
      location: row.cityName.trim(),
      description: row.requirements,
    };
  });
}

export default {
  provider: {
    id: 'company-58ce5cb2-df6b-43f8-bda4-43826e599e58',
    'fetch': async (entry, ctx) => parseJobs(await ctx.fetchJson(ENDPOINT, {
      method: 'POST', redirect: 'error',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(REQUEST),
    })),
  },
};
