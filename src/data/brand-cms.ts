/**
 * Brand / White-label CMS data.
 *
 * Swap loader bodies for real Supabase queries later — component code
 * consumes them via TanStack Query and stays identical.
 */

import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Blocks,
  BookOpen,
  Brush,
  CalendarClock,
  Compass,
  CreditCard,
  Globe,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Palette,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Wand2,
} from "lucide-react";

// ---------- Types ----------

export type BrandServiceKey =
  | "website"
  | "lms"
  | "student_portal"
  | "crm"
  | "certificates"
  | "payment_workflow"
  | "social_setup"
  | "marketing_creatives"
  | "landing_pages"
  | "lead_forms"
  | "analytics"
  | "email_setup"
  | "whatsapp_setup";

export interface BrandService {
  key: BrandServiceKey;
  label: string;
  description: string;
  icon: LucideIcon;
  recommended: boolean;
}

export interface BrandFeatureGroup {
  key: string;
  title: string;
  icon: LucideIcon;
  items: string[];
  note?: string;
}

export interface BrandLaunchStep {
  order: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface WhoIsThisFor {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface BrandPackage {
  slug: string;
  name: string;
  tier: string;
  description: string;
  setupFee?: number;
  monthlyFee?: number;
  revenueSharePercent?: number;
  features: string[];
  active: boolean;
  publicListed: boolean;
}

export interface BrandFAQ {
  id: string;
  question: string;
  answer: string;
  published: boolean;
}

// ---------- Static content (CMS-ready) ----------

export const BRAND_AUDIENCES: WhoIsThisFor[] = [
  { id: "sales-pros", title: "Sales Professionals", description: "Experienced sellers ready to build a brand of their own.", icon: Handshake },
  { id: "edtech-execs", title: "EdTech Sales Executives", description: "Sales leaders who already understand career programs.", icon: BarChart3 },
  { id: "freelancers", title: "Freelancers", description: "Independent professionals seeking a productised business.", icon: Sparkles },
  { id: "trainers", title: "Trainers", description: "Subject-matter trainers wanting scale beyond one classroom.", icon: GraduationCap },
  { id: "course-creators", title: "Course Creators", description: "Educators ready to package expertise into programs.", icon: BookOpen },
  { id: "colleges", title: "College Communities", description: "Placement cells and college communities running programs.", icon: Users },
  { id: "institutes", title: "Small Training Institutes", description: "Coaching centres extending into online career programs.", icon: LayoutDashboard },
  { id: "entrepreneurs", title: "Education Entrepreneurs", description: "Founders launching a full-stack education brand.", icon: Rocket },
];

export const BRAND_FEATURE_GROUPS: BrandFeatureGroup[] = [
  {
    key: "brand-identity",
    title: "Brand Identity",
    icon: Palette,
    items: ["Brand Name Setup", "Logo Support", "Brand Colour System", "Basic Brand Guidelines"],
  },
  {
    key: "website",
    title: "Website",
    icon: Globe,
    items: ["Branded Website", "Custom Brand Content", "Program Pages", "Lead Forms", "Mobile Responsive Design", "SEO-Ready Structure"],
  },
  {
    key: "lms",
    title: "LMS",
    icon: BookOpen,
    items: ["Student Login", "Course Access", "Learning Progress", "Video Lessons", "Study Materials", "Assignments", "Assessments", "Certificates"],
  },
  {
    key: "students",
    title: "Student Management",
    icon: Users,
    items: ["Student Profiles", "Enrollments", "Course Access", "Progress Tracking", "Certificate Records", "Support Records"],
  },
  {
    key: "crm",
    title: "CRM",
    icon: Compass,
    items: ["Lead Management", "Lead Status", "Follow-Up Tracking", "Sales Notes", "Lead Assignment", "Conversion Tracking"],
  },
  {
    key: "catalogue",
    title: "Program Catalogue",
    icon: Blocks,
    items: ["Select Eligible Glintr Programs", "Choose Program Categories", "Publish Approved Programs", "Manage Program Visibility", "Configure Brand-Specific Display Pricing where permitted"],
  },
  {
    key: "marketing",
    title: "Marketing Support",
    icon: Share2,
    items: ["Social Media Templates", "Instagram Creatives", "LinkedIn Templates", "WhatsApp Templates", "Program Posters", "Lead Generation Landing Pages", "Campaign Assets"],
  },
  {
    key: "payments",
    title: "Payment Infrastructure Support",
    icon: CreditCard,
    items: ["Payment Collection Workflow", "Enrollment Tracking", "Invoice Records", "Payment Status", "Refund Records"],
    note: "Payment gateway activation depends on provider approval, KYC, business structure, and applicable policies. Glintr does not automatically provide a payment gateway account.",
  },
  {
    key: "social",
    title: "Social Media Setup Support",
    icon: MessageSquare,
    items: ["Instagram Brand Setup Guidance", "Facebook Page Setup Guidance", "LinkedIn Page Setup Guidance", "Brand Bio Content", "Launch Content Templates"],
    note: "Glintr provides guidance and templates. We do not claim ownership or guaranteed verification of social media accounts.",
  },
];

export const BRAND_LAUNCH_STEPS: BrandLaunchStep[] = [
  { order: 1, title: "Choose Your Brand Name", description: "Pick a name that represents your education business.", icon: Sparkles },
  { order: 2, title: "Submit Brand Details", description: "Tell us about your vision, audience, and goals.", icon: Wand2 },
  { order: 3, title: "Select Programs", description: "Choose from eligible Glintr career programs.", icon: BookOpen },
  { order: 4, title: "Configure Your Platform", description: "Website, LMS, CRM, and marketing modules.", icon: LayoutDashboard },
  { order: 5, title: "Launch Your Brand", description: "Go live with your students, leads, and revenue.", icon: Rocket },
];

export const BRAND_SERVICES: BrandService[] = [
  { key: "website", label: "Website", description: "Branded marketing website with program pages.", icon: Globe, recommended: true },
  { key: "lms", label: "LMS", description: "Learning management with videos, assignments, and certificates.", icon: BookOpen, recommended: true },
  { key: "student_portal", label: "Student Portal", description: "Login area for enrolled students.", icon: GraduationCap, recommended: true },
  { key: "crm", label: "CRM", description: "Lead pipeline, notes, and conversion tracking.", icon: Compass, recommended: true },
  { key: "certificates", label: "Certificate System", description: "Auto-generated program completion certificates.", icon: Award, recommended: true },
  { key: "payment_workflow", label: "Payment Workflow", description: "Enrollment, invoice, and refund records.", icon: CreditCard, recommended: true },
  { key: "social_setup", label: "Social Media Setup Support", description: "Guidance and templates for Instagram, LinkedIn, Facebook.", icon: Share2, recommended: false },
  { key: "marketing_creatives", label: "Marketing Creatives", description: "Posters, reels templates, program creatives.", icon: Palette, recommended: false },
  { key: "landing_pages", label: "Landing Pages", description: "High-conversion pages for campaigns.", icon: LayoutDashboard, recommended: false },
  { key: "lead_forms", label: "Lead Forms", description: "Capture leads from campaigns and organic traffic.", icon: Wallet, recommended: true },
  { key: "analytics", label: "Analytics", description: "Traffic, leads, enrollment, and revenue analytics.", icon: BarChart3, recommended: false },
  { key: "email_setup", label: "Email Setup Support", description: "Domain email guidance and templates.", icon: Mail, recommended: false },
  { key: "whatsapp_setup", label: "WhatsApp Integration Support", description: "WhatsApp business setup guidance.", icon: MessageSquare, recommended: false },
];

export const BRAND_TYPES = [
  { value: "career_skills", label: "Career Skills" },
  { value: "technology_training", label: "Technology Training" },
  { value: "engineering_programs", label: "Engineering Programs" },
  { value: "management_programs", label: "Management Programs" },
  { value: "college_training", label: "College Training" },
  { value: "corporate_training", label: "Corporate Training" },
  { value: "certification_programs", label: "Certification Programs" },
  { value: "multi_category", label: "Multi-Category EdTech" },
  { value: "other", label: "Other" },
];

export const BRAND_AUDIENCE_OPTIONS = [
  "College Students",
  "Fresh Graduates",
  "Working Professionals",
  "Sales Professionals",
  "Engineering Students",
  "Career Switchers",
  "Businesses",
  "Other",
];

export const BRAND_PERSONALITIES = [
  "Premium",
  "Modern",
  "Bold",
  "Professional",
  "Youthful",
  "Minimal",
  "Technology Focused",
  "Corporate",
];

export const BRAND_BUSINESS_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "proprietorship", label: "Proprietorship" },
  { value: "partnership", label: "Partnership" },
  { value: "llp", label: "LLP" },
  { value: "pvt_ltd", label: "Private Limited Company" },
  { value: "other", label: "Other" },
  { value: "not_registered", label: "Not Registered Yet" },
];

export const BRAND_LAUNCH_TIMELINE = [
  { value: "immediately", label: "Immediately" },
  { value: "within_7_days", label: "Within 7 Days" },
  { value: "within_30_days", label: "Within 30 Days" },
  { value: "exploring", label: "Just Exploring" },
];

// Approved white-label eligible programs (extends the core CMS Programs).
// In production this comes from the courses table filtered by `white_label_eligible = true`.
export interface WhiteLabelProgram {
  id: string;
  title: string;
  categorySlug: string;
  categoryName: string;
}

export const WHITE_LABEL_PROGRAMS: WhiteLabelProgram[] = [
  // Computer Science
  { id: "wl-ai", title: "Artificial Intelligence", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-ml", title: "Machine Learning", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-web", title: "Web Development", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-app", title: "App Development", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-ds", title: "Data Science", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-cloud", title: "Cloud Computing", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-da", title: "Data Analytics", categorySlug: "computer-science", categoryName: "Computer Science" },
  { id: "wl-cyber", title: "Cyber Security", categorySlug: "computer-science", categoryName: "Computer Science" },
  // Electronics
  { id: "wl-vlsi", title: "VLSI Design", categorySlug: "electronics-electrical", categoryName: "Electronics & Electrical" },
  { id: "wl-embedded", title: "Embedded Systems", categorySlug: "electronics-electrical", categoryName: "Electronics & Electrical" },
  { id: "wl-iot", title: "Internet of Things", categorySlug: "electronics-electrical", categoryName: "Electronics & Electrical" },
  { id: "wl-robotics", title: "Robotics", categorySlug: "electronics-electrical", categoryName: "Electronics & Electrical" },
  // Mechanical
  { id: "wl-autocad", title: "AutoCAD", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  { id: "wl-drone", title: "Drone Engineering", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  { id: "wl-cadcam", title: "CAD/CAM", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  { id: "wl-solidworks", title: "SolidWorks", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  { id: "wl-product", title: "Product Design", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  { id: "wl-mfg", title: "Manufacturing Engineering", categorySlug: "mechanical-engineering", categoryName: "Mechanical Engineering" },
  // Management
  { id: "wl-hr", title: "Human Resource Management", categorySlug: "management", categoryName: "Management" },
  { id: "wl-dm", title: "Digital Marketing", categorySlug: "management", categoryName: "Management" },
  { id: "wl-fin", title: "Finance", categorySlug: "management", categoryName: "Management" },
  { id: "wl-ib", title: "Investment Banking", categorySlug: "management", categoryName: "Management" },
  { id: "wl-stock", title: "Stock Market", categorySlug: "management", categoryName: "Management" },
  { id: "wl-sales", title: "Sales & Marketing", categorySlug: "management", categoryName: "Management" },
  { id: "wl-ba", title: "Business Analytics", categorySlug: "management", categoryName: "Management" },
  { id: "wl-ops", title: "Operations Management", categorySlug: "management", categoryName: "Management" },
];

// No approved public packages yet — public UI shows a consultation CTA instead.
export const BRAND_PACKAGES: BrandPackage[] = [];

export const BRAND_FAQS: BrandFAQ[] = [
  { id: "f-1", question: "Do I need to register a company first?", answer: "No. You can start the brand launch process as an individual. Legal entity registration, tax registration, banking, and payment gateway approval can be reviewed later based on your selected services and applicable policies.", published: true },
  { id: "f-2", question: "Can I choose my own brand name?", answer: "Yes. You choose your preferred brand name (plus two alternatives). Glintr checks internal platform conflicts only — trademark, domain, and legal registration are separate processes handled by you or third-party services.", published: true },
  { id: "f-3", question: "Can I select my own programs?", answer: "Yes. You select from Glintr's white-label eligible programs. Only active, approved programs from the CMS can be published under your brand.", published: true },
  { id: "f-4", question: "Do I get my own website?", answer: "Yes. Every approved brand receives a branded website with your name, colours, programs, and lead capture — running on shared Glintr infrastructure with your brand configuration.", published: true },
  { id: "f-5", question: "Do I get an LMS?", answer: "Yes. Your students log into an LMS branded to your business, with course access, progress tracking, assessments, and certificates.", published: true },
  { id: "f-6", question: "Can I use my own domain?", answer: "Yes. Custom domain support is available on eligible packages. DNS configuration is required from your side; connection status is managed from your Brand dashboard.", published: true },
  { id: "f-7", question: "Can I add my own courses later?", answer: "Custom course publishing on your brand may be available on higher tiers after your brand is stable. Talk to the Brand Launch team for the current policy.", published: true },
  { id: "f-8", question: "Who manages students?", answer: "You do. Students belong to your brand tenant. Glintr provides the technology; you own the student relationship.", published: true },
  { id: "f-9", question: "Can I hire my own sales team?", answer: "Yes. You can invite team members to your brand dashboard with role-based access.", published: true },
  { id: "f-10", question: "How long does brand setup take?", answer: "Standard eligible brand configurations may be prepared in under 24 hours once all required information, content, approvals, and configuration choices are completed. Timelines vary if additional customisation or approvals are required.", published: true },
  { id: "f-11", question: "Is legal company registration included?", answer: "No. Glintr's launch timeline refers to eligible digital brand and platform configuration. Legal entity registration is a separate legal process handled by you or your consultant.", published: true },
  { id: "f-12", question: "Is payment gateway approval guaranteed?", answer: "No. Gateway activation depends on the provider's approval, KYC, business structure, and applicable policies. Glintr provides guidance and workflow support only.", published: true },
  { id: "f-13", question: "Can I change my branding later?", answer: "Yes. Branding (colours, logo, tagline, content) can be updated later from your Brand Owner Dashboard.", published: true },
  { id: "f-14", question: "Can I sell programs under my brand?", answer: "Yes. That is the core purpose of the white-label module — sell eligible programs under your own brand identity.", published: true },
  { id: "f-15", question: "How does revenue sharing work?", answer: "Revenue share depends on your selected package and the specific program. Detailed splits are agreed at package selection and appear on every enrollment via the platform's split-snapshot system.", published: true },
];

async function delay<T>(v: T) { return v; }

export async function fetchBrandFAQs(): Promise<BrandFAQ[]> {
  return delay(BRAND_FAQS.filter((f) => f.published));
}

export async function fetchWhiteLabelPrograms(): Promise<WhiteLabelProgram[]> {
  return delay(WHITE_LABEL_PROGRAMS);
}

export async function fetchPublicBrandPackages(): Promise<BrandPackage[]> {
  return delay(BRAND_PACKAGES.filter((p) => p.active && p.publicListed));
}
