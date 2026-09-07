export function selectCompanies(companies, selected, available) {
  const allowed = new Set(selected.filter(id => available.includes(id)));
  return companies.filter(c => c && c.enabled !== false && c.scan_method !== 'websearch' && allowed.has(c.provider));
}
