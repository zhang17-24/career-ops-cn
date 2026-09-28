const ENTRY = 'https://talent.deepseek.com/';
const SOURCE = 'https://app.mokahr.com/social-recruitment/high-flyer/140576#/';
const COMPANY = '深度求索DeepSeek';

// Parse the observed JSON string literal as data; never execute the site bundle.
function decodeLiteral(value) {
  const escapes = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', v: '\v', "'": "'", '"': '"', '\\': '\\', '/': '/' };
  return value.replace(/\\(?:u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[^])/g, token => {
    const c = token.slice(1);
    if (/^[ux]/.test(c) && /^[ux][0-9a-fA-F]+$/.test(c)) return String.fromCharCode(parseInt(c.slice(1), 16));
    if (!Object.hasOwn(escapes, c)) throw new Error('Unsupported data string escape');
    return escapes[c];
  });
}

function text(html) {
  return html.replace(/<[^>]*>/g, ' ').replace(/&(?:amp|quot|apos|lt|gt|nbsp);|&#(?:x[0-9a-f]+|[0-9]+);/gi, token => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>', '&nbsp;': ' ' };
    if (named[token]) return named[token];
    if (!token.startsWith('&#')) return token;
    const n = token[2].toLowerCase() === 'x' ? parseInt(token.slice(3, -1), 16) : Number(token.slice(2, -1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '�';
  }).replace(/\s+/g, ' ').trim();
}

export function bundleUrl(html) {
  if (typeof html !== 'string' || !html.includes('<title>DeepSeek 招聘</title>')) throw new Error('Unexpected recruitment HTML (login/error/changed page)');
  const matches = [...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/g)]
    .map(m => new URL(m[1], ENTRY))
    .filter(u => u.origin === new URL(ENTRY).origin && /^\/static\/main\.[a-zA-Z0-9]+\.js$/.test(u.pathname) && !u.search && !u.hash && !u.username && !u.password);
  if (matches.length !== 1) throw new Error('Expected one official main data bundle');
  return matches[0].href;
}

export function parseBundle(code) {
  if (typeof code !== 'string' || code.length > 5_000_000) throw new Error('Unexpected bundle response');
  const candidates = [...code.matchAll(/JSON\.parse\('((?:\\.|[^'\\])*)'\)/g)]
    .filter(m => m[1].includes('crawledAt') && m[1].includes('sourceUrl'));
  if (candidates.length !== 1) throw new Error('Expected one official job data object');
  const data = JSON.parse(decodeLiteral(candidates[0][1]));
  if (data.sourceUrl !== SOURCE || typeof data.crawledAt !== 'string' || !Number.isFinite(Date.parse(data.crawledAt)) ||
      !Array.isArray(data.jobs) || !Number.isSafeInteger(data.total) || data.total < 0 ||
      data.total !== data.jobs.length || data.total > 500) throw new Error('Job data shape/count changed; pagination unsupported');
  const ids = new Set();
  return data.jobs.map(job => {
    if (!job || typeof job.id !== 'string' || !/^[a-zA-Z0-9-]+$/.test(job.id) || ids.has(job.id) ||
        typeof job.title !== 'string' || !job.title.trim() ||
        !Array.isArray(job.locations) || !job.locations.length || job.locations.some(x => typeof x !== 'string' || !x.trim()) ||
        typeof job.descriptionHtml !== 'string' || !text(job.descriptionHtml) ||
        typeof job.detailUrl !== 'string') throw new Error('Malformed or duplicate job');
    const url = new URL(job.detailUrl);
    if (url.origin !== 'https://app.mokahr.com' || url.pathname !== '/social-recruitment/high-flyer/140576' ||
        url.username || url.password || url.search || url.hash !== '#/job/' + job.id) throw new Error('Unapproved or mismatched detail URL');
    ids.add(job.id);
    return { id: job.id, title: job.title.trim(), url: job.detailUrl, company: COMPANY,
      location: job.locations.join(' / '), description: text(job.descriptionHtml) };
  });
}

async function read(ctx, url) {
  const response = await ctx.fetch(url, { method: 'GET', redirect: 'error', credentials: 'omit' });
  if (!response.ok) throw new Error(`Official source HTTP ${response.status}`);
  return response.text();
}

export default {
  provider: {
    id: 'company-f0e5d08d-1057-42fb-9d12-6a49a3879789',
    'fetch': async (entry, ctx) => {
      if (entry.name && entry.name !== COMPANY) throw new Error('This candidate supports only DeepSeek');
      const html = await read(ctx, ENTRY);
      return parseBundle(await read(ctx, bundleUrl(html)));
    },
  },
};
