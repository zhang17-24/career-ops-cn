// 唯品会（vipshophr）校招：Moka 公开招聘页（app-tc.mokahr.com）。
// 岗位列表为 SPA 异步渲染，公开列表接口返回封装数据，HTTP 路线未固定解析；
// 因此使用平台固定 DOM reader（manifest.browserListing）单页读取可见岗位，
// 编号取自岗位 anchor 实际 href 的 #/job/<uuid> 路由末段。
// 不解码封装、不调用模型、不翻页、不携带凭证、不回退示例数据。
const COMPANY = '唯品会';
const LIST_ORIGIN = 'https://app-tc.mokahr.com';
const LIST_PATHNAME = '/campus-recruitment/vipshophr/10039';
const JOB_HASH_PREFIX = '#/job/';

export function preserveIds(rows) {
  if (!Array.isArray(rows) || !rows.length || rows.length > 100) throw new Error('唯品会公开列表未确认或超过单页上限');
  const ids = new Set();
  const jobs = [];
  for (const job of rows) {
    if (!job || typeof job !== 'object') throw new Error('唯品会岗位记录无效');
    const url = new URL(String(job.url || ''));
    if (url.origin !== LIST_ORIGIN || url.pathname !== LIST_PATHNAME || url.search !== '' ||
        !url.hash.startsWith(JOB_HASH_PREFIX) || url.hash.length <= JOB_HASH_PREFIX.length ||
        url.hash.slice(JOB_HASH_PREFIX.length).includes('/')) throw new Error('唯品会岗位链接结构变化');
    const title = typeof job.title === 'string' ? job.title.trim() : '';
    const location = typeof job.location === 'string' ? job.location.trim() : '';
    if (!title || !location || job.company !== COMPANY) throw new Error('唯品会岗位字段缺失或企业身份不符');
    const id = url.hash.slice(JOB_HASH_PREFIX.length);
    if (ids.has(id)) throw new Error('唯品会重复岗位编号');
    ids.add(id);
    jobs.push({ title, url: url.href, company: COMPANY, location, id });
  }
  return jobs;
}

export default {
  provider: {
    id: 'company-56286487-d911-4432-9a84-da8a2a66dc74',
    'fetch': async (entry, ctx) => preserveIds(await ctx.browserJobs(entry)),
  },
};
