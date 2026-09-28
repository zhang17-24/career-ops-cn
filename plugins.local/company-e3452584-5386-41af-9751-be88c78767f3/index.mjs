// @ts-check
// 名创优品（北森招聘门户）公开校招列表适配器。零 Token，只读官方 JSON，无浏览器/模型调用。

const COMPANY = '名创优品';
const ORIGIN = 'https://miniso.zhiye.com';
const DEFAULT_LIST_URL = `${ORIGIN}/api/Jobad/GetJobAdPageList`;

const QUERY = {
  PageIndex: 0,
  PageSize: 20,
  Category: ['2'],
  KeyWords: '',
  SpecialType: 0,
  PortalId: '',
  DisplayFields: ['Category', 'Kind', 'LocId', 'WorkWeChatQrCode'],
};

export function parseBeisen(payload, origin = ORIGIN, company = COMPANY) {
  if (
    payload?.Code !== 200 ||
    !Array.isArray(payload.Data) ||
    !Number.isInteger(payload.Count) ||
    payload.Count < payload.Data.length ||
    payload.Data.length > 20 ||
    (!payload.Data.length && payload.Count !== 0)
  ) {
    throw new Error('Beisen list response invalid or incomplete');
  }

  const ids = new Set();
  return payload.Data.map((row) => {
    if (
      !row ||
      typeof row.Id !== 'string' ||
      !/^[a-zA-Z0-9-]+$/.test(row.Id) ||
      ids.has(row.Id) ||
      typeof row.JobAdName !== 'string' ||
      !row.JobAdName.trim() ||
      row.CategoryId !== '2' ||
      row.Status !== 1 ||
      !Array.isArray(row.LocNames) ||
      row.LocNames.some((v) => typeof v !== 'string') ||
      typeof row.Duty !== 'string' ||
      !row.Duty.trim() ||
      typeof row.Require !== 'string'
    ) {
      throw new Error('Beisen job fields invalid, inactive, or duplicate ID');
    }
    ids.add(row.Id);

    const url = new URL('/campus/detail', origin);
    url.searchParams.set('jobAdId', row.Id);

    return {
      id: row.Id,
      title: row.JobAdName.trim(),
      url: url.href,
      company,
      location: row.LocNames.join('、'),
      description: [row.Duty.trim(), row.Require.trim()].filter(Boolean).join('\n\n'),
    };
  });
}

export default {
  provider: {
    id: 'company-e3452584-5386-41af-9751-be88c78767f3',
    'fetch': async (entry, ctx) => {
      const listUrl = entry.api || DEFAULT_LIST_URL;
      return parseBeisen(
        await ctx.fetchJson(listUrl, {
          method: 'POST',
          redirect: 'error',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(QUERY),
        })
      );
    },
  },
};
