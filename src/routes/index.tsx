import { createFileRoute } from "@tanstack/react-router";
import {
  Award,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Briefcase,
  Coins,
  GraduationCap,
  Handshake,
  Landmark,
  LineChart,
  Megaphone,
  MessagesSquare,
  Palette,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container, Section, SectionHeader } from "@/components/shared/section";
import { StatCard } from "@/components/shared/stat-card";
import { FeatureCard } from "@/components/shared/feature-card";
import { CourseCard } from "@/components/shared/course-card";
import { CategoryCard } from "@/components/shared/category-card";
import { PricingCard } from "@/components/shared/pricing-card";
import { TestimonialCard } from "@/components/shared/testimonial-card";
import { PartnerCard } from "@/components/shared/partner-card";
import { BlogCard } from "@/components/shared/blog-card";
import { SuccessStoryCard } from "@/components/shared/success-story-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { EmptyState, LoadingSkeleton, Spinner } from "@/components/shared/empty-state";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { DashboardShell } from "@/components/shared/dashboard-shell";
import { DataTable, StatusPill, type DataTableStatus } from "@/components/shared/data-table-demo";
import { RevenueAreaChart, EnrollmentBarChart, TrafficLineChart } from "@/components/shared/charts";
import {
  Field,
  OTPInput,
  PasswordInput,
  PasswordStrength,
  PhoneInput,
  SearchInput,
  ToggleSwitch,
} from "@/components/shared/form-kit";
import { Timeline, HowItWorks } from "@/components/shared/timeline";
import { FaqAccordion } from "@/components/shared/faq";
import { CtaBanner } from "@/components/shared/cta";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Glintr Design System v2 — Full Component Library" },
      {
        name: "description",
        content:
          "Complete design system for Glintr: tokens, typography, buttons, cards, forms, dashboards, charts, and section templates.",
      },
    ],
  }),
  component: DesignSystemPreview,
});

const categories = [
  { icon: BookOpen, name: "Sales Mastery", count: 128, accent: "brand" as const },
  { icon: Rocket, name: "Entrepreneurship", count: 84, accent: "lime" as const },
  { icon: BarChart3, name: "Marketing", count: 96, accent: "violet" as const },
  { icon: Landmark, name: "Finance", count: 62, accent: "cyan" as const },
  { icon: Palette, name: "Design", count: 41, accent: "brand" as const },
  { icon: Settings2, name: "Engineering", count: 73, accent: "violet" as const },
];

const revenueData = [
  { name: "Jan", value: 42 }, { name: "Feb", value: 55 }, { name: "Mar", value: 71 },
  { name: "Apr", value: 68 }, { name: "May", value: 92 }, { name: "Jun", value: 108 },
  { name: "Jul", value: 124 }, { name: "Aug", value: 138 },
];
const enrollData = [
  { name: "Mon", value: 220 }, { name: "Tue", value: 340 }, { name: "Wed", value: 280 },
  { name: "Thu", value: 410 }, { name: "Fri", value: 520 }, { name: "Sat", value: 380 },
  { name: "Sun", value: 300 },
];

type PartnerRow = { name: string; tier: string; earnings: string; students: number; status: DataTableStatus };
const partnerRows: PartnerRow[] = [
  { name: "Aditi Kumar", tier: "Diamond", earnings: "₹18,42,000", students: 1240, status: "active" },
  { name: "Rohan Mehta", tier: "Platinum", earnings: "₹12,80,500", students: 892, status: "active" },
  { name: "Sara Iyer", tier: "Gold", earnings: "₹6,25,000", students: 512, status: "pending" },
  { name: "Vikram Shah", tier: "Silver", earnings: "₹2,10,000", students: 218, status: "paused" },
  { name: "Neha Rao", tier: "Bronze", earnings: "₹48,000", students: 62, status: "failed" },
];

function DesignSystemPreview() {
  const [pwd, setPwd] = (globalThis as unknown as { React?: unknown }).React
    ? // Bypass — we use React's useState via imported hook below.
      [undefined, () => {}]
    : ["", () => {}];
  return (
    <>
      <SiteHeader />
      <main className="relative">
        {/* HERO */}
        <Section tone="mesh" padding="xl" className="overflow-hidden">
          <Container className="relative">
            <div className="flex flex-col items-center gap-6 text-center max-w-3xl mx-auto">
              <Badge variant="primary" dot pulse>
                Design System v2.0
              </Badge>
              <h1 className="text-hero text-gradient-hero text-balance">
                The Glintr operating system for premium EdTech.
              </h1>
              <p className="text-subheading max-w-xl">
                A single, cohesive design language across marketing, dashboards, LMS, CRM, and
                white-label brands — built on tokens, not hardcoded values.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                <Button size="xl" variant="gradient">
                  <Sparkles /> Launch your brand
                </Button>
                <Button size="xl" variant="outline">
                  Browse components
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12 w-full max-w-2xl">
                {[
                  { label: "Courses", n: 4200, suffix: "+" },
                  { label: "Partners", n: 12800, suffix: "+" },
                  { label: "Learners", n: 380000, suffix: "+" },
                  { label: "GMV", n: 42, prefix: "₹", suffix: "Cr" },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col items-center gap-1">
                    <span className="font-display text-3xl font-bold text-gradient-brand">
                      <AnimatedCounter value={s.n} prefix={s.prefix} suffix={s.suffix} />
                    </span>
                    <span className="text-label">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </Section>

        {/* COLOR PALETTE */}
        <Section padding="lg" tone="surface">
          <Container>
            <SectionHeader
              eyebrow="Foundations"
              title="Color palette & gradients"
              description="Semantic OKLCH tokens with automatic light and dark mode adaptation."
            />
            <div className="mt-12 grid gap-4 md:grid-cols-6">
              {[
                { name: "Primary", cls: "bg-primary text-primary-foreground" },
                { name: "Secondary", cls: "bg-secondary text-secondary-foreground" },
                { name: "Accent", cls: "bg-accent text-accent-foreground border border-border" },
                { name: "Success", cls: "bg-success text-success-foreground" },
                { name: "Warning", cls: "bg-warning text-warning-foreground" },
                { name: "Danger", cls: "bg-danger text-danger-foreground" },
                { name: "Info", cls: "bg-info text-info-foreground" },
                { name: "Brand Cyan", cls: "bg-brand-cyan text-primary-foreground" },
                { name: "Brand Azure", cls: "bg-brand-azure text-primary-foreground" },
                { name: "Brand Royal", cls: "bg-brand-royal text-primary-foreground" },
                { name: "Brand Lime", cls: "bg-brand-lime text-primary-foreground" },
                { name: "Brand Violet", cls: "bg-brand-violet text-primary-foreground" },
              ].map((c) => (
                <div key={c.name} className={`rounded-xl p-5 h-24 flex flex-col justify-between ${c.cls}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="h-24 rounded-xl bg-gradient-brand animate-gradient grid place-items-center text-primary-foreground font-semibold">
                Brand gradient
              </div>
              <div className="h-24 rounded-xl bg-gradient-lime grid place-items-center text-primary-foreground font-semibold">
                Lime gradient
              </div>
              <div className="h-24 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground font-semibold">
                Violet gradient
              </div>
            </div>
          </Container>
        </Section>

        {/* TYPOGRAPHY */}
        <Section padding="lg">
          <Container size="lg">
            <SectionHeader
              eyebrow="Typography"
              title="Display + text scale"
              description="Space Grotesk for display, Inter for body, JetBrains Mono for data."
            />
            <div className="mt-10 flex flex-col gap-6">
              <TypeRow label="text-hero" sample="Launch. Sell. Grow." />
              <TypeRow label="text-display" sample="Turn sales pros into founders" />
              <TypeRow label="text-section" sample="Everything you need to scale" />
              <TypeRow label="text-page-title" sample="Partner performance overview" />
              <TypeRow label="text-dashboard-title" sample="Revenue this quarter" />
              <TypeRow label="text-subheading" sample="A supporting sentence that adds context to the headline above it." />
              <TypeRow label="text-body" sample="Body copy sets the tone: readable, calm, and confidence-inspiring." />
              <TypeRow label="text-caption" sample="Caption text for helper copy and metadata." />
              <TypeRow label="text-label" sample="Section label" />
              <TypeRow label="text-mono" sample="₹ 42,80,500.00" />
            </div>
          </Container>
        </Section>

        {/* BUTTONS */}
        <Section padding="lg" tone="surface">
          <Container size="lg">
            <SectionHeader
              eyebrow="Interactions"
              title="Button system"
              description="One consistent CTA hierarchy across marketing and product surfaces."
            />
            <div className="mt-10 flex flex-col gap-6">
              <ComponentRow label="Variants">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link CTA</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="gradient">
                  <Sparkles /> Gradient CTA
                </Button>
                <Button variant="glow">Glow</Button>
              </ComponentRow>
              <ComponentRow label="Sizes">
                <Button size="xs">XS</Button>
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
                <Button size="xl" variant="gradient">
                  <Rocket /> Extra Large
                </Button>
                <Button size="icon" variant="outline" aria-label="Icon">
                  <Zap />
                </Button>
              </ComponentRow>
              <ComponentRow label="States">
                <Button loading>Saving</Button>
                <Button disabled>Disabled</Button>
                <Button variant="gradient" loading>
                  Processing
                </Button>
              </ComponentRow>
            </div>
          </Container>
        </Section>

        {/* BADGES */}
        <Section padding="lg">
          <Container size="lg">
            <SectionHeader
              eyebrow="Signals"
              title="Badges & status pills"
              description="Marketing tags, course flags, and dashboard row states."
            />
            <div className="mt-10 flex flex-wrap gap-3">
              <Badge variant="featured">Featured</Badge>
              <Badge variant="new">New</Badge>
              <Badge variant="popular">Popular</Badge>
              <Badge variant="bestseller">Bestseller</Badge>
              <Badge variant="trending">Trending</Badge>
              <Badge variant="certified">
                <BadgeCheck className="size-3" /> Certified
              </Badge>
              <Badge variant="premium">Premium</Badge>
              <Badge variant="upcoming">Upcoming</Badge>
              <Badge variant="live" dot pulse>
                Live
              </Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <StatusPill status="active" />
              <StatusPill status="pending" />
              <StatusPill status="paused" />
              <StatusPill status="failed" />
            </div>
          </Container>
        </Section>

        {/* STAT + FEATURE CARDS */}
        <Section padding="lg" tone="surface">
          <Container>
            <SectionHeader
              eyebrow="Dashboard blocks"
              title="Stat & feature cards"
              description="Reusable KPI tiles and marketing feature blocks."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-4">
              <StatCard label="Total Revenue" value="₹ 42.8Cr" hint="MTD across all brands" icon={Wallet} trend={{ value: "+18.2%", direction: "up" }} tone="brand" />
              <StatCard label="Active Partners" value="12,802" hint="+ 320 this week" icon={Handshake} trend={{ value: "+2.6%", direction: "up" }} tone="success" />
              <StatCard label="Payouts Due" value="₹ 1.24Cr" hint="Next batch: Friday" icon={Coins} trend={{ value: "-4.1%", direction: "down" }} tone="warning" />
              <StatCard label="Refund Rate" value="1.8%" hint="Target < 3%" icon={ShieldCheck} trend={{ value: "flat", direction: "flat" }} />
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <FeatureCard icon={Rocket} title="Launch in 24 hours" description="White-label your EdTech brand with a full-stack LMS, CRM, and payment layer." accent="brand" />
              <FeatureCard icon={Target} title="70% revenue share" description="Partners keep the majority when they bring their own leads and close deals." accent="lime" />
              <FeatureCard icon={ShieldCheck} title="Enterprise trust" description="SOC 2, GDPR-ready RBAC with 10 roles across every white-label tenant." accent="violet" />
            </div>
          </Container>
        </Section>

        {/* CATEGORIES + COURSE CARDS */}
        <Section padding="lg">
          <Container>
            <SectionHeader eyebrow="Catalog" title="Categories & course cards" description="Card variants used across the LMS storefront." />
            <div className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-6">
              {categories.map((c) => (
                <CategoryCard key={c.name} {...c} />
              ))}
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <CourseCard
                title="The Enterprise Sales Playbook: From SDR to Closer"
                category="Sales Mastery"
                instructor="Raghav Menon"
                price="₹ 4,999"
                originalPrice="₹ 9,999"
                rating={4.9}
                students={12480}
                duration="12h"
                lessons={64}
                badge={{ label: "Bestseller", variant: "bestseller" }}
              />
              <CourseCard
                title="Build a 7-Figure Coaching Brand on Autopilot"
                category="Entrepreneurship"
                instructor="Ishita Bhatt"
                price="₹ 7,499"
                rating={4.8}
                students={5230}
                duration="18h"
                lessons={82}
                badge={{ label: "New", variant: "default" }}
              />
              <CourseCard
                title="Performance Marketing for Founders"
                category="Marketing"
                instructor="Kabir Rana"
                price="₹ 3,499"
                originalPrice="₹ 5,999"
                rating={4.7}
                students={8104}
                duration="9h"
                lessons={48}
                badge={{ label: "Live cohort", variant: "live" }}
              />
            </div>
          </Container>
        </Section>

        {/* FORMS */}
        <Section padding="lg" tone="surface">
          <Container size="lg">
            <SectionHeader
              eyebrow="Inputs"
              title="Form components"
              description="Everything from auth to checkout, ready to compose."
            />
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <Field label="Work email" required hint="We'll send an OTP to verify.">
                <Input placeholder="you@company.com" />
              </Field>
              <Field label="Search">
                <SearchInput placeholder="Search courses, partners…" />
              </Field>
              <Field label="Phone" required>
                <PhoneInput />
              </Field>
              <Field label="Password" hint="Use 8+ characters with a symbol.">
                <FormPasswordDemo />
              </Field>
              <Field label="OTP verification" required>
                <OTPInput />
              </Field>
              <div className="flex flex-col gap-2">
                <ToggleSwitch label="Weekly performance digest" description="Every Monday at 9am IST" checked onChange={() => {}} />
                <ToggleSwitch label="Auto payout to partners" description="Runs every Friday" checked={false} onChange={() => {}} />
              </div>
            </div>
          </Container>
        </Section>

        {/* CHARTS */}
        <Section padding="lg">
          <Container>
            <SectionHeader eyebrow="Analytics" title="Chart primitives" description="Recharts wrappers themed to Glintr tokens." />
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              <div className="card-elevated p-5">
                <p className="text-label">Monthly revenue</p>
                <p className="text-dashboard-title text-mono mt-1">₹ 1.38Cr</p>
                <RevenueAreaChart data={revenueData} dataKey="value" />
              </div>
              <div className="card-elevated p-5">
                <p className="text-label">Enrollments this week</p>
                <p className="text-dashboard-title text-mono mt-1">2,450</p>
                <EnrollmentBarChart data={enrollData} dataKey="value" />
              </div>
              <div className="card-elevated p-5">
                <p className="text-label">Traffic sources</p>
                <p className="text-dashboard-title text-mono mt-1">184K sessions</p>
                <TrafficLineChart data={revenueData} dataKey="value" />
              </div>
            </div>
          </Container>
        </Section>

        {/* DASHBOARD SHELL */}
        <Section padding="lg" tone="surface">
          <Container>
            <SectionHeader eyebrow="Admin surface" title="Dashboard shell" description="Sidebar + top nav + content + data table + charts, ready to drop into every portal." />
            <div className="mt-10">
              <DashboardShell
                title="Super Admin overview"
                subtitle="Cross-tenant health for all Glintr brands"
                role="Super Admin"
                actions={
                  <>
                    <Button variant="outline" size="sm"><Megaphone /> Announce</Button>
                    <Button variant="gradient" size="sm"><Sparkles /> New partner</Button>
                  </>
                }
              >
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <StatCard label="MRR" value="₹ 84.2L" trend={{ value: "+9.4%", direction: "up" }} tone="brand" icon={LineChart} />
                  <StatCard label="Active tenants" value="28" trend={{ value: "+3", direction: "up" }} tone="success" icon={Briefcase} />
                  <StatCard label="Instructors" value="412" trend={{ value: "+12", direction: "up" }} icon={GraduationCap} />
                  <StatCard label="Support SLA" value="98.4%" trend={{ value: "-0.2%", direction: "down" }} tone="warning" icon={MessagesSquare} />
                </div>
                <div className="grid gap-4 lg:grid-cols-3 mb-6">
                  <div className="card-elevated p-5 lg:col-span-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-label">Revenue trend</p>
                        <p className="text-dashboard-title text-mono">₹ 1.38Cr</p>
                      </div>
                      <Badge variant="success" dot>Live</Badge>
                    </div>
                    <RevenueAreaChart data={revenueData} dataKey="value" height={220} />
                  </div>
                  <div className="card-elevated p-5">
                    <p className="text-label">Weekly enrollments</p>
                    <p className="text-dashboard-title text-mono">2,450</p>
                    <EnrollmentBarChart data={enrollData} dataKey="value" height={220} />
                  </div>
                </div>
                <DataTable<PartnerRow>
                  title="Top partners"
                  description="Sorted by lifetime earnings"
                  rows={partnerRows}
                  columns={[
                    { key: "name", label: "Partner", sortable: true, render: (r) => <span className="font-medium">{r.name}</span> },
                    { key: "tier", label: "Tier", render: (r) => <Badge variant="primary">{r.tier}</Badge> },
                    { key: "earnings", label: "Earnings", sortable: true, render: (r) => <span className="text-mono">{r.earnings}</span> },
                    { key: "students", label: "Students", sortable: true, render: (r) => <span className="text-mono">{r.students.toLocaleString()}</span> },
                    { key: "status", label: "Status", render: (r) => <StatusPill status={r.status} /> },
                  ]}
                />
              </DashboardShell>
            </div>
          </Container>
        </Section>

        {/* PARTNER + TESTIMONIALS + SUCCESS STORIES */}
        <Section padding="lg">
          <Container>
            <SectionHeader eyebrow="People" title="Partner, testimonial & success cards" />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <PartnerCard name="Aditi Kumar" tier="Diamond" earnings="₹18.4L" students={1240} city="Mumbai, IN" />
              <PartnerCard name="Rohan Mehta" tier="Platinum" earnings="₹12.8L" students={892} city="Bengaluru, IN" />
              <PartnerCard name="Sara Iyer" tier="Gold" earnings="₹6.2L" students={512} city="Dubai, UAE" />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <TestimonialCard
                quote="Glintr replaced three tools we were duct-taping together. Onboarding partners now takes minutes, not weeks."
                author="Meera Kapoor"
                role="COO"
                company="Elevate Academy"
                rating={5}
              />
              <TestimonialCard
                variant="glass"
                quote="We launched our full white-label brand in under 48 hours and hit ₹40L in the first month."
                author="Arjun Sethi"
                role="Founder"
                company="ScaleUp Sales"
                rating={5}
              />
              <TestimonialCard
                quote="The revenue-share engine is transparent. My partners trust the numbers — that changed everything."
                author="Kavya Nair"
                role="Growth Lead"
                company="RiseWith"
                rating={4}
              />
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <SuccessStoryCard
                name="Arjun Sethi"
                before="Sales Manager"
                after="Founder, ₹4Cr ARR"
                quote="I was burning out doing quota carry. Glintr gave me a productized brand and a partner network — I now run a real business."
                metric={{ label: "Year-1 revenue", value: "₹4.2Cr" }}
              />
              <SuccessStoryCard
                name="Neha Rao"
                before="Freelance coach"
                after="12k students / month"
                quote="The LMS, CRM, and payout engine already work together. I only focus on selling and shipping content."
                metric={{ label: "Monthly learners", value: "12,400" }}
              />
            </div>
          </Container>
        </Section>

        {/* PRICING */}
        <Section padding="lg" tone="surface">
          <Container>
            <SectionHeader eyebrow="Pricing" title="Three ways to earn with Glintr" description="Every tier ships with LMS, CRM, and payout automation." />
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <PricingCard
                name="Sales Partner"
                description="Bring your own leads. Own the customer."
                price="₹ 0"
                period="/onboard"
                features={[
                  "70% revenue share on all closed deals",
                  "Access to the full course catalog",
                  "Personal partner CRM & lead pipeline",
                  "Weekly payouts, transparent ledger",
                ]}
                cta={{ label: "Apply as partner" }}
              />
              <PricingCard
                name="Company Leads"
                description="Sell using Glintr's warm inbound pipeline."
                price="₹ 4,999"
                period="/mo"
                features={[
                  "50% revenue share + qualified leads",
                  "Dialer, call scripts, playbooks",
                  "Team performance dashboard",
                  "Priority coaching from top closers",
                ]}
                featured
                badge="Most popular"
                cta={{ label: "Start selling" }}
              />
              <PricingCard
                name="White-Label"
                description="Launch your own EdTech brand in 24 hours."
                price="₹ 49,999"
                period="/mo"
                features={[
                  "Custom domain, branding, and payment gateway",
                  "Multi-tenant LMS, CRM, and analytics",
                  "Dedicated success + engineering support",
                  "Uncapped instructors, courses, and partners",
                ]}
                cta={{ label: "Talk to sales" }}
              />
            </div>
          </Container>
        </Section>

        {/* HOW IT WORKS */}
        <Section padding="lg">
          <Container size="lg">
            <SectionHeader eyebrow="Workflow" title="How Glintr works" />
            <div className="mt-12">
              <HowItWorks
                steps={[
                  { icon: Rocket, title: "Launch your brand", description: "Provision your tenant, domain, and payment layer in minutes." },
                  { icon: Users, title: "Recruit partners", description: "Invite sales pros with role-based access and revenue snapshots." },
                  { icon: Coins, title: "Scale revenue", description: "Automated payouts, transparent ledgers, and CMS-driven campaigns." },
                ]}
              />
            </div>
            <div className="mt-16 grid gap-10 md:grid-cols-2">
              <div>
                <SectionHeader align="left" eyebrow="Timeline" title="Your first 30 days" />
                <div className="mt-6">
                  <Timeline
                    steps={[
                      { icon: Rocket, title: "Kickoff", description: "Provisioning, brand setup, and success plan.", meta: "Day 1" },
                      { icon: Palette, title: "Content & catalog", description: "Import courses, set pricing, configure CMS.", meta: "Day 3-7" },
                      { icon: Users, title: "Partner onboarding", description: "RBAC assignment, training, and first payouts.", meta: "Day 8-14" },
                      { icon: LineChart, title: "Scale", description: "Analytics, campaigns, and cohort automation.", meta: "Day 15-30" },
                    ]}
                  />
                </div>
              </div>
              <div>
                <SectionHeader align="left" eyebrow="Common questions" title="FAQ" />
                <div className="mt-6">
                  <FaqAccordion
                    items={[
                      { question: "How is revenue split with partners?", answer: "Every sale creates an append-only event with a frozen split snapshot — partners see exact math in real time." },
                      { question: "Can I run multiple white-label brands?", answer: "Yes. Every brand is an isolated tenant with its own domain, catalog, pricing, and RBAC." },
                      { question: "How fast can I go live?", answer: "Most brands are live within 24 hours. Complex integrations (custom gateways, ERP) take up to 7 days." },
                      { question: "Is there a lock-in?", answer: "No annual lock-in. Month-to-month with a 30-day exit assistance clause." },
                    ]}
                  />
                </div>
              </div>
            </div>
          </Container>
        </Section>

        {/* BLOG */}
        <Section padding="lg" tone="surface">
          <Container>
            <SectionHeader eyebrow="Insights" title="From the Glintr blog" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <BlogCard
                title="Why revenue-share beats commissions for modern EdTech"
                excerpt="Static commission plans break at scale. Here's how snapshot-based splits keep partners aligned as your catalog grows."
                category="Playbook"
                date="Jun 24"
                readTime="6 min read"
                author={{ name: "Priya Menon" }}
              />
              <BlogCard
                title="Launching a white-label brand in 24 hours: a teardown"
                excerpt="A step-by-step tour through provisioning, DNS, gateway setup, and go-to-market on Glintr."
                category="Case study"
                date="Jun 18"
                readTime="9 min read"
                author={{ name: "Kabir Rana" }}
              />
              <BlogCard
                title="The 10 roles every EdTech RBAC system needs"
                excerpt="Beyond Admin vs. User: the role taxonomy that powers Glintr's multi-tenant platform."
                category="Engineering"
                date="Jun 10"
                readTime="5 min read"
                author={{ name: "Ishita Bhatt" }}
              />
            </div>
          </Container>
        </Section>

        {/* EMPTY / LOADING / ERROR STATES */}
        <Section padding="lg">
          <Container size="lg">
            <SectionHeader eyebrow="Feedback" title="Empty, loading & error states" />
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <div className="card-elevated p-5 flex flex-col gap-3">
                <p className="text-label">Skeleton</p>
                <LoadingSkeleton rows={4} />
                <div className="flex items-center gap-2 pt-2">
                  <Spinner /> <span className="text-caption">Loading…</span>
                </div>
              </div>
              <EmptyState
                icon={Award}
                title="No certificates yet"
                description="Complete your first course to earn a verifiable, on-chain certificate."
                action={{ label: "Browse courses" }}
              />
              <EmptyState
                variant="error"
                title="We couldn't load partners"
                description="Retry, or open the ledger to review the last known payout state."
                action={{ label: "Retry" }}
              />
            </div>
          </Container>
        </Section>

        {/* CTA */}
        <CtaBanner
          eyebrow="Ready when you are"
          title="Launch your EdTech empire with Glintr."
          description="Every component you just saw powers real revenue for our partners. Start free — pay as you grow."
          primary={{ label: "Start free" }}
          secondary={{ label: "Book a demo" }}
        />

        <SiteFooter />
      </main>
    </>
  );
}

// -------- helpers ----------
import { useState } from "react";

function FormPasswordDemo() {
  const [v, setV] = useState("");
  return (
    <div className="flex flex-col gap-2">
      <PasswordInput value={v} onChange={(e) => setV(e.target.value)} placeholder="••••••••" />
      <PasswordStrength value={v} />
    </div>
  );
}

function TypeRow({ label, sample }: { label: string; sample: string }) {
  return (
    <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-baseline border-b border-border pb-6 last:border-0">
      <code className="text-mono text-xs text-muted-foreground">{label}</code>
      <p className={label}>{sample}</p>
    </div>
  );
}

function ComponentRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[160px_1fr] md:items-center">
      <p className="text-label">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
