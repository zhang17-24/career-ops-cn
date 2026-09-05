import { LayoutDashboard, Compass, ListChecks, Send, Radar, BarChart3, FileText, Settings } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

// Single source of truth for the app's primary destinations — shared by the
// desktop sidebar and the mobile nav so they can never drift.
export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  chip?: string;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "今日", icon: LayoutDashboard },
  { href: "/explore", label: "找职位", icon: Compass, chip: "国内" },
  { href: "/pipeline", label: "投递进度", icon: ListChecks },
  { href: "/followups", label: "跟进", icon: Send },
  { href: "/portals", label: "招聘源", icon: Radar },
  { href: "/analytics", label: "数据分析", icon: BarChart3 },
  { href: "/cv", label: "简历", icon: FileText },
  { href: "/config", label: "设置", icon: Settings },
];

export function isActivePath(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
