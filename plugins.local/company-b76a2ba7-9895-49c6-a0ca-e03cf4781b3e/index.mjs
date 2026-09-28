const LIST_URL = 'https://join.fanruan.com/campus';

function text(value, field) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`帆软响应缺少 ${field}`);
  return value.trim();
}

function count(value, field) {
  if (!/^(0|[1-9]\d*)$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`帆软分页字段异常: ${field}`);
  }
  return Number(value);
}

export function parseListing(data) {
  if (!data || !Array.isArray(data.list)) throw new Error('帆软列表结构异常');
  const page = count(data.curPage, 'curPage');
  const size = count(data.pageSize, 'pageSize');
  const total = count(data.dataTotal, 'dataTotal');
  const pages = count(data.pageTotal, 'pageTotal');
  if (page !== 1 || size !== 10 || pages !== Math.ceil(total / size) || data.list.length !== Math.min(size, total)) {
    throw new Error('帆软第一页分页数据不一致');
  }
  const seen = new Set();
  return data.list.map(row => {
    if (!row || typeof row.id !== 'string' || !/^\d+$/.test(row.id) || seen.has(row.id)) {
      throw new Error('帆软岗位编号缺失、非字符串或重复');
    }
    seen.add(row.id);
    return {
      id: row.id,
      title: text(row.job_name, 'job_name'),
      // Public campus click handler and three real clicks establish this mapping.
      url: `https://join.fanruan.com/campus/detail?id=${encodeURIComponent(row.id)}`,
      company: '帆软',
      location: text(row.base, 'base'),
      description: `${text(row.duty, 'duty')}\n\n${text(row.requirement, 'requirement')}`,
    };
  });
}

export default {
  provider: {
    id: 'company-b76a2ba7-9895-49c6-a0ca-e03cf4781b3e',
    'fetch': async (entry, ctx) => {
      if (entry.name !== '帆软' || entry.careers_url !== LIST_URL) throw new Error('仅支持帆软已批准校园招聘入口');
      // ponytail: intentionally one page; broader coverage requires separate acceptance.
      const data = await ctx.fetchJson(LIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'filter=1&page=1&w=',
      });
      return parseListing(data);
    },
  },
};
