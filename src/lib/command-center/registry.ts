/**
 * Command Center Registry
 *
 * Central catalog of navigable destinations and quick actions used by:
 *  - Global command palette (Cmd/Ctrl+K)
 *  - Role-specific Quick Actions grids
 *  - Daily Briefing "recommended action" links
 *
 * Client-only. No PII. Role inference is best-effort based on current pathname.
 */

import type { ComponentType } from "react";
import {
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Calendar,
  Compass,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MessageSquare,
  Package,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wallet,
  Wrench,
  Zap,
} from "lucide-react";

export type CommandRole =
  | "student"
  | "sales_partner"
  | "academy_partner"
  | "corporate"
  | "college"
  | "admin"
  | "founder"
  | "guest";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  to: string;
  group: "nav" | "action" | "content" | "settings";
  roles: CommandRole[] | "*";
  keywords?: string[];
  icon?: ComponentType<{ className?: string }>;
}

/**
 * Infer role from the current pathname. Deliberately loose — the palette
 * shows only role-appropriate items but never blocks navigation, and the
 * routes themselves are the source of truth for real access control.
 */
export function inferRole(pathname: string): CommandRole {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/partner")) return "sales_partner";
  if (pathname.startsWith("/brand")) return "academy_partner";
  if (pathname.startsWith("/college")) return "college";
  if (pathname.startsWith("/corporate")) return "corporate";
  if (
    pathname.startsWith("/my") ||
    pathname.startsWith("/learn") ||
    pathname.startsWith("/workspace")
  )
    return "student";
  return "guest";
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

// --- Registry ----------------------------------------------------------------

export const COMMAND_ITEMS: CommandItem[] = [
  // Universal navigation
  { id: "home", label: "Home", to: "/", group: "nav", roles: "*", icon: Compass },
  { id: "programs", label: "Browse Programs", to: "/programs", group: "nav", roles: "*", icon: GraduationCap, keywords: ["courses", "learn"] },
  { id: "blog", label: "Blog", to: "/blog", group: "content", roles: "*", icon: FileText, keywords: ["articles", "insights"] },
  { id: "glossary", label: "Glossary", to: "/glossary", group: "content", roles: "*", icon: BookOpen },
  { id: "career-maps", label: "Career Roadmaps", to: "/career-maps", group: "content", roles: "*", icon: Target },
  { id: "tools", label: "AI Tools", to: "/tools", group: "content", roles: "*", icon: Wrench },
  { id: "contact", label: "Contact Us", to: "/contact", group: "nav", roles: "*", icon: MessageSquare },

  // Student
  { id: "my", label: "My Learning", to: "/my", group: "nav", roles: ["student"], icon: LayoutDashboard, keywords: ["dashboard", "home"] },
  { id: "workspace", label: "AI Workspace", to: "/workspace", group: "action", roles: ["student"], icon: BrainCircuit, keywords: ["notes", "flashcards"] },
  { id: "learn-live", label: "Live Classroom", to: "/live", group: "action", roles: ["student"], icon: Calendar },
  { id: "recommend", label: "Course Recommendations", to: "/programs/recommend", group: "action", roles: ["student", "guest"], icon: Sparkles, keywords: ["quiz", "suggest"] },
  { id: "success-stories", label: "Success Stories", to: "/success-stories", group: "content", roles: ["student", "guest"], icon: Trophy },

  // Sales partner
  { id: "partner-dash", label: "Partner Dashboard", to: "/partner/dashboard", group: "nav", roles: ["sales_partner"], icon: LayoutDashboard },
  { id: "partner-leads", label: "Leads", to: "/partner/leads", group: "nav", roles: ["sales_partner"], icon: Users, keywords: ["crm", "prospects"] },
  { id: "partner-earnings", label: "Earnings & Payouts", to: "/partner/earnings", group: "nav", roles: ["sales_partner"], icon: Wallet, keywords: ["commission", "money"] },
  { id: "partner-marketing", label: "Marketing Assets", to: "/partner/marketing", group: "action", roles: ["sales_partner"], icon: Megaphone },
  { id: "partner-sales-ai", label: "Sales AI Center", to: "/partner/sales-ai", group: "action", roles: ["sales_partner", "academy_partner"], icon: Sparkles, keywords: ["ai", "agents", "qualification", "objections", "proposal", "forecast"] },
  { id: "partner-ai-coo", label: "AI COO", to: "/partner/ai-coo", group: "action", roles: ["sales_partner", "academy_partner"], icon: BrainCircuit, keywords: ["advisor", "recommendations"] },
  { id: "launch-academy", label: "Launch My Academy", to: "/partner/launch-academy", group: "action", roles: ["sales_partner"], icon: Rocket },

  // Academy partner
  { id: "brand-dash", label: "Academy Dashboard", to: "/brand/dashboard", group: "nav", roles: ["academy_partner"], icon: LayoutDashboard },
  { id: "brand-studio", label: "Brand Launch Studio", to: "/partner/brand-studio", group: "action", roles: ["academy_partner"], icon: Sparkles },
  { id: "business-os", label: "Business OS", to: "/partner/business-os", group: "nav", roles: ["academy_partner"], icon: Package },
  { id: "ai-employees", label: "AI Employees", to: "/partner/ai-employees", group: "action", roles: ["academy_partner"], icon: BrainCircuit },
  { id: "digital-employees", label: "Digital Employees Center", to: "/partner/digital-employees", group: "action", roles: ["academy_partner"], icon: Users, keywords: ["team", "org chart", "coo", "delegate", "workflow"] },
  { id: "academy-builder", label: "Academy Builder", to: "/partner/academy-builder", group: "action", roles: ["academy_partner"], icon: Rocket },

  // Admin
  { id: "admin-dash", label: "Admin Dashboard", to: "/admin/dashboard", group: "nav", roles: ["admin", "founder"], icon: LayoutDashboard },
  { id: "admin-courses", label: "Manage Courses", to: "/admin/courses", group: "nav", roles: ["admin"], icon: GraduationCap },
  { id: "admin-blogs", label: "Manage Blogs", to: "/admin/blogs", group: "nav", roles: ["admin"], icon: FileText },
  { id: "admin-ai-content", label: "AI Content Factory", to: "/admin/ai-content", group: "action", roles: ["admin"], icon: Sparkles },
  { id: "admin-ai-coo", label: "AI COO — Growth", to: "/admin/ai-coo", group: "action", roles: ["admin", "founder"], icon: LineChart, keywords: ["growth", "advisor"] },
  { id: "admin-partners", label: "Partners", to: "/admin/partners", group: "nav", roles: ["admin"], icon: Briefcase },
  { id: "admin-students", label: "Students", to: "/admin/students", group: "nav", roles: ["admin"], icon: Users },
  { id: "admin-finance", label: "Finance", to: "/admin/finance", group: "nav", roles: ["admin", "founder"], icon: Wallet },
  { id: "admin-support", label: "Support Center", to: "/admin/support", group: "nav", roles: ["admin"], icon: ShieldCheck },
  { id: "admin-settings", label: "Platform Settings", to: "/admin/settings", group: "settings", roles: ["admin"], icon: Settings },
  { id: "admin-integrations", label: "Integration Hub", to: "/admin/integrations", group: "nav", roles: ["admin", "founder", "academy_partner"], icon: Package, keywords: ["connect", "api", "webhook", "razorpay", "stripe", "zoom", "gmail"] },
  { id: "admin-marketplace", label: "Marketplace — Apps & AI Agents", to: "/admin/marketplace", group: "nav", roles: ["admin", "founder", "academy_partner"], icon: Sparkles, keywords: ["app store", "agents", "install", "workflow", "extensions", "plugin"] },

  // Corporate / college
  { id: "corp-dash", label: "Corporate Dashboard", to: "/corporate", group: "nav", roles: ["corporate"], icon: Building2 },
  { id: "college-dash", label: "College Dashboard", to: "/college", group: "nav", roles: ["college"], icon: GraduationCap },

  // Cross-role quick actions
  { id: "generate-blog", label: "Generate Blog with AI", to: "/admin/ai-content/factory", group: "action", roles: ["admin", "academy_partner"], icon: Zap, keywords: ["write", "article"] },
  { id: "search-global", label: "Search Everything", to: "/search", group: "action", roles: "*", icon: Search },
];

/** Filter registry items to those visible for the current role. */
export function itemsForRole(role: CommandRole): CommandItem[] {
  return COMMAND_ITEMS.filter(
    (i) => i.roles === "*" || (Array.isArray(i.roles) && i.roles.includes(role)),
  );
}

/** Grouped items keyed by group label for palette rendering. */
export function groupItems(items: CommandItem[]): Record<CommandItem["group"], CommandItem[]> {
  const out: Record<CommandItem["group"], CommandItem[]> = {
    nav: [],
    action: [],
    content: [],
    settings: [],
  };
  for (const it of items) out[it.group].push(it);
  return out;
}
