// Positive keywords are applied locally to all fetched candidates. Other changes
// require a new scan: never present another company's cache as this search.
export function scanScopeKey(filters) {
  if (!filters) return null;
  const arrays = ['ats', 'negative', 'allow', 'block', 'blockHard', 'alwaysAllow'];
  return JSON.stringify([filters.sinceDays, filters.limitPerAts,
    ...arrays.map(key => [...new Set(filters[key] || [])].sort())]);
}
