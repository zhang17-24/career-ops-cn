// @ts-check
// 虎牙（huya）公开 ATS：Moka 公开岗位接口 + 官网实际可见的详情路由。
// 一次公开 GET，固定解析，不调用模型、不读取凭证、不回退示例数据。
// 运行时必须保持确定性：HTTP + 解析，禁止 fixture 与 mock。

const COMPANY = '虎牙';

// 官网列表页正常加载时产生的公开 GET（2026-09-21 于 hr.huya.com 观察）。
export const LIST_URL = 'https://api.mokahr.com/v1/jobs/huya?mode=social&limit=100';

// 官网列表实际可见 anchor 的详情路由（同一路由经三个真实岗位打开核对）。
export const DETAIL_URL_PREFIX = 'https://hr.huya.com/SocialRecruit/detail/';

const JOB_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const MAX_LIMIT = 100;

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function plainText(html) {
  return html
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function locationOf(job) {
  if (!Array.isArray(job.locations)) return '';
  const names = [];
  for (const item of job.locations) {
    const name = text(item?.city) || text(item?.province) || text(item?.country);
    if (name && !names.includes(name)) names.push(name);
  }
  return names.join('、');
}

export function parseJobs(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('虎牙公开列表响应不是对象');
  if (payload.code !== 0) throw new Error(`虎牙公开列表返回码异常：${String(payload.code)}`);
  const rows = payload.jobs;
  if (!Array.isArray(rows)) throw new Error('虎牙公开列表缺少 jobs 数组');
  if (!Number.isSafeInteger(payload.total) || payload.total < 0 || payload.total < rows.length) {
    throw new Error('虎牙公开列表分页结构变化');
  }
  if (rows.length > MAX_LIMIT) throw new Error('虎牙公开列表返回超过单页上限');
  if (payload.total > 0 && rows.length === 0) throw new Error('虎牙公开列表为空但总数不为零，结构可能变化');

  const ids = new Set();
  const jobs = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') throw new Error('虎牙岗位记录无效');
    // 官网列表只展示在招岗位；暂停/关闭岗位不作为结果返回。
    if (row.status !== 'open') continue;
    const id = text(row.id);
    if (!JOB_ID.test(id) || ids.has(id)) throw new Error('虎牙岗位编号缺失、格式变化或重复');
    const title = text(row.title);
    if (!title || title.length > 500) throw new Error('虎牙岗位名称缺失或异常');
    ids.add(id);
    const postedAt = Date.parse(text(row.publishedAt) || text(row.openedAt) || '');
    jobs.push({
      id,
      title,
      url: DETAIL_URL_PREFIX + id,
      company: COMPANY,
      location: locationOf(row),
      postedAt: Number.isNaN(postedAt) ? undefined : postedAt,
      description: plainText(text(row.description)),
    });
  }
  return jobs;
}

export default {
  provider: {
    id: 'company-45a5b9c5-9350-4f9a-87d9-866f4b5d24e5',
    'fetch': async (entry, ctx) => parseJobs(await ctx.fetchJson(LIST_URL, { redirect: 'error' })),
  },
};
