import { Radar } from "lucide-react";
import { PortalsView } from "@/components/portals-view";

export const dynamic = "force-dynamic";

export default function PortalsPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="flex items-center gap-3">
        <Radar className="size-6 text-brand" />
        <h1 className="font-display text-2xl tracking-tight text-landing">招聘源</h1>
      </div>
      <p className="mt-1.5 max-w-xl text-sm text-muted">
        收录 job-apply Skill 中的企业校招官网。支持自动读取的来源可零 Token 检查，其余来源由你手动打开官网。
      </p>
      <p className="mt-1.5 text-xs text-faint">
        配置保存在 <code className="text-muted">portals.yml</code>，可以直接修改，也可以让助手帮你调整。
      </p>
      <div className="mt-6">
        <PortalsView />
      </div>
    </div>
  );
}
