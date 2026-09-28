export const CONFIG_KEY = "career-ops:config";

export function readSettings() {
  const raw = localStorage.getItem(CONFIG_KEY);
  const value = raw === null ? {} : JSON.parse(raw);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("设置格式损坏");
  return value;
}

// Patch only changed preferences; never persist credentials or erase other settings.
export function persistSettings(patch) {
  const previous = readSettings();
  const next = { ...previous };
  for (const key of ["mode", "cliId", "provider", "logos"]) {
    if (Object.hasOwn(patch, key)) next[key] = patch[key];
  }
  delete next.apiKey;
  const oldValue = localStorage.getItem(CONFIG_KEY);
  const newValue = JSON.stringify(next);
  localStorage.setItem(CONFIG_KEY, newValue);
  // Native storage events notify other tabs only; notify this tab's existing readers too.
  window.dispatchEvent(new StorageEvent("storage", { key: CONFIG_KEY, oldValue, newValue }));
  return next;
}
