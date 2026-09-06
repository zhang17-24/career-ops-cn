import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";
import { atomicWriteWithBackup } from "@/lib/core/safe-write";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalEntry = {
  name?: string;
  careers_url?: string;
  category?: string;
  note?: string;
  provider?: string;
  scan_method?: string;
  scan_query?: string;
  max_pages?: number;
};

type PortalDocument = Record<string, unknown> & { tracked_companies?: PortalEntry[] };

function filePath() {
  return path.join(careerOpsRoot(), "portals.yml");
}

function readDocument(): PortalDocument {
  const file = filePath();
  const source = fs.existsSync(file) ? file : path.join(careerOpsRoot(), "templates", "portals.example.yml");
  const parsed = yaml.load(fs.readFileSync(source, "utf8"));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("招聘源配置格式不正确");
  return parsed as PortalDocument;
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function writeDocument(doc: PortalDocument) {
  atomicWriteWithBackup(filePath(), yaml.dump(doc, { lineWidth: 120, noRefs: true, sortKeys: false }));
}

export async function GET() {
  const file = filePath();
  if (!fs.existsSync(file)) return Response.json({ configured: false, companies: [] });

  try {
    const parsed = yaml.load(fs.readFileSync(file, "utf8")) as { tracked_companies?: PortalEntry[] } | null;
    const companies = (Array.isArray(parsed?.tracked_companies) ? parsed.tracked_companies : [])
      .filter((item) => item?.name && item?.careers_url)
      .map((item) => ({
        name: item.name,
        url: item.careers_url,
        category: item.category || "其他",
        note: item.note || "",
        automatic: item.scan_method !== "websearch",
        provider: item.provider || "",
      }));
    return Response.json({ configured: true, companies });
  } catch (error) {
    return Response.json(
      { configured: false, companies: [], error: error instanceof Error ? error.message : "招聘源配置无法读取" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: { originalName?: unknown; name?: unknown; url?: unknown; category?: unknown; note?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "提交内容不是有效的 JSON。" }, { status: 400 });
  }

  const originalName = clean(body.originalName, 120);
  const name = clean(body.name, 120);
  const url = clean(body.url, 2000);
  const category = clean(body.category, 120) || "其他";
  const note = clean(body.note, 500);
  if (!name) return Response.json({ error: "请填写企业名称。" }, { status: 400 });
  if (!validHttpUrl(url)) return Response.json({ error: "请填写以 http:// 或 https:// 开头的官网链接。" }, { status: 400 });

  try {
    const doc = readDocument();
    const companies = Array.isArray(doc.tracked_companies) ? [...doc.tracked_companies] : [];
    const index = originalName ? companies.findIndex((company) => company.name === originalName) : -1;
    if (originalName && index < 0) return Response.json({ error: "要编辑的企业已经不存在，请刷新后重试。" }, { status: 404 });
    if (companies.some((company, i) => i !== index && company.name?.trim().toLowerCase() === name.toLowerCase())) {
      return Response.json({ error: "已经存在同名企业。" }, { status: 409 });
    }

    const previous = index >= 0 ? companies[index] : undefined;
    const urlChanged = previous?.careers_url !== url;
    const next: PortalEntry = {
      ...(previous || {}),
      name,
      careers_url: url,
      category,
      note,
      max_pages: previous?.max_pages || 3,
    };
    if (!previous || urlChanged) {
      delete next.provider;
      next.scan_method = "websearch";
      next.scan_query = `${name} 校招 岗位`;
    }
    if (index >= 0) companies[index] = next;
    else companies.push(next);
    doc.tracked_companies = companies;
    writeDocument(doc);
    return Response.json({ ok: true, count: companies.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法保存招聘源。" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  let body: { name?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "提交内容不是有效的 JSON。" }, { status: 400 });
  }
  const name = clean(body.name, 120);
  if (!name) return Response.json({ error: "缺少企业名称。" }, { status: 400 });

  try {
    const doc = readDocument();
    const companies = Array.isArray(doc.tracked_companies) ? doc.tracked_companies : [];
    const next = companies.filter((company) => company.name !== name);
    if (next.length === companies.length) return Response.json({ error: "该企业已经不存在。" }, { status: 404 });
    doc.tracked_companies = next;
    writeDocument(doc);
    return Response.json({ ok: true, count: next.length });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "无法删除招聘源。" }, { status: 500 });
  }
}
