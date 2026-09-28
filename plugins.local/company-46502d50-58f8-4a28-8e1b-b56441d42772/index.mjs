// Public NetEase campus API and detail route revalidated 2026-09-11.
// No fixture imports, credentials, browser dependency, or model calls.
export const LIST_URL = 'https://campus.163.com/api/campuspc/position/getJobList?pageSize=10&currentPage=1&projectId=103';

export function parsePage(payload) {
  const data = payload?.data;
  if (payload?.code !== 200 || !Array.isArray(data?.list) ||
      !Number.isSafeInteger(data.total) || data.total < data.list.length ||
      data.list.length > 10 || (data.total > 0 && data.list.length === 0)) {
    throw new Error('网易列表请求失败或结构变化，不能确认为空列表');
  }
  const jobs = data.list.map(row => {
    if (!row || !['string', 'number'].includes(typeof row.id) ||
        (typeof row.id === 'number' && !Number.isSafeInteger(row.id)) ||
        !/^[1-9]\d*$/.test(String(row.id)) ||
        ![103, '103'].includes(row.projectId) ||
        typeof row.positionName !== 'string' || !row.positionName.trim() ||
        typeof row.workPlaceName !== 'string' || !row.workPlaceName.trim() ||
        typeof row.positionDescription !== 'string' || !row.positionDescription.trim() ||
        typeof row.positionRequirement !== 'string' || !row.positionRequirement.trim()) {
      throw new Error('网易岗位字段异常或招聘项目不匹配');
    }
    const id = String(row.id); // Never coerce string IDs through Number.
    return {
      id,
      title: row.positionName.trim(),
      company: '网易',
      url: `https://campus.163.com/app/detail/index?id=${id}&projectId=103`,
      location: row.workPlaceName.trim(),
      description: `${row.positionDescription.trim()}\n${row.positionRequirement.trim()}`,
      // updateTime is not the publication date; postedAt is deliberately omitted.
    };
  });
  return [...new Map(jobs.map(job => [job.id, job])).values()];
}

export default {
  provider: {
    id: 'company-46502d50-58f8-4a28-8e1b-b56441d42772',
    'fetch': async (entry, ctx) => {
      if (entry.name && entry.name !== '网易') throw new Error('仅支持网易');
      // One observed page only (10 rows); configuration cannot expand this limit.
      return parsePage(await ctx.fetchJson(LIST_URL, { redirect: 'error' }));
    },
  },
};
