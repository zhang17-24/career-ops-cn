// miHoYo's public ATS, first campus page only. No credentials or fallback data.
export const LIST_URL = 'https://ats.openout.mihoyo.com/ats-portal/v1/job/list';
export const QUERY = Object.freeze({ pageNo: 1, pageSize: 10, channelDetailIds: [1], hireType: 1 });

export function parseJobs(payload) {
  const data = payload?.data;
  if (payload?.code !== 0 || payload.success !== true || payload.error !== false ||
      !data || !Array.isArray(data.list) || data.pageNo !== 1 || data.pageSize !== 10 ||
      !Number.isSafeInteger(data.total) || data.total < data.list.length ||
      data.list.length !== Math.min(data.total, 10)) {
    throw new Error('米哈游公开列表响应异常或分页结构变化');
  }
  const ids = new Set();
  return data.list.map(row => {
    if (!row || typeof row.id !== 'string' || !/^\d+$/.test(row.id) || ids.has(row.id) ||
        typeof row.title !== 'string' || !row.title.trim() ||
        !Array.isArray(row.addressDetailList) || row.addressDetailList.length === 0 ||
        row.addressDetailList.some(a => typeof a?.addressDetail !== 'string' || !a.addressDetail.trim())) {
      throw new Error('米哈游岗位字段缺失、编号异常或重复');
    }
    ids.add(row.id);
    return {
      id: row.id,
      title: row.title.trim(),
      // Public C_POSITION_ID mapping, confirmed by three actual card clicks.
      url: `https://jobs.mihoyo.com/#/campus/position/${row.id}`,
      company: '米哈游',
      location: row.addressDetailList.map(a => a.addressDetail.trim()).join('、'),
    };
  });
}

export default {
  provider: {
    id: 'company-63572e2b-c77f-40af-afaa-e536fdbd3abe',
    'fetch': async (_entry, ctx) => parseJobs(await ctx.fetchJson(LIST_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(QUERY),
      redirect: 'error',
    })),
  },
};
