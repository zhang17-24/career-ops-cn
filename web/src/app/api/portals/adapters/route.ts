import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";
import { atomicWriteWithBackup } from "@/lib/core/safe-write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Manifest = { id?: string; name?: string; description?: string; hooks?: string[]; allowedHosts?: string[]; version?: string };
type PortalEntry = { name?: string; provider?: string; careers_url?: string; api?: string; [key: string]: unknown };
type PortalDoc = Record<string, unknown> & { tracked_companies?: PortalEntry[] };

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const HOST_RE = /^[a-z0-9.-]+$/i;
const ZH_META: Record<string, { name: string; description: string }> = {
  apify: { name: "Apify 外部采集器", description: "调用已配置的 Apify 任务并把结果转换为岗位列表；需要单独密钥。" },
};

function root() { return careerOpsRoot(); }
function clean(value: unknown, max = 120) { return typeof value === "string" ? value.trim().slice(0, max) : ""; }

function readPluginConfig() {
  const file = path.join(root(), "config", "plugins.yml");
  if (!fs.existsSync(file)) return {} as Record<string, { enabled?: boolean }>;
  const parsed = yaml.load(fs.readFileSync(file, "utf8")) as { plugins?: Record<string, { enabled?: boolean }> } | null;
  return parsed?.plugins && typeof parsed.plugins === "object" ? parsed.plugins : {};
}

function readPortals(): PortalDoc {
  const file = path.join(root(), "portals.yml");
  if (!fs.existsSync(file)) throw new Error("portals.yml 不存在");
  const parsed = yaml.load(fs.readFileSync(file, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("招聘源配置格式不正确");
  return parsed as PortalDoc;
}

function writePortals(doc: PortalDoc) {
  atomicWriteWithBackup(path.join(root(), "portals.yml"), yaml.dump(doc, { lineWidth: 120, noRefs: true, sortKeys: false }));
}

function providerManifests() {
  const configs = readPluginConfig();
  const portals = readPortals().tracked_companies || [];
  const result: Array<Record<string, unknown>> = [];
  for (const [folder, local] of [["plugins", false], ["plugins.local", true]] as const) {
    const dir = path.join(/* turbopackIgnore: true */ root(), folder);
    if (!fs.existsSync(/* turbopackIgnore: true */ dir)) continue;
    for (const entry of fs.readdirSync(/* turbopackIgnore: true */ dir, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
      try {
        const manifest = JSON.parse(fs.readFileSync(/* turbopackIgnore: true */ path.join(dir, entry.name, "manifest.json"), "utf8")) as Manifest;
        if (!manifest.id || !manifest.hooks?.includes("provider")) continue;
        result.push({
          id: manifest.id,
          name: ZH_META[manifest.id]?.name || manifest.name || manifest.id,
          description: ZH_META[manifest.id]?.description || manifest.description || "",
          version: manifest.version || "",
          hosts: manifest.allowedHosts || [],
          enabled: configs[manifest.id]?.enabled === true,
          local,
          companies: portals.filter((company) => company.provider === manifest.id).map((company) => company.name).filter(Boolean),
        });
      } catch { /* malformed plugins are hidden here and reported by the CLI doctor */ }
    }
  }
  return result;
}

function runPlugins(...args: string[]) {
  return execFileSync(process.execPath, [path.join(root(), "plugins.mjs"), ...args], {
    cwd: root(), encoding: "utf8", timeout: 20_000, stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

export async function GET() {
  try { return Response.json({ adapters: providerManifests() }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : "无法读取适配器" }, { status: 500 }); }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "提交内容不是有效 JSON" }, { status: 400 }); }
  const action = clean(body.action, 30);
  const id = clean(body.id, 80);
  try {
    if (action === "scaffold") {
      const host = clean(body.host, 255).toLowerCase();
      const company = clean(body.company);
      if (!ID_RE.test(id)) return Response.json({ error: "适配器 ID 只能使用小写字母、数字和连字符。" }, { status: 400 });
      if (!HOST_RE.test(host) || !host.includes(".")) return Response.json({ error: "请填写 API 域名，例如 jobs.example.com。" }, { status: 400 });
      return Response.json({ ok: true, message: runPlugins("new-provider", id, "--host", host, "--company", company || id) });
    }
    if (action === "enable" || action === "disable") {
      if (!ID_RE.test(id)) return Response.json({ error: "适配器 ID 不正确。" }, { status: 400 });
      const message = action === "enable" ? runPlugins("enable", id, "--confirm") : runPlugins("disable", id);
      return Response.json({ ok: true, message });
    }
    if (action === "bind") {
      const company = clean(body.company);
      const doc = readPortals();
      const rows = Array.isArray(doc.tracked_companies) ? doc.tracked_companies : [];
      const target = rows.find((row) => row.name === company);
      if (!target) return Response.json({ error: "企业不存在。" }, { status: 404 });
      if (id && !providerManifests().some((adapter) => adapter.id === id)) return Response.json({ error: "适配器不存在。" }, { status: 404 });
      if (id) { target.provider = id; delete target.scan_method; delete target.scan_query; }
      else delete target.provider;
      writePortals(doc);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "不支持的操作。" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "适配器操作失败";
    return Response.json({ error: message.slice(0, 500) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return Response.json({ error: "提交内容不是有效 JSON" }, { status: 400 }); }
  const id = clean(body.id, 80);
  if (!ID_RE.test(id)) return Response.json({ error: "适配器 ID 不正确。" }, { status: 400 });
  try {
    const adapter = providerManifests().find((item) => item.id === id);
    if (!adapter) return Response.json({ error: "适配器不存在。" }, { status: 404 });
    if (!adapter.local) return Response.json({ error: "内置适配器不能卸载，只能停用。" }, { status: 400 });
    const doc = readPortals();
    for (const row of doc.tracked_companies || []) if (row.provider === id) delete row.provider;
    writePortals(doc);
    return Response.json({ ok: true, message: runPlugins("remove", id) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message.slice(0, 500) : "无法卸载适配器" }, { status: 500 });
  }
}
