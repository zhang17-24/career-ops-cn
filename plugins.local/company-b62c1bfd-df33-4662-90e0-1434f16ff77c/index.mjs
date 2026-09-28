// Fixed Moka DOM reading is delegated to the platform's anonymous browser reader.
// Only this campus tenant is supported; no API decoding or model calls.
const BASE = 'https://app.mokahr.com/campus-recruitment/pwrd/172467?locale=zh-CN';
export function parseJobs(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('公开列表未确认或超出单页上限');
  const ids = new Set();
  return rows.map(row => {
    if (!row || typeof row.url !== 'string' || !row.url.startsWith(BASE + '#/job/')) throw new Error('非本企业官网详情链接');
    const id = row.url.slice((BASE + '#/job/').length);
    if (!/^[A-Za-z0-9-]+$/.test(id) || ids.has(id)) throw new Error('岗位编号缺失或重复');
    if (row.company !== '完美世界' || typeof row.title !== 'string' || !row.title.trim() || typeof row.location !== 'string' || !row.location.trim()) throw new Error('岗位字段或企业身份不符');
    ids.add(id);
    return { title: row.title, url: row.url, company: row.company, location: row.location, id };
  });
}
export default {
  provider: {
    id: 'company-b62c1bfd-df33-4662-90e0-1434f16ff77c',
    'fetch': async (entry, ctx) => parseJobs(await ctx.browserJobs(entry)),
  },
};
