import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Building2,
  ListChecks,
  Sparkles,
  Route,
  History,
  Plug,
  Settings,
  FlaskConical,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Leads", href: "/leads", icon: Users },
  { label: "Buyers", href: "/buyers", icon: Building2 },
  { label: "Quizzes/Funnels", href: "/funnels", icon: ListChecks },
  { label: "AI Funnel Builder", href: "/funnels/ai-builder", icon: Sparkles },
  { label: "Routing Rules", href: "/routing-rules", icon: Route },
  { label: "System History", href: "/history", icon: History },
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Settings", href: "/settings", icon: Settings },
];

// Dev tools can create/delete data at will, so keep it out of production navs.
export const NAV_ITEMS: NavItem[] =
  process.env.NODE_ENV === "production"
    ? BASE_NAV_ITEMS
    : [...BASE_NAV_ITEMS, { label: "Dev Tools", href: "/dev", icon: FlaskConical }];
