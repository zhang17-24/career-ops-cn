import { CONFIG_KEY, persistSettings } from "./browser-settings.mjs";
export { CONFIG_KEY };

export function readSavedCliId(): string | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    const id = raw ? JSON.parse(raw).cliId : "";
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

export function persistCliId(cliId: string) {
  try {
    persistSettings({ mode: "cli", cliId });
    return true;
  } catch {
    return false;
  }
}

export function pickSoleInstalled(
  clis: { id: string; installed?: boolean }[] | undefined,
): string | null {
  const installed = (clis || []).filter((c) => c.installed);
  return installed.length === 1 ? installed[0].id : null;
}

/** Saved Config cliId, or the only installed CLI (and persist that pick). */
export async function resolveCliId(): Promise<string | null> {
  const saved = readSavedCliId();
  if (saved) return saved;
  try {
    const r = await fetch("/api/clis");
    const d = (await r.json()) as { clis?: { id: string; installed?: boolean }[] };
    // A user may have made a selection while detection was pending.
    const selected = readSavedCliId();
    if (selected) return selected;
    const sole = pickSoleInstalled(d.clis);
    if (!sole) return null;
    return persistCliId(sole) ? sole : null;
  } catch {
    return null;
  }
}
