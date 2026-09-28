// Beisen public campus list: one page, no authentication or runtime browser.
const ORIGIN = 'https://360campus.zhiye.com';
export const LIST_URL = `${ORIGIN}/api/Jobad/GetJobAdPageList`;
export const QUERY = { PageIndex: 0, PageSize: 20, Category: ['2'], KeyWords: '', SpecialType: 0, PortalId: '', DisplayFields: ['Category', 'Kind', 'LocId', 'WorkWeChatQrCode'] };

// Shared Beisen schema; the campus route was verified against three real clicks.
export function parseBeisen(payload, origin = ORIGIN, company = '三六零') {
  if (payload?.Code !== 200 || !Array.isArray(payload.Data) || !Number.isInteger(payload.Count) || payload.Count < payload.Data.length || payload.Data.length > 20 || (!payload.Data.length && payload.Count !== 0)) {
    throw new Error('Beisen list response invalid or incomplete');
  }
  const ids = new Set();
  return payload.Data.map(row => {
    if (!row || typeof row.Id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(row.Id) || ids.has(row.Id) ||
        typeof row.JobAdName !== 'string' || !row.JobAdName.trim() || row.CategoryId !== '2' || row.Status !== 1 ||
        !Array.isArray(row.LocNames) || row.LocNames.some(v => typeof v !== 'string') ||
        typeof row.Duty !== 'string' || !row.Duty.trim() || typeof row.Require !== 'string') {
      throw new Error('Beisen job fields invalid, inactive, or duplicate ID');
    }
    ids.add(row.Id);
    const url = new URL('/campus/detail', origin);
    url.searchParams.set('jobAdId', row.Id);
    return { id: row.Id, title: row.JobAdName.trim(), url: url.href, company,
      location: row.LocNames.join('、'), description: [row.Duty.trim(), row.Require.trim()].filter(Boolean).join('\n\n') };
  });
}

export default {
  provider: {
    id: 'company-ab5b5085-65b6-45b9-bf93-47e95b78d458',
    'fetch': async (entry, ctx) => parseBeisen(await ctx.fetchJson(LIST_URL, {
      method: 'POST', redirect: 'error', headers: { 'content-type': 'application/json' }, body: JSON.stringify(QUERY),
    })),
  },
};
