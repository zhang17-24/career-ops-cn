// Agent proposals are data, never permission. Approval lives outside the candidate.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { isIP } from 'node:net';

export function publicRouteUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) throw new Error('路线地址格式不正确');
  const u = new URL(value);
  if (u.protocol !== 'https:' || u.username || u.password || u.port ||
      isIP(u.hostname) || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(u.hostname) ||
      /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(u.hostname)) throw new Error('路线只允许公开 HTTPS 域名，不允许 IP、内网、凭证或非标准端口');
  return u.href;
}

export function readRouteProposal(dir) {
  const file = path.join(dir, 'ROUTE_REVIEW.json');
  let stat;
  try { stat = fs.lstatSync(file); } catch (e) { if (e.code === 'ENOENT') return null; throw e; }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 24000) throw new Error('路线申请必须是小于 24KB 的普通 JSON 文件');
  const raw = fs.readFileSync(file, 'utf8');
  const p = JSON.parse(raw);
  const entryUrl = publicRouteUrl(p.entryUrl);
  const officialUrl = publicRouteUrl(p.officialUrl);
  if (!Array.isArray(p.allowedHosts) || !p.allowedHosts.length || p.allowedHosts.length > 6 ||
      p.allowedHosts.some(h => typeof h !== 'string' || new URL(publicRouteUrl(`https://${h}/`)).hostname !== h)) throw new Error('路线最多声明六个精确域名，不接受通配符');
  const allowedHosts = [...new Set(p.allowedHosts)].sort();
  if (!allowedHosts.includes(new URL(entryUrl).hostname)) throw new Error('招聘入口域名必须在申请中');
  if (!Array.isArray(p.evidence) || !p.evidence.length || p.evidence.length > 8) throw new Error('路线需提供一至八条官网来源证据');
  const evidence = p.evidence.map(e => {
    if (!['link', 'redirect', 'api'].includes(e.kind) || typeof e.note !== 'string' || !e.note.trim() || e.note.length > 1000) throw new Error('路线证据需包含类型及简短说明');
    return { fromUrl: publicRouteUrl(e.fromUrl), toUrl: publicRouteUrl(e.toUrl), kind: e.kind, note: e.note.trim() };
  });
  // A connected chain prevents unrelated hosts from silently joining a proposal.
  // The human must still verify that the claimed official source really is official.
  const reached = new Set([officialUrl]);
  for (const e of evidence) {
    if (!reached.has(e.fromUrl)) throw new Error('证据必须从企业官网按顺序连接，不接受孤立链接');
    reached.add(e.toUrl);
  }
  if (!reached.has(entryUrl) || allowedHosts.some(h => ![...reached].some(u => new URL(u).hostname === h))) throw new Error('入口及每个申请域名都需要官网链接或公开请求证据');
  return { entryUrl, officialUrl, allowedHosts, evidence, digest: createHash('sha256').update(raw).digest('hex') };
}

export function routeIsApproved(proposal, state) {
  if (!proposal) return false;
  // Delegation is stored by the server, never read from the candidate proposal.
  // Discovery must remain rooted in this company's configured/approved source.
  if (state.publicAdaptationAuthorizedAt && [state.host, state.approvedRoute && new URL(state.approvedRoute.officialUrl).hostname].includes(new URL(proposal.officialUrl).hostname)) return true;
  return state.approvedRoute?.digest === proposal.digest;
}

export function verificationRoute(dir, state, row) {
  const proposal = readRouteProposal(dir);
  if (proposal && !routeIsApproved(proposal, state)) throw new Error('招聘入口及域名待用户审核');
  if (!proposal && state.approvedRoute) throw new Error('已批准的路线文件缺失，不能继续验收');
  return proposal ? { entryUrl: proposal.entryUrl, allowedHosts: proposal.allowedHosts }
    : { entryUrl: state.originalUrl || row.careers_url, allowedHosts: [state.host] };
}
