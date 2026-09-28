// Moka custom-domain HTML bootstrap reader. No encrypted API decoding or fallback.
const ROOT = 'https://hr.yuanfudao.com/';
export function parseMokaHtml(html) {
  if (typeof html !== 'string') throw new Error('Expected official HTML');
  const tag = html.match(/<input\b[^>]*\bid="init-data"[^>]*>/i)?.[0];
  const encoded = tag?.match(/\bvalue="([^"]*)"/)?.[1];
  if (!encoded) throw new Error('Moka init-data unavailable; HTTP response unconfirmed');
  const entities = {quot:'"', amp:'&', lt:'<', gt:'>', apos:"'", '#39':"'"};
  const data = JSON.parse(encoded.replace(/&(quot|amp|lt|gt|apos|#39);/g, (_, key) => entities[key]));
  if (data.org?.id !== 'fenbi' || !String(data.org?.name).includes('猿辅导') || String(data.siteId) !== '47742') throw new Error('Unexpected company or campus tenant');
  if (!Array.isArray(data.jobs) || data.jobs.length > 100) throw new Error('Unexpected jobs schema or page size');
  const seen = new Set();
  for (const j of data.jobs) {
    if (typeof j?.id !== 'string' || !/^[A-Za-z0-9-]+$/.test(j.id) || seen.has(j.id)) throw new Error('Missing or duplicate string job ID');
    seen.add(j.id);
    if (typeof j.title !== 'string' || !j.title.trim() || !['open','closed'].includes(j.status)) throw new Error('Invalid job fields');
  }
  // Only the observed product/R&D category within this initial HTML page.
  // No pagination, no claim that the bootstrap contains every campus job.
  return data.jobs.filter(j => String(j.zhineng?.id) === '160479' && j.status === 'open').map(j => ({
    id: j.id, title: j.title.trim(), company: '猿辅导',
    url: `${ROOT}#/job/${j.id}`,
    location: typeof j.location?.address === 'string' ? j.location.address.trim() : '',
  }));
}
export default { provider: {
  id: 'company-befc3d1d-f3bc-45a1-8e7c-5399e722a42c',
  'fetch': async (_entry, ctx) => parseMokaHtml(await ctx.fetchText(ROOT, { redirect: 'error' })),
} };
