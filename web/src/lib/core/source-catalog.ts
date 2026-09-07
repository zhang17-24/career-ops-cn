import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";
import { ATS_SOURCES, ATS_LABEL } from "@/lib/explore";

/** Read metadata only; listing sources must never import or execute a plugin. */
export function sourceCatalog() {
  const root = careerOpsRoot();
  const configPath = path.join(root, "config/plugins.yml");
  const config = fs.existsSync(configPath) ? yaml.load(fs.readFileSync(configPath, "utf8")) as { plugins?: Record<string, { enabled?: boolean }> } : null;
  const sources = ATS_SOURCES.map(id => ({ id, name: ATS_LABEL[id], enabled: true, plugin: false }));
  for (const folder of ["plugins", "plugins.local"]) {
    const dir = path.join(/* turbopackIgnore: true */ root, folder);
    if (!fs.existsSync(/* turbopackIgnore: true */ dir)) continue;
    for (const entry of fs.readdirSync(/* turbopackIgnore: true */ dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || !/^[a-z0-9][a-z0-9-]*$/.test(entry.name)) continue;
      const file = path.join(/* turbopackIgnore: true */ dir, entry.name, "manifest.json");
      if (!fs.existsSync(/* turbopackIgnore: true */ file)) continue;
      const m = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ file, "utf8"));
      if (m.id !== entry.name || !m.hooks?.includes("provider") || sources.some(s => s.id === m.id)) continue;
      sources.push({ id: m.id, name: m.name || m.id, enabled: config?.plugins?.[m.id]?.enabled === true, plugin: true });
    }
  }
  return sources;
}
