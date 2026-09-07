import { sourceCatalog } from "@/lib/core/source-catalog";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ sources: sourceCatalog().filter(s => s.enabled) }); }
  catch { return Response.json({ error: "招聘源配置无法读取" }, { status: 500 }); }
}
