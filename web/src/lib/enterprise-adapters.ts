import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { careerOpsRoot, rootScript } from "@/lib/career-ops";

export async function enterpriseAction(action: string, args: Record<string, unknown> = {}) {
  try {
    const { stdout } = await promisify(execFile)(process.execPath, [rootScript("enterprise-adapters"), action, JSON.stringify(args)], {
      cwd: careerOpsRoot(), timeout: 180_000, maxBuffer: 1_000_000,
    });
    return JSON.parse(stdout.trim());
  } catch (error) {
    const e = error as Error & { stderr?: string };
    throw new Error((e.stderr || e.message).trim().slice(0, 500));
  }
}
