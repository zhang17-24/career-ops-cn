import fs from "node:fs";
import path from "node:path";
import * as yaml from "js-yaml";
import { careerOpsRoot } from "@/lib/career-ops";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PortalEntry = {
  name?: string;
  careers_url?: string;
  category?: string;
  note?: string;
  provider?: string;
  scan_method?: string;
};

export async function GET() {
  const file = path.join(careerOpsRoot(), "portals.yml");
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
