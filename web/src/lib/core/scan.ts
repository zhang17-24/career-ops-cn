import { spawn } from "node:child_process";
import fs from "node:fs";
import { careerOpsRoot, rootScript } from "@/lib/career-ops";
import { writeTempPortals, cleanupTempPortals } from "./portals";
import { ATS_SOURCES, type DiscoveredOffer, type ExploreFilters, type ScanEvent } from "@/lib/explore";

export type { DiscoveredOffer, ScanEvent, AtsSource } from "@/lib/explore";
export { ATS_SOURCES } from "@/lib/explore";

function firstMatch(title: string, positives: string[]): string | undefined {
  const lower = title.toLowerCase();
  return positives.find((keyword) => keyword && lower.includes(keyword.toLowerCase()));
}

/** The China Explorer uses the normal provider scanner, not the foreign ATS index. */
export function scannerSupportsJson(): boolean {
  try {
    const src = fs.readFileSync(rootScript("scan"), "utf8");
    return src.includes("--json") && src.includes("offers: verifiedOffers");
  } catch {
    return false;
  }
}

type JsonOffer = {
  company?: string;
  title?: string;
  url?: string;
  location?: string | null;
  postedAt?: string | null;
  source?: string;
};

type ScanJson = {
  scanned?: number;
  added?: number;
  errors?: Array<{ company?: string; error?: string }>;
  offers?: JsonOffer[];
};

export function runDiscovery(filters: ExploreFilters, onEvent: (e: ScanEvent) => void): Promise<DiscoveredOffer[]> {
  return new Promise((resolve) => {
    const tempPortals = writeTempPortals(filters);
    const sources = (filters.ats.length ? filters.ats : [...ATS_SOURCES]).filter((source) =>
      (ATS_SOURCES as readonly string[]).includes(source),
    );
    const args = [rootScript("scan"), "--dry-run", "--json", "--since", String(Math.max(1, filters.sinceDays || 7))];
    const child = spawn(process.execPath, args, {
      cwd: careerOpsRoot(),
      env: { ...process.env, CAREER_OPS_PORTALS: tempPortals },
    });

    const offers: DiscoveredOffer[] = [];
    let jsonOut = "";
    let errBuf = "";
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      cleanupTempPortals(tempPortals);
      resolve(offers);
    };
    const killer = setTimeout(() => {
      child.kill("SIGTERM");
      onEvent({ kind: "error", message: "国内职位源响应超时，请稍后重试。" });
    }, 230_000);

    sources.forEach((source) => onEvent({ kind: "atsStart", ats: source, companies: 1 }));
    child.stdout.on("data", (data: Buffer) => { jsonOut += data.toString(); });
    child.stderr.on("data", (data: Buffer) => {
      errBuf += data.toString();
      const lines = errBuf.split(/\r?\n/);
      errBuf = lines.pop() || "";
      for (const line of lines) if (line.trim()) onEvent({ kind: "log", line: line.trim() });
    });
    child.on("error", (error) => {
      clearTimeout(killer);
      onEvent({ kind: "error", message: error instanceof Error ? error.message : "扫描器启动失败" });
      finish();
    });
    child.on("close", () => {
      clearTimeout(killer);
      let receipt: ScanJson | null = null;
      try { receipt = JSON.parse(jsonOut.trim()) as ScanJson; } catch { /* handled below */ }
      if (!receipt || !Array.isArray(receipt.offers)) {
        onEvent({ kind: "error", message: "扫描器没有返回可读取的结果。" });
        finish();
        return;
      }

      for (const item of receipt.offers) {
        if (!item.url || !item.company || !item.title) continue;
        const source = item.source || "company-api";
        const offer: DiscoveredOffer = {
          url: item.url,
          company: item.company,
          title: item.title,
          location: item.location || "",
          postedAt: item.postedAt || "",
          ats: source.replace(/-api$/, ""),
          source,
          matchedKeyword: firstMatch(item.title, filters.positive),
        };
        offers.push(offer);
        onEvent({ kind: "offer", offer });
      }

      for (const source of sources) onEvent({ kind: "atsDone", ats: source, unreachable: 0 });
      const errors = Array.isArray(receipt.errors) ? receipt.errors : [];
      for (const error of errors) {
        onEvent({ kind: "log", line: `${error.company || "招聘源"}：${error.error || "读取失败"}` });
      }
      onEvent({
        kind: "summary",
        companiesScanned: receipt.scanned ?? sources.length,
        unreachable: errors.length,
        matches: receipt.added ?? offers.length,
      });
      finish();
    });
  });
}
