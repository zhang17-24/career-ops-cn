// PDD's public campus API; one first page, no credentials or runtime model.
export const LIST_URL = 'https://careers.pddglobalhr.com/campus/grad';
export const ENDPOINT = 'https://careers.pddglobalhr.com/api/careers/api/recruit/position/list';

function requiredText(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`PDD: invalid ${field}`);
  return value.trim();
}

export function parseJobs(payload) {
  const result = payload?.result;
  if (payload?.success !== true || payload.errorCode !== 1000000 || !Array.isArray(result?.list) ||
      typeof result.total !== 'string' || !/^\d+$/.test(result.total) ||
      result.list.length > 10 || BigInt(result.total) < BigInt(result.list.length) ||
      (result.list.length === 0 && result.total !== '0')) {
    throw new Error('PDD: unsuccessful or changed public list response');
  }
  const ids = new Set();
  return result.list.map(row => {
    const id = requiredText(row?.id, 'string id');
    if (id !== row.id || !/^[A-Za-z0-9-]+$/.test(id) || ids.has(id)) throw new Error('PDD: invalid or duplicate id');
    ids.add(id);
    const title = requiredText(row.name, 'name');
    const location = requiredText(row.workLocationName, 'workLocationName');
    const description = requiredText(row.jobDuty, 'jobDuty');
    if (!Number.isSafeInteger(row.releaseTime) || row.releaseTime <= 0 || row.releaseTime > 8640000000000000) {
      throw new Error('PDD: invalid releaseTime');
    }
    // Public card handler appends /detail with positionId; confirmed by three clicks.
    return { id, title, url: `${LIST_URL}/detail?positionId=${encodeURIComponent(id)}`,
      company: '拼多多', location, description, postedAt: row.releaseTime };
  });
}

export default {
  provider: {
    id: 'company-25c29b83-55ea-4807-b8c4-c6773baf5f98',
    'fetch': async (entry, ctx) => {
      if (entry.name !== '拼多多') throw new Error('PDD: provider is restricted to 拼多多');
      return parseJobs(await ctx.fetchJson(ENDPOINT, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ page: 1, pageSize: 10, t: null }), redirect: 'error',
      }));
    },
  },
};
