const BASE = 'https://jobs.bilibili.com';
export function parsePage(d) {
  if (d?.code !== 0 || !Array.isArray(d.data?.list) || !Number.isSafeInteger(d.data.total) || d.data.total < 0) throw new Error('哔哩哔哩列表异常或结构变化');
  if (!d.data.list.length && d.data.total > 0) throw new Error('哔哩哔哩返回空页但总数非零，不能视为没有岗位');
  const jobs = d.data.list.map(p => {
    if (!p || typeof p.positionName !== 'string' || !p.positionName.trim() || !/^\d+$/.test(String(p.id)) || (typeof p.id === 'number' && !Number.isSafeInteger(p.id)) || typeof p.workLocation !== 'string' || typeof p.positionDescription !== 'string') throw new Error('哔哩哔哩岗位字段异常');
    const postedAt = typeof p.pushTime === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(p.pushTime) ? Date.parse(p.pushTime.replace(' ', 'T') + '+08:00') : undefined;
    return { title: p.positionName.trim(), company: '哔哩哔哩', url: BASE + '/campus/positions/' + String(p.id), location: p.workLocation, description: p.positionDescription.slice(0, 4000), postedAt: Number.isFinite(postedAt) ? postedAt : undefined };
  });
  return [...new Map(jobs.map(j => [j.url, j])).values()];
}
export default { provider: { id: 'company-68a3ca39-7edd-4988-a257-531c48bb3471', 'fetch': async (_entry, ctx) => {
  const headers = { 'Content-Type': 'application/json', 'X-AppKey': 'ops.ehr-api.auth', 'X-UserType': '2', 'X-Channel': 'campus' };
  // A fresh anonymous anti-CSRF handshake, not a user's authenticated session.
  const init = await ctx.fetch(BASE + '/api/auth/v1/csrf/token', { headers });
  if (!init.ok) throw new Error('哔哩哔哩公开初始化 HTTP ' + init.status);
  const csrf = await init.json();
  if (csrf?.code !== 0 || typeof csrf.data !== 'string' || !csrf.data || /[\r\n]/.test(csrf.data)) throw new Error('哔哩哔哩公开初始化失败');
  headers['X-CSRF'] = csrf.data;
  const cookie = init.headers.getSetCookie().find(c => c.startsWith('X-CSRF='));
  if (!cookie) throw new Error('哔哩哔哩匿名 CSRF Cookie 缺失');
  headers.Cookie = cookie.split(';')[0];
  const res = await ctx.fetch(BASE + '/api/campus/position/positionList', { method: 'POST', headers, body: JSON.stringify({ pageSize: 10, pageNum: 1, positionName: '', postCode: [], postCodeList: [], workLocationList: [], workTypeList: ['3'], positionTypeList: ['3'], deptCodeList: [], recruitType: null, practiceTypes: [], onlyHotRecruit: 0 }) });
  if (!res.ok) throw new Error('哔哩哔哩列表 HTTP ' + res.status);
  return parsePage(await res.json());
} } };
