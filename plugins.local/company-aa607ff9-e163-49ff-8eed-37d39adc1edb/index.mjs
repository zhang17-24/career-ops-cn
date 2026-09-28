// Public Ctrip campus API, first page only. No credentials or browser runtime.
export const ENDPOINT = 'https://careers.ctrip.com/api/hrrecruit/getJobAd';
export const LIST_URL = 'https://careers.ctrip.com/#/campus/jobList';

export function parseJobs(payload) {
  const value = payload?.retValue;
  if (payload?.retCode !== '201' || !Number.isInteger(value?.total) || value.total < 0 ||
      !Array.isArray(value?.recruitJobAdList)) throw new Error('携程：公开列表响应异常');
  const rows = value.recruitJobAdList;
  if (rows.length > 10 || rows.length > value.total || (rows.length === 0 && value.total !== 0)) {
    throw new Error('携程：首屏数量异常');
  }
  const seen = new Set();
  return rows.map(row => {
    if (!row || typeof row.fromId !== 'string' || !/^MJ\d+$/.test(row.fromId) ||
        typeof row.jobTitle !== 'string' || !row.jobTitle.trim() ||
        typeof row.cityName !== 'string' || !row.cityName.trim() || seen.has(row.fromId)) {
      throw new Error('携程：岗位字段缺失或编号重复');
    }
    seen.add(row.fromId);
    // Observed official anchor and public navigation code: pathname `${n}/${e.fromId}`.
    return {
      id: row.fromId,
      title: row.jobTitle.trim(),
      url: `https://careers.ctrip.com/#/campus/job-detail/${row.fromId}`,
      company: '携程',
      location: row.cityName.trim(),
    };
  });
}

export default {
  provider: {
    id: 'company-aa607ff9-e163-49ff-8eed-37d39adc1edb',
    'fetch': async (entry, ctx) => {
      if (entry.name && entry.name !== '携程') throw new Error('仅支持携程');
      const payload = await ctx.fetchJson(ENDPOINT, {
        method: 'POST', redirect: 'error',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          condition: { fromId: [], keyword: '', kind: [], country: [], city: [], bucode: [], jobFamilyCode: [], jobFamilyGroupCode: [], category: 2 },
          pager: { index: '1', size: '10' },
          head: { language: 'zh_CN', version: '1' },
        }),
      });
      return parseJobs(payload);
    },
  },
};
