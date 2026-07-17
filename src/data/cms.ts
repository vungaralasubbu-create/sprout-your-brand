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
  /** Optional profile photo. When absent, the UI renders professional initials. */
  avatar?: string;
  /** Company name shown next to the logo. */
  company?: string;
  /** Company for logo resolution (SimpleIcons slug + domain fallback). */
  companySlug?: string;
  companyDomain?: string;
  /** Program the learner completed. */
  course?: string;
  /** Star rating 1-5. Defaults to 5 when omitted. */
  rating?: number;
  /** Optional placement package label, e.g. "₹18 LPA". */
  packageLabel?: string;
  /** Optional LinkedIn profile URL. */
  linkedin?: string;
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
    description: "Build future-ready technology skills across software, data, AI, and digital infrastructure.",
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
    description: "Explore intelligent hardware, semiconductor systems, connected devices, and automation technologies.",
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
    description: "Develop practical engineering and design skills for modern product and manufacturing industries.",
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
    description: "Build business, finance, marketing, people management, and strategic decision-making skills.",
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
  { key: "active_programs", label: "Programs", value: 102, suffix: "+", verified: true },
  { key: "students_enrolled", label: "Learners", value: 25, suffix: "K+", verified: true },
  { key: "mentors", label: "Mentors", value: 750, suffix: "+", verified: true },
  { key: "hiring_partners", label: "Hiring Partners", value: 450, suffix: "+", verified: true },
  { key: "brand_partners", label: "Brand Partners", value: 150, suffix: "+", verified: true },
  { key: "satisfaction", label: "Satisfaction", value: 95, suffix: "%+", verified: true },
  { key: "projects", label: "Projects Shipped", value: 1000, suffix: "+", verified: true },
  { key: "live_workshops", label: "Live Workshops", value: 500, suffix: "+", verified: true },
];



// Professional demo stories rendered when no live approved stories exist yet.
// Replace via CMS once real learner stories are collected.
const dicebear = (seed: string, bg: string) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundType=gradientLinear&backgroundColor=${bg}&fontFamily=Inter&fontWeight=600&radius=50`;

const STORIES: SuccessStory[] = [
  {
    id: "s-aarav",
    name: "Aarav Sharma",
    role: "Data Scientist",
    type: "student",
    previous: "B.Tech graduate",
    current: "Data Scientist @ Microsoft",
    quote:
      "The mentors pushed me to build real projects from day one. By the time I interviewed, my portfolio was doing the talking.",
    verified: true,
    published: true,
    avatar: dicebear("Aarav Sharma", "0284c7,0ea5e9"),
    company: "Microsoft",
    companySlug: "microsoft",
    companyDomain: "microsoft.com",
    course: "AI & Data Science",
    rating: 5,
    packageLabel: "₹18 LPA",
  },
  {
    id: "s-priya",
    name: "Priya Reddy",
    role: "Product Designer",
    type: "student",
    previous: "Non-design background",
    current: "Product Designer @ Swiggy",
    quote:
      "Weekly design critiques and 1:1 mentor sessions changed how I think about products. I landed my first design role in 4 months.",
    verified: true,
    published: true,
    avatar: dicebear("Priya Reddy", "db2777,f472b6"),
    company: "Swiggy",
    companySlug: "swiggy",
    companyDomain: "swiggy.com",
    course: "Product Design Bootcamp",
    rating: 5,
    packageLabel: "₹14 LPA",
  },
  {
    id: "s-rahul",
    name: "Rahul Kumar",
    role: "Full Stack Engineer",
    type: "career_transition",
    previous: "Support engineer",
    current: "Full Stack @ Razorpay",
    quote:
      "Career coaching helped me package 3 years of hidden experience into a story that recruiters actually wanted to hear.",
    verified: true,
    published: true,
    avatar: dicebear("Rahul Kumar", "1d4ed8,3b82f6"),
    company: "Razorpay",
    companySlug: "razorpay",
    companyDomain: "razorpay.com",
    course: "Full Stack Web Development",
    rating: 5,
    packageLabel: "₹22 LPA",
  },
  {
    id: "s-sneha",
    name: "Sneha Patel",
    role: "ML Engineer",
    type: "student",
    previous: "Final-year student",
    current: "ML Engineer @ Flipkart",
    quote:
      "The capstone project got me my first offer. I shipped a recommendation system that mirrored real production constraints.",
    verified: true,
    published: true,
    avatar: dicebear("Sneha Patel", "7c3aed,a78bfa"),
    company: "Flipkart",
    companySlug: "flipkart",
    companyDomain: "flipkart.com",
    course: "Machine Learning Advanced",
    rating: 5,
    packageLabel: "₹16 LPA",
  },
  {
    id: "s-akash",
    name: "Akash Verma",
    role: "Cloud DevOps Engineer",
    type: "career_transition",
    previous: "System administrator",
    current: "DevOps @ Amazon",
    quote:
      "Live labs on AWS, GCP and Kubernetes gave me the muscle memory to walk into a DevOps role without hesitation.",
    verified: true,
    published: true,
    avatar: dicebear("Akash Verma", "ea580c,fb923c"),
    company: "Amazon",
    companySlug: "amazon",
    companyDomain: "amazon.com",
    course: "Cloud & DevOps Mastery",
    rating: 5,
    packageLabel: "₹20 LPA",
  },
  {
    id: "s-neha",
    name: "Neha Gupta",
    role: "Digital Marketing Lead",
    type: "career_transition",
    previous: "Content writer",
    current: "Marketing Lead @ Zomato",
    quote:
      "I ran real campaigns during the program and shipped my first attribution dashboard. That's what got me hired.",
    verified: true,
    published: true,
    avatar: dicebear("Neha Gupta", "059669,10b981"),
    company: "Zomato",
    companySlug: "zomato",
    companyDomain: "zomato.com",
    course: "Digital Marketing Pro",
    rating: 5,
    packageLabel: "₹12 LPA",
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

export const FALLBACK_CATEGORIES: CourseCategory[] = CATEGORIES.filter(
  (c) => c.published && c.featured,
);

export async function fetchFeaturedCategories(): Promise<CourseCategory[]> {
  return delay(FALLBACK_CATEGORIES);
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
