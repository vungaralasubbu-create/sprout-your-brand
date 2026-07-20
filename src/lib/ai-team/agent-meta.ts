/**
 * Static metadata for the 12 marketing agents.
 * Icons/colors/gradients are UI-only. The DB owns prompts + tuning.
 */
import {
  Crown, Compass, PenLine, Palette, Video, Search, Megaphone, Mail,
  Users, GitBranch, LineChart, ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export type AgentMeta = {
  slug: string;
  short: string;
  icon: LucideIcon;
  gradient: string; // tailwind bg gradient
  ring: string;     // tailwind ring color
  discipline: string;
  responsibilities: string[];
};

export const AGENT_META: Record<string, AgentMeta> = {
  ceo: {
    slug: "ceo", short: "CEO", icon: Crown,
    gradient: "from-amber-500/20 to-orange-500/10", ring: "ring-amber-500/30",
    discipline: "Leadership",
    responsibilities: ["Understand user goals","Break work into tasks","Delegate tasks","Approve final output","Estimate completion time","Prioritize work","Monitor all agents"],
  },
  "marketing-strategist": {
    slug: "marketing-strategist", short: "Strategist", icon: Compass,
    gradient: "from-blue-500/20 to-cyan-500/10", ring: "ring-blue-500/30",
    discipline: "Strategy",
    responsibilities: ["Marketing strategy","Customer personas","Competitor analysis","SWOT","Campaign planning","Marketing funnel","Growth roadmap","Go-to-market"],
  },
  "content-writer": {
    slug: "content-writer", short: "Writer", icon: PenLine,
    gradient: "from-emerald-500/20 to-teal-500/10", ring: "ring-emerald-500/30",
    discipline: "Content",
    responsibilities: ["Blogs","Instagram posts","LinkedIn posts","Facebook posts","Twitter","Threads","Newsletters","Email campaigns","Case studies","Whitepapers","Website copy"],
  },
  "creative-director": {
    slug: "creative-director", short: "Creative", icon: Palette,
    gradient: "from-fuchsia-500/20 to-pink-500/10", ring: "ring-fuchsia-500/30",
    discipline: "Design",
    responsibilities: ["Poster ideas","Creative direction","Brand design","Banner design","Image prompts","Canva-style layouts","Visual identity","Brand consistency"],
  },
  "video-producer": {
    slug: "video-producer", short: "Video", icon: Video,
    gradient: "from-red-500/20 to-rose-500/10", ring: "ring-red-500/30",
    discipline: "Video",
    responsibilities: ["Reels","YouTube Shorts","TikTok","Commercial scripts","Voiceover","Scene planning","Storyboard","Camera directions","Captions"],
  },
  "seo-specialist": {
    slug: "seo-specialist", short: "SEO", icon: Search,
    gradient: "from-indigo-500/20 to-violet-500/10", ring: "ring-indigo-500/30",
    discipline: "SEO",
    responsibilities: ["Keyword research","SEO audit","Technical SEO","On-page SEO","Internal linking","Blog optimization","Meta titles","Meta descriptions","Schema suggestions"],
  },
  "ads-manager": {
    slug: "ads-manager", short: "Ads", icon: Megaphone,
    gradient: "from-orange-500/20 to-amber-500/10", ring: "ring-orange-500/30",
    discipline: "Paid Media",
    responsibilities: ["Google Ads","Meta Ads","LinkedIn Ads","Campaign budget","Audience","Ad copy","Ad creatives","A/B testing","Performance suggestions"],
  },
  "email-specialist": {
    slug: "email-specialist", short: "Email", icon: Mail,
    gradient: "from-sky-500/20 to-blue-500/10", ring: "ring-sky-500/30",
    discipline: "Email",
    responsibilities: ["Email funnels","Welcome emails","Sales emails","Abandoned cart","Course promotions","Automation","Open-rate optimization"],
  },
  "crm-specialist": {
    slug: "crm-specialist", short: "CRM", icon: Users,
    gradient: "from-purple-500/20 to-fuchsia-500/10", ring: "ring-purple-500/30",
    discipline: "CRM",
    responsibilities: ["Lead scoring","Lead routing","Pipeline","Customer journey","Sales funnel","Retention","Customer segmentation"],
  },
  "automation-engineer": {
    slug: "automation-engineer", short: "Automation", icon: GitBranch,
    gradient: "from-lime-500/20 to-emerald-500/10", ring: "ring-lime-500/30",
    discipline: "Automation",
    responsibilities: ["Workflow builder","Automations","Triggers","Conditions","Scheduling","Integrations","API workflows"],
  },
  "analytics-specialist": {
    slug: "analytics-specialist", short: "Analytics", icon: LineChart,
    gradient: "from-teal-500/20 to-cyan-500/10", ring: "ring-teal-500/30",
    discipline: "Analytics",
    responsibilities: ["Campaign analysis","ROI","Conversion tracking","Dashboards","Predictions","Recommendations","Growth opportunities"],
  },
  "design-qa": {
    slug: "design-qa", short: "QA", icon: ShieldCheck,
    gradient: "from-slate-500/20 to-zinc-500/10", ring: "ring-slate-400/30",
    discipline: "Quality",
    responsibilities: ["Brand consistency","Grammar","Accessibility","Design validation","Duplicate detection","Quality assurance"],
  },
};

export function metaFor(slug: string): AgentMeta {
  return AGENT_META[slug] ?? {
    slug, short: slug, icon: Crown,
    gradient: "from-primary/20 to-primary/5", ring: "ring-primary/30",
    discipline: "AI",
    responsibilities: [],
  };
}
