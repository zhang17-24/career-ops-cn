// One observed campus listing page; no pagination, credentials or fallback.
const endpoint = 'https://careers.midea.com/backend/school/position/common/position/list?_ihr_log_trackId=6a2f27ca-69d4-4555-ad92-ca23ba164c6a';
const entryUrl = 'https://careers.midea.com/schoolOut/home';
const projectRuleId = '055bb05d-1957-4ea0-bb21-873ca0164d84';

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`美的列表字段异常：${field}`);
  return value.trim();
}

export function parseListing(payload) {
  if (payload?.code !== '0' || !Array.isArray(payload.data?.data) ||
      !Number.isSafeInteger(payload.data.total) || payload.data.total < 0) {
    throw new Error('美的列表响应异常或访问未确认');
  }
  const rows = payload.data.data;
  if (rows.length > 10 || payload.data.total < rows.length || (!rows.length && payload.data.total !== 0)) {
    throw new Error('美的列表分页数据异常');
  }
  const ids = new Set();
  return rows.map(row => {
    const id = requiredText(row?.positionId, 'positionId');
    if (id !== row.positionId || !/^[a-zA-Z0-9-]+$/.test(id) || ids.has(id)) throw new Error('美的岗位编号异常或重复');
    ids.add(id);
    if (row.projectRuleId !== projectRuleId) throw new Error('美的招聘项目发生变化');
    const title = requiredText(row.projectPositionName, 'projectPositionName');
    const detail = row.projectPositionDto;
    if (requiredText(detail?.positionName, 'positionName') !== title) throw new Error('美的岗位名称不一致');
    return {
      id, title, company: '美的集团',
      // Public card handler: router.resolve({name: "postDetails", query: {positionId}}).
      // Observed router base /schoolOut + path /post/details; three clicks verified.
      url: 'https://careers.midea.com/schoolOut/post/details?positionId=' + encodeURIComponent(id),
      location: requiredText(row.workPlaceCode, 'workPlaceCode'),
      description: requiredText(detail.jobResponsibility, 'jobResponsibility') + '\n\n岗位要求\n' + requiredText(detail.jobRequirement, 'jobRequirement'),
    };
  });
}

export default {
  provider: {
    id: 'company-c6db03fe-0829-475c-9d0b-e19cd68113df',
    'fetch': async (entry, ctx) => {
      if (entry.name !== '美的集团' || entry.careers_url !== entryUrl) throw new Error('仅支持已批准的美的集团校招入口');
      const response = await ctx.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: null, superiorIds: [], recruitCategoryIds: [], workPlaceCodes: [], projectRuleId, pageIndex: 1, pageSize: 10 }),
      });
      if (!response.ok) throw new Error(`美的列表 HTTP ${response.status}，读取未确认`);
      return parseListing(await response.json());
    },
  },
};
