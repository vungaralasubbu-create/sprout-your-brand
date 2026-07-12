/**
 * CMS data layer (Prompt 1 architecture).
 *
 * These async loaders simulate the future CMS/database queries. When Cloud
 * (Supabase) is wired up, swap the bodies for real queries — component code
 * stays identical because it consumes them through TanStack Query.
 *
 * NEVER hardcode this data inside UI components.
 */

import type { LucideIcon } from "lucide-react";
import {
  Atom,
  BarChart3,
  BrainCircuit,
  Briefcase,
  Building2,
  Cpu,
  Cog,
  GraduationCap,
  Landmark,
  Layers,
  LineChart,
  Radio,
  Rocket,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

// ---------- Types ----------

export interface CourseCategory {
  slug: string;
  name: string;
  icon: LucideIcon;
  accent: "brand" | "lime" | "violet" | "cyan";
  description: string;
  topics: string[];
  courseCount: number;
  featured: boolean;
  published: boolean;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  categorySlug: string;
  categoryName: string;
  shortDescription: string;
  duration: string;
  learningMode: "Online" | "Hybrid" | "Live";
  level: "Beginner" | "Intermediate" | "Advanced";
  rating: number;
  enrollments: number;
  price: number;
  offerPrice?: number;
  emiAvailable: boolean;
  badge?: { label: string; variant?: "certified" | "bestseller" | "live" | "default" };
  featured: boolean;
  published: boolean;
}

export interface PlatformStat {
  key: string;
  label: string;
  value: number | null;
  suffix?: string;
  prefix?: string;
  verified: boolean;
}

export interface SuccessStory {
  id: string;
  name: string;
  role: string;
  type: "partner" | "student" | "brand_owner" | "career_transition";
  previous: string;
  current: string;
  quote: string;
  verified: boolean;
  published: boolean;
}

export interface PartnerNetworkItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  approved: boolean;
}

// ---------- Mock CMS data ----------

const CATEGORIES: CourseCategory[] = [
  {
    slug: "computer-science",
    name: "Computer Science",
    icon: BrainCircuit,
    accent: "brand",
    description: "AI, ML, Data Science, Web & App Development, Cloud, Cyber Security.",
    topics: [
      "Artificial Intelligence",
      "Machine Learning",
      "Data Science",
      "Data Analytics",
      "Web Development",
      "App Development",
      "Cloud Computing",
      "Cyber Security",
    ],
    courseCount: 42,
    featured: true,
    published: true,
  },
  {
    slug: "electronics-electrical",
    name: "Electronics & Electrical",
    icon: Cpu,
    accent: "cyan",
    description: "VLSI, embedded systems, IoT and robotics programs.",
    topics: ["VLSI Design", "Embedded Systems", "Internet of Things (IoT)", "Robotics"],
    courseCount: 18,
    featured: true,
    published: true,
  },
  {
    slug: "mechanical-engineering",
    name: "Mechanical Engineering",
    icon: Cog,
    accent: "violet",
    description: "CAD, CAM, drones, product & manufacturing design.",
    topics: [
      "AutoCAD",
      "Drone Engineering",
      "CAD/CAM",
      "SolidWorks",
      "Product Design",
      "Manufacturing Engineering",
    ],
    courseCount: 21,
    featured: true,
    published: true,
  },
  {
    slug: "management",
    name: "Management",
    icon: Briefcase,
    accent: "lime",
    description: "HR, marketing, finance, banking, stock market and operations.",
    topics: [
      "Human Resource Management",
      "Digital Marketing",
      "Finance",
      "Investment Banking",
      "Stock Market",
      "Sales & Marketing",
      "Business Analytics",
      "Operations Management",
    ],
    courseCount: 34,
    featured: true,
    published: true,
  },
];

const PROGRAMS: Program[] = [
  {
    id: "p-ai-pro",
    slug: "advanced-ai-machine-learning",
    title: "Advanced AI & Machine Learning Program",
    categorySlug: "computer-science",
    categoryName: "Computer Science",
    shortDescription:
      "Production-grade ML: from foundations to deploying LLM-powered systems.",
    duration: "6 months",
    learningMode: "Live",
    level: "Advanced",
    rating: 4.8,
    enrollments: 2140,
    price: 60000,
    offerPrice: 42000,
    emiAvailable: true,
    badge: { label: "Bestseller", variant: "bestseller" },
    featured: true,
    published: true,
  },
  {
    id: "p-data-sci",
    slug: "data-science-analytics",
    title: "Data Science & Analytics Career Track",
    categorySlug: "computer-science",
    categoryName: "Computer Science",
    shortDescription: "Python, SQL, statistics, BI, and portfolio projects with mentorship.",
    duration: "5 months",
    learningMode: "Hybrid",
    level: "Intermediate",
    rating: 4.7,
    enrollments: 1820,
    price: 45000,
    offerPrice: 32000,
    emiAvailable: true,
    badge: { label: "Certified", variant: "certified" },
    featured: true,
    published: true,
  },
  {
    id: "p-vlsi",
    slug: "vlsi-design-fundamentals",
    title: "VLSI Design & Verification",
    categorySlug: "electronics-electrical",
    categoryName: "Electronics & Electrical",
    shortDescription: "Digital design, Verilog, SystemVerilog, and industry tooling.",
    duration: "4 months",
    learningMode: "Online",
    level: "Intermediate",
    rating: 4.6,
    enrollments: 640,
    price: 38000,
    offerPrice: 28000,
    emiAvailable: true,
    featured: true,
    published: true,
  },
  {
    id: "p-drone",
    slug: "drone-engineering",
    title: "Drone Engineering & UAV Systems",
    categorySlug: "mechanical-engineering",
    categoryName: "Mechanical Engineering",
    shortDescription: "Aerodynamics, flight controllers, PCB, and field testing.",
    duration: "3 months",
    learningMode: "Hybrid",
    level: "Beginner",
    rating: 4.5,
    enrollments: 410,
    price: 30000,
    emiAvailable: true,
    badge: { label: "New", variant: "live" },
    featured: true,
    published: true,
  },
  {
    id: "p-invest-bank",
    slug: "investment-banking",
    title: "Investment Banking Career Program",
    categorySlug: "management",
    categoryName: "Management",
    shortDescription: "Valuation, M&A, financial modelling and live case studies.",
    duration: "5 months",
    learningMode: "Live",
    level: "Intermediate",
    rating: 4.8,
    enrollments: 1210,
    price: 55000,
    offerPrice: 39000,
    emiAvailable: true,
    badge: { label: "Bestseller", variant: "bestseller" },
    featured: true,
    published: true,
  },
  {
    id: "p-digital-mkt",
    slug: "digital-marketing-pro",
    title: "Digital Marketing Pro",
    categorySlug: "management",
    categoryName: "Management",
    shortDescription: "SEO, paid media, content, analytics and marketing automation.",
    duration: "4 months",
    learningMode: "Online",
    level: "Beginner",
    rating: 4.6,
    enrollments: 2350,
    price: 28000,
    offerPrice: 19000,
    emiAvailable: true,
    featured: true,
    published: true,
  },
];

const STATS: PlatformStat[] = [
  { key: "active_programs", label: "Active Programs", value: 120, verified: true },
  { key: "registered_partners", label: "Registered Partners", value: 3200, verified: true },
  { key: "brands_launched", label: "Brands Launched", value: 46, verified: true },
  { key: "students_enrolled", label: "Students Enrolled", value: 28400, verified: true },
  { key: "categories", label: "Program Categories", value: 4, verified: true },
];

const STORIES: SuccessStory[] = [
  {
    id: "s-1",
    name: "Rahul M.",
    role: "Sales Partner",
    type: "partner",
    previous: "Field Sales, ₹22,000/mo salary with ₹1L target",
    current: "Sales Partner, own leads, 70% share model",
    quote:
      "I already had a network from my job. Once I switched to a revenue-share model, my income depends on my effort, not on my salary slab.",
    verified: true,
    published: true,
  },
  {
    id: "s-2",
    name: "Priya S.",
    role: "Brand Owner",
    type: "brand_owner",
    previous: "Sales team lead at an edtech reseller",
    current: "Founder of a white-label EdTech brand",
    quote:
      "I wanted to sell education under my own name. The white-label stack gave me a website, LMS and CRM in under a day.",
    verified: true,
    published: true,
  },
  {
    id: "s-3",
    name: "Karan P.",
    role: "Student → Career Transition",
    type: "career_transition",
    previous: "Non-tech graduate, no coding background",
    current: "Data Analyst after completing the Data Science track",
    quote:
      "The program was structured, mentors were reachable, and my mock interviews were brutal in the best way.",
    verified: true,
    published: true,
  },
];

const PARTNER_NETWORK: PartnerNetworkItem[] = [
  { id: "n-1", title: "Our Career Programs", description: "Core Glintr career tracks across CS, EE, ME and Management.", icon: GraduationCap, approved: true },
  { id: "n-2", title: "Partner Institution Programs", description: "Programs from approved partner institutions listed in the CMS.", icon: Landmark, approved: true },
  { id: "n-3", title: "Corporate Training Programs", description: "Enterprise upskilling packages sold to teams.", icon: Building2, approved: true },
  { id: "n-4", title: "Certification Programs", description: "Short, credentialed programs for role-based skills.", icon: ShieldCheck, approved: true },
  { id: "n-5", title: "Skill Development Programs", description: "Focused skill modules across tools and domains.", icon: Wrench, approved: true },
  { id: "n-6", title: "White Label Programs", description: "Programs available for resale under partner brands.", icon: Layers, approved: true },
  { id: "n-7", title: "Own Brand Programs", description: "Programs published by partner brand owners on our stack.", icon: Rocket, approved: true },
];

// ---------- Loaders (swap for DB queries later) ----------

async function delay<T>(v: T) {
  return v;
}

export async function fetchFeaturedCategories(): Promise<CourseCategory[]> {
  return delay(CATEGORIES.filter((c) => c.published && c.featured));
}

export async function fetchFeaturedPrograms(): Promise<Program[]> {
  return delay(PROGRAMS.filter((p) => p.published && p.featured));
}

export async function fetchPlatformStats(): Promise<PlatformStat[]> {
  return delay(STATS.filter((s) => s.verified && s.value !== null));
}

export async function fetchSuccessStories(): Promise<SuccessStory[]> {
  return delay(STORIES.filter((s) => s.published));
}

export async function fetchPartnerNetwork(): Promise<PartnerNetworkItem[]> {
  return delay(PARTNER_NETWORK.filter((p) => p.approved));
}
