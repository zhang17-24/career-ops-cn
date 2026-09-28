// Moka public HTML init-data parser; no script execution or encrypted API decoding.
export const HOME = 'https://hr.yuanfudao.com/';
export const DOCUMENT = 'https://hr.yuanfudao.com/campus-recruitment/fenbi/47742/';
export const LIST = DOCUMENT + '#/jobs?&zhineng%5B0%5D=160479';

function decodeAttribute(text) {
  const named = { quot: '"', apos: "'", amp: '&', lt: '<', gt: '>' };
  return text.replace(/&(#x[\da-f]+|#\d+|quot|apos|amp|lt|gt);/gi, (_, entity) => {
    if (entity[0] !== '#') return named[entity.toLowerCase()];
    const hex = entity[1].toLowerCase() === 'x';
    const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
    if (code > 0x10ffff || code >= 0xd800 && code <= 0xdfff) throw new Error('Invalid HTML entity');
    return String.fromCodePoint(code);
  });
}

export function parseMokaHtml(html) {
  if (typeof html !== 'string') throw new Error('Expected official HTML');
  const tags = html.match(/<input\b[^>]*\bid=["']init-data["'][^>]*>/gi) || [];
  if (tags.length !== 1) throw new Error('Official init-data missing or ambiguous; access/structure unconfirmed');
  const value = tags[0].match(/\bvalue=("[^"]*"|'[^']*')/i)?.[1];
  if (!value) throw new Error('Missing init-data value');
  const data = JSON.parse(decodeAttribute(value.slice(1, -1)));
  if (data?.org?.id !== 'fenbi' || !/猿辅导/.test(data.org.name || '') || String(data.siteId) !== '47742') throw new Error('Recruitment identity mismatch');
  if (!Array.isArray(data.jobs) || data.jobs.length > 100) throw new Error('Invalid initial job page');
  const ids = new Set();
  const jobs = [];
  for (const row of data.jobs) {
    if (!row || typeof row.id !== 'string' || !/^[\w-]+$/.test(row.id) || ids.has(row.id)) throw new Error('Invalid or duplicate string job ID');
    ids.add(row.id);
    if (typeof row.title !== 'string' || !row.title.trim()) throw new Error('Missing job title');
    if (!['open', 'closed'].includes(row.status)) throw new Error('Unrecognized job state');
    if (row.status !== 'open' || String(row.zhineng?.id) !== '160479') continue;
    if (!Array.isArray(row.locations)) throw new Error('Invalid locations');
    const location = row.locations.map(place => {
      if (!place || typeof place !== 'object') throw new Error('Invalid location');
      return ['country', 'provinceName', 'cityName', 'address'].map(key => {
        if (place[key] != null && typeof place[key] !== 'string') throw new Error('Invalid location text');
        return place[key]?.trim() || '';
      }).filter(Boolean).join(' ');
    }).filter(Boolean).join('/');
    const job = { id: row.id, title: row.title.trim(), url: DOCUMENT + '#/job/' + row.id, company: '猿辅导', location };
    if (row.publishedAt != null) {
      if (typeof row.publishedAt !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(row.publishedAt) || !Number.isFinite(Date.parse(row.publishedAt))) throw new Error('Invalid publication date');
      job.postedAt = Date.parse(row.publishedAt);
    }
    jobs.push(job);
  }
  return jobs;
}

export default {
  provider: {
    id: 'company-af53c855-ffdc-48b1-80c9-a7fa9531a73c',
    'fetch': async (entry, ctx) => {
      // A single anonymous session initialization; cookie values stay in this call.
      const init = await ctx.fetch(HOME, { redirect: 'manual' });
      if (init.status !== 302 || new URL(init.headers.get('location'), HOME).href !== DOCUMENT) throw new Error('Official entrance changed');
      const cookie = init.headers.getSetCookie().map(value => value.split(';')[0]).join('; ');
      if (!cookie) throw new Error('Anonymous initialization unavailable');
      const response = await ctx.fetch(DOCUMENT, { redirect: 'manual', headers: { cookie } });
      if (response.status !== 200) throw new Error('Official HTML unconfirmed: HTTP ' + response.status);
      return parseMokaHtml(await response.text());
    },
  },
};
