import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { getCareerOverview } from "@/lib/student/career.functions";
import {
  analyzeResumeAts,
  analyzeSkillGap,
  generateCareerRoadmap,
  generateCoverLetter,
  generateDailyCoach,
  generateLinkedInProfile,
  recommendJobs,
} from "@/lib/student/career-os.functions";
import {
  allScoreCards,
  bandFor,
  BAND_COLOR,
  BAND_LABEL,
  BAND_RING,
  careerScore,
  fallbackRoadmap,
  loadLocal,
  PLACEMENT_STAGE_LABEL,
  PLACEMENT_STAGES,
  RoadmapPlan,
  saveLocal,
  SavedJob,
} from "@/lib/student/career-os";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Sparkles,
  FileText,
  Linkedin,
  Briefcase,
  Target,
  Calendar,
  Award,
  ClipboardCheck,
  BadgeCheck,
  BookOpen,
  Bot,
  BarChart3,
  Rocket,
  Building2,
  MapPin,
  Bookmark,
  Users,
  ArrowRight,
  Zap,
  RefreshCw,
  Copy,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/student/career/os")({
  head: () => ({ meta: [{ title: "Career Operating System — Glintr" }] }),
  component: CareerOsPage,
});

type Tab =
  | "dashboard"
  | "roadmap"
  | "resume"
  | "linkedin"
  | "jobs"
  | "skill-gap"
  | "placement"
  | "calendar"
  | "vault"
  | "cover-letter";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "dashboard", label: "Scores & Coach", icon: BarChart3 },
  { key: "roadmap", label: "AI Roadmap", icon: Target },
  { key: "resume", label: "Resume Review", icon: FileText },
  { key: "linkedin", label: "LinkedIn Optimizer", icon: Linkedin },
  { key: "jobs", label: "Job Match", icon: Briefcase },
  { key: "skill-gap", label: "Skill Gap", icon: Zap },
  { key: "placement", label: "Placement Tracker", icon: ClipboardCheck },
  { key: "calendar", label: "Career Calendar", icon: Calendar },
  { key: "vault", label: "Certificate Vault", icon: Award },
  { key: "cover-letter", label: "Cover Letter", icon: BookOpen },
];

function CareerOsPage() {
  const fetchOverview = useServerFn(getCareerOverview);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["career-overview"],
    queryFn: () => fetchOverview(),
  });
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="p-4 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Career Operating System
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold tracking-tight mt-1 flex items-center gap-2">
            <Rocket className="size-6 text-primary" /> Career OS
          </h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
            Your AI career team — scores, roadmap, resume review, LinkedIn, jobs, and placement tracking, all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild size="sm">
            <Link to="/student/career">← Career Center</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="size-3.5 mr-1.5" /> Refresh
          </Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto -mx-4 lg:mx-0 px-4 lg:px-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-3 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap flex items-center gap-1.5",
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="size-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <>
          {tab === "dashboard" && <DashboardTab overview={data} />}
          {tab === "roadmap" && <RoadmapTab overview={data} />}
          {tab === "resume" && <ResumeTab overview={data} />}
          {tab === "linkedin" && <LinkedInTab overview={data} />}
          {tab === "jobs" && <JobsTab overview={data} />}
          {tab === "skill-gap" && <SkillGapTab overview={data} />}
          {tab === "placement" && <PlacementTab />}
          {tab === "calendar" && <CalendarTab overview={data} />}
          {tab === "vault" && <VaultTab overview={data} />}
          {tab === "cover-letter" && <CoverLetterTab overview={data} />}
        </>
      )}
    </div>
  );
}

// ============================================================
// Scores & Coach
// ============================================================
function DashboardTab({ overview }: { overview: any }) {
  const cards = useMemo(() => allScoreCards(overview), [overview]);
  const [coach, setCoach] = useState<any | null>(() => loadLocal("coach", null));
  const coachFn = useServerFn(generateDailyCoach);
  const coachMutation = useMutation({
    mutationFn: (input: any) => coachFn({ data: input }),
    onSuccess: (res) => {
      setCoach(res);
      saveLocal("coach", res);
    },
    onError: (e: any) => toast.error(e?.message ?? "AI coach unavailable"),
  });

  const weakest = [...cards].sort((a, b) => a.score - b.score)[1];
  const strongest = [...cards].sort((a, b) => b.score - a.score)[1];
  const firstName = (overview.profile?.full_name ?? "").split(" ")[0] || null;
  const targetRole = overview.preferences?.preferred_role ?? null;

  useEffect(() => {
    if (coach) return;
    coachMutation.mutate({
      firstName,
      targetRole,
      weakestArea: weakest?.label,
      strongestArea: strongest?.label,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* AI Daily Coach */}
      <Card className="p-5 lg:p-6 bg-gradient-to-br from-primary/8 via-background to-accent/8 border-primary/20">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-primary">
            <Bot className="size-3.5" /> AI Daily Coach
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              coachMutation.mutate({
                firstName,
                targetRole,
                weakestArea: weakest?.label,
                strongestArea: strongest?.label,
              })
            }
            disabled={coachMutation.isPending}
          >
            <RefreshCw className={cn("size-3.5 mr-1.5", coachMutation.isPending && "animate-spin")} />
            {coachMutation.isPending ? "Thinking…" : "New brief"}
          </Button>
        </div>
        <h2 className="font-display text-xl md:text-2xl font-semibold tracking-tight">
          {timeOfDay}{firstName ? `, ${firstName}` : ""}. {coach?.greeting ?? "Let's move your career forward today."}
        </h2>
        <div className="grid gap-3 md:grid-cols-2 mt-4">
          <CoachRow label="Today's priority" text={coach?.priority} />
          <CoachRow label="Suggested learning" text={coach?.suggestedLearning} />
          <CoachRow label="Recommended job" text={coach?.recommendedJob} />
          <CoachRow label="Interview prep" text={coach?.interviewPrep} />
          <CoachRow label="Resume tip" text={coach?.resumeTip} />
          <CoachRow label="Skill of the day" text={coach?.skillOfTheDay} />
        </div>
      </Card>

      {/* Score cards */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Career Scores
        </div>
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {cards.map((c) => (
            <ScoreDial key={c.key} card={c} highlight={c.key === "career"} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Quick Actions
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={FileText} title="Build Resume" href="/student/career/resume" />
          <QuickAction icon={Sparkles} title="Practice Interview" href="/student/career/interview/setup" />
          <QuickAction icon={Linkedin} title="Generate LinkedIn" onSelect="linkedin" />
          <QuickAction icon={Briefcase} title="Find Internship" href="/student/internship" />
          <QuickAction icon={Building2} title="Find a Job" onSelect="jobs" />
          <QuickAction icon={Users} title="Book a Mentor" href="/student/mentor" />
          <QuickAction icon={Zap} title="Skill Gap" onSelect="skill-gap" />
          <QuickAction icon={BookOpen} title="Cover Letter" onSelect="cover-letter" />
        </div>
      </div>

      <AnalyticsBar overview={overview} />
    </div>
  );
}

function CoachRow({ label, text }: { label: string; text: string | undefined }) {
  return (
    <div className="rounded-lg bg-white/70 backdrop-blur px-3 py-2.5 border border-border/60">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="text-sm mt-0.5 leading-snug">{text ?? <span className="text-muted-foreground italic">Generating…</span>}</div>
    </div>
  );
}

function ScoreDial({ card, highlight }: { card: any; highlight?: boolean }) {
  const band = bandFor(card.score);
  const circumference = 2 * Math.PI * 28;
  const dashoffset = circumference * (1 - card.score / 100);
  return (
    <Card
      className={cn(
        "p-4 flex items-center gap-3",
        highlight && "ring-1 ring-primary/40 bg-primary/[0.03]",
      )}
    >
      <svg width="70" height="70" viewBox="0 0 70 70" className="shrink-0">
        <circle cx="35" cy="35" r="28" strokeWidth="6" className="stroke-muted fill-none" />
        <circle
          cx="35"
          cy="35"
          r="28"
          strokeWidth="6"
          strokeLinecap="round"
          className={cn("fill-none transition-all", BAND_RING[band])}
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          transform="rotate(-90 35 35)"
        />
        <text
          x="35"
          y="40"
          textAnchor="middle"
          className="fill-foreground font-semibold text-[16px]"
        >
          {card.score}
        </text>
      </svg>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold truncate">{card.label}</div>
        <div className={cn("inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono uppercase tracking-widest mt-1", BAND_COLOR[band])}>
          {BAND_LABEL[band]}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{card.hint}</div>
      </div>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  title,
  href,
  onSelect,
}: {
  icon: any;
  title: string;
  href?: string;
  onSelect?: Tab;
}) {
  const body = (
    <Card className="p-4 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex items-center gap-3 group">
      <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="size-4" />
      </div>
      <div className="font-medium text-sm flex-1">{title}</div>
      <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Card>
  );
  if (href) return <Link to={href as any}>{body}</Link>;
  if (onSelect) {
    return (
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("career-os-tab", { detail: onSelect }))}
        className="text-left"
      >
        {body}
      </button>
    );
  }
  return body;
}

function AnalyticsBar({ overview }: { overview: any }) {
  const applications: SavedJob[] = loadLocal("jobs", []);
  const totalApps = applications.filter((a) => a.status !== "matched" && a.status !== "saved").length;
  const interviews = applications.filter((a) => ["interview", "offer", "accepted"].includes(a.status)).length;
  const offers = applications.filter((a) => ["offer", "accepted"].includes(a.status)).length;
  const overall = careerScore(overview);
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
        Analytics
      </div>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard label="Applications Sent" value={totalApps} />
        <StatCard label="Interview Rate" value={totalApps ? `${Math.round((interviews / totalApps) * 100)}%` : "—"} />
        <StatCard label="Offer Rate" value={totalApps ? `${Math.round((offers / totalApps) * 100)}%` : "—"} />
        <StatCard label="Placement Probability" value={`${overall}%`} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: any }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-semibold mt-1">{value}</div>
    </Card>
  );
}

// ============================================================
// Roadmap
// ============================================================
function RoadmapTab({ overview }: { overview: any }) {
  const [plan, setPlan] = useState<RoadmapPlan | null>(() => loadLocal("roadmap", null));
  const fn = useServerFn(generateCareerRoadmap);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res: any) => {
      setPlan(res);
      saveLocal("roadmap", res);
      toast.success("Roadmap generated");
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable — using fallback"),
  });

  const generate = () => {
    mutation.mutate({
      currentRole: overview.profile?.headline ?? null,
      targetRole: overview.preferences?.preferred_role ?? null,
      skills: overview.skills.map((s: any) => s.skill_name).slice(0, 40),
      courses: [],
      certificates: overview.certificates.map((c: any) => c.course_title).slice(0, 10),
      projects: overview.portfolioProjects.map((p: any) => p.title).slice(0, 10),
      yearsExperience: Number(overview.profile?.years_of_experience ?? 0),
    });
  };

  const display: RoadmapPlan = plan ?? fallbackRoadmap(overview);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Your AI Career Roadmap</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalised from your courses, skills, projects and career preferences.
          </p>
        </div>
        <Button onClick={generate} disabled={mutation.isPending}>
          <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
          {mutation.isPending ? "Generating…" : plan ? "Regenerate" : "Generate with AI"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <RoadmapCard label="Today" items={display.today} icon={Zap} />
        <RoadmapCard label="This Week" items={display.thisWeek} icon={Calendar} />
        <RoadmapCard label="This Month" items={display.thisMonth} icon={Target} />
        <RoadmapCard label="6-Month Plan" items={display.sixMonths} icon={Rocket} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Expected Salary
          </div>
          <div className="font-display text-2xl font-semibold">{display.expectedSalary}</div>
        </Card>
        <Card className="p-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Missing Skills
          </div>
          <div className="flex flex-wrap gap-1.5">
            {display.missingSkills.map((s, i) => (
              <Badge key={i} variant="outline" className="text-[11px]">{s}</Badge>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Recommended Certifications
          </div>
          <ul className="space-y-1.5 text-sm">
            {display.recommendedCertifications.map((c, i) => (
              <li key={i} className="flex items-start gap-2">
                <BadgeCheck className="size-4 text-primary shrink-0 mt-0.5" />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function RoadmapCard({ label, items, icon: Icon }: { label: string; items: string[]; icon: any }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ============================================================
// Resume Review
// ============================================================
function ResumeTab({ overview }: { overview: any }) {
  const [text, setText] = useState<string>(() => loadLocal("resumeText", ""));
  const [result, setResult] = useState<any | null>(() => loadLocal("resumeResult", null));
  const fn = useServerFn(analyzeResumeAts);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res) => {
      setResult(res);
      saveLocal("resumeResult", res);
      toast.success("Resume analysed");
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable"),
  });

  const analyze = () => {
    if (text.trim().length < 80) {
      toast.error("Paste at least 80 characters of your resume.");
      return;
    }
    saveLocal("resumeText", text);
    mutation.mutate({
      resumeText: text,
      targetRole: overview.preferences?.preferred_role ?? null,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5 space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Paste Your Resume
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            The AI reviewer checks ATS parsing, keywords, formatting, grammar, and structure.
          </p>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={16}
          placeholder="Paste the full text of your resume here…"
          className="font-mono text-[12px]"
        />
        <div className="flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">{text.length} chars</div>
          <Button onClick={analyze} disabled={mutation.isPending}>
            <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
            {mutation.isPending ? "Analysing…" : "Analyse with AI"}
          </Button>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <h2 className="font-display text-lg font-semibold">Analysis</h2>
        {!result ? (
          <div className="text-sm text-muted-foreground">
            Run the reviewer to get ATS, keyword, formatting, and grammar scores plus an improved summary.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <MiniScore label="ATS" value={result.atsScore} />
              <MiniScore label="Overall" value={result.overallScore} highlight />
              <MiniScore label="Keywords" value={result.keywordScore} />
              <MiniScore label="Grammar" value={result.grammarScore} />
              <MiniScore label="Formatting" value={result.formattingScore} />
            </div>
            <BulletBlock label="Strengths" items={result.strengths} tone="good" />
            <BulletBlock label="Weaknesses" items={result.weaknesses} tone="warn" />
            <BulletBlock label="Missing Keywords" items={result.missingKeywords} tone="warn" />
            <BulletBlock label="Suggestions" items={result.suggestions} tone="info" />
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
                Improved Summary
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                {result.improvedSummary}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-1"
                onClick={() => {
                  navigator.clipboard.writeText(result.improvedSummary);
                  toast.success("Copied");
                }}
              >
                <Copy className="size-3.5 mr-1.5" /> Copy
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function MiniScore({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const band = bandFor(value);
  return (
    <div className={cn("rounded-lg p-3 border", highlight ? "border-primary/40 bg-primary/5" : "border-border")}>
      <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-display text-xl font-semibold mt-0.5", BAND_COLOR[band].split(" ")[0])}>{value}</div>
    </div>
  );
}

function BulletBlock({ label, items, tone }: { label: string; items: string[]; tone: "good" | "warn" | "info" }) {
  if (!items?.length) return null;
  const toneClass =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
      ? "text-amber-600"
      : "text-primary";
  return (
    <div>
      <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">{label}</div>
      <ul className="space-y-1 text-sm">
        {items.map((i, idx) => (
          <li key={idx} className="flex items-start gap-2">
            <span className={cn("mt-1.5 size-1.5 rounded-full shrink-0", toneClass.replace("text-", "bg-"))} />
            <span>{i}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// LinkedIn Optimizer
// ============================================================
function LinkedInTab({ overview }: { overview: any }) {
  const [target, setTarget] = useState<string>(overview.preferences?.preferred_role ?? "");
  const [highlights, setHighlights] = useState<string>("");
  const [result, setResult] = useState<any | null>(() => loadLocal("linkedin", null));
  const fn = useServerFn(generateLinkedInProfile);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res) => {
      setResult(res);
      saveLocal("linkedin", res);
      toast.success("LinkedIn profile generated");
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable"),
  });

  const generate = () => {
    mutation.mutate({
      fullName: overview.profile?.full_name || "Glintr Learner",
      currentRole: overview.profile?.headline ?? null,
      targetRole: target || overview.preferences?.preferred_role || null,
      skills: overview.skills.map((s: any) => s.skill_name).slice(0, 20),
      achievements: highlights,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Linkedin className="size-4 text-primary" /> LinkedIn Optimizer
        </h2>
        <div className="space-y-1.5">
          <Label className="text-xs">Target Role</Label>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Data Analyst" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Highlights (optional)</Label>
          <Textarea
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            rows={5}
            placeholder="Achievements, awards, notable projects…"
          />
        </div>
        <Button className="w-full" onClick={generate} disabled={mutation.isPending}>
          <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
          {mutation.isPending ? "Generating…" : result ? "Regenerate" : "Generate Profile"}
        </Button>
      </Card>

      <Card className="p-5 space-y-4">
        {!result ? (
          <div className="text-sm text-muted-foreground">
            Generate a LinkedIn headline, About, experience bullets, skills, and banner ideas — tuned for search discoverability.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <MiniScore label="SEO Score" value={result.seoScore} highlight />
              <div className="rounded-lg p-3 border border-border">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Skills</div>
                <div className="font-display text-xl font-semibold mt-0.5">{result.skills?.length ?? 0}</div>
              </div>
            </div>

            <LinkedInBlock label="Headline" body={result.headline} />
            <LinkedInBlock label="About" body={result.about} />
            <LinkedInBlock label="Banner Prompt" body={result.bannerPrompt} />

            <BulletBlock label="Experience Bullets" items={result.experienceBullets} tone="info" />
            <BulletBlock label="Project Bullets" items={result.projectBullets} tone="info" />
            <BulletBlock label="Featured Ideas" items={result.featuredIdeas} tone="good" />
            <BulletBlock label="SEO Tips" items={result.seoTips} tone="warn" />

            {result.skills?.length ? (
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.skills.map((s: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-[11px]">{s}</Badge>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}

function LinkedInBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">{label}</div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-1.5"
          onClick={() => {
            navigator.clipboard.writeText(body);
            toast.success("Copied");
          }}
        >
          <Copy className="size-3" />
        </Button>
      </div>
      <div className="rounded-lg border border-border p-3 text-sm whitespace-pre-wrap leading-relaxed bg-surface-1/40">
        {body}
      </div>
    </div>
  );
}

// ============================================================
// Jobs
// ============================================================
function JobsTab({ overview }: { overview: any }) {
  const [jobs, setJobs] = useState<SavedJob[]>(() => loadLocal("jobs", []));
  const fn = useServerFn(recommendJobs);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res: any) => {
      const now = new Date().toISOString();
      const items: SavedJob[] = (res.jobs ?? []).map((j: any, idx: number) => ({
        id: `${now}-${idx}`,
        title: j.title,
        company: j.company,
        location: j.location,
        workType: j.workType,
        experience: j.experience,
        salary: j.salary,
        matchPercent: j.matchPercent,
        requiredSkills: j.requiredSkills ?? [],
        missingSkills: j.missingSkills ?? [],
        status: "matched",
        savedAt: now,
        notes: j.summary,
      }));
      // Merge — keep existing tracked jobs (not "matched") and replace matched set.
      const kept = jobs.filter((j) => j.status !== "matched");
      const merged = [...items, ...kept];
      setJobs(merged);
      saveLocal("jobs", merged);
      toast.success(`${items.length} jobs matched`);
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable"),
  });

  const runMatch = () => {
    mutation.mutate({
      targetRole: overview.preferences?.preferred_role ?? null,
      skills: overview.skills.map((s: any) => s.skill_name).slice(0, 20),
      workTypes: overview.preferences?.preferred_work_types ?? [],
      locations: overview.preferences?.preferred_locations ?? [],
      yearsExperience: Number(overview.profile?.years_of_experience ?? 0),
    });
  };

  const updateJob = (id: string, patch: Partial<SavedJob>) => {
    const next = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
    setJobs(next);
    saveLocal("jobs", next);
  };

  const removeJob = (id: string) => {
    const next = jobs.filter((j) => j.id !== id);
    setJobs(next);
    saveLocal("jobs", next);
  };

  const matched = jobs.filter((j) => j.status === "matched");
  const saved = jobs.filter((j) => j.status !== "matched");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">AI Job Match</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Personalised job recommendations based on your skills and preferences.
          </p>
        </div>
        <Button onClick={runMatch} disabled={mutation.isPending}>
          <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
          {mutation.isPending ? "Matching…" : "Find matching jobs"}
        </Button>
      </div>

      {matched.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Matched for you
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {matched.map((j) => (
              <JobCard key={j.id} job={j} onUpdate={updateJob} onRemove={removeJob} />
            ))}
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
            Tracking
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {saved.map((j) => (
              <JobCard key={j.id} job={j} onUpdate={updateJob} onRemove={removeJob} />
            ))}
          </div>
        </div>
      )}

      {!jobs.length && !mutation.isPending && (
        <Card className="p-8 text-center">
          <Briefcase className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <div className="font-display text-lg font-semibold">No matches yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Add your skills and preferences on the Career Center, then run a match here.
          </div>
        </Card>
      )}
    </div>
  );
}

function JobCard({
  job,
  onUpdate,
  onRemove,
}: {
  job: SavedJob;
  onUpdate: (id: string, patch: Partial<SavedJob>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-display font-semibold leading-tight">{job.title}</div>
          <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Building2 className="size-3.5" /> {job.company}
            <span className="mx-1">·</span>
            <MapPin className="size-3.5" /> {job.location}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-xl font-semibold text-primary">{job.matchPercent}%</div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Match</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest">{job.workType}</Badge>
        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest">{job.experience}</Badge>
        <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-widest">{job.salary}</Badge>
      </div>

      {job.notes && <div className="text-sm text-muted-foreground line-clamp-2">{job.notes}</div>}

      {job.requiredSkills?.length ? (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Required
          </div>
          <div className="flex flex-wrap gap-1">
            {job.requiredSkills.map((s, i) => (
              <span
                key={i}
                className={cn(
                  "text-[11px] px-1.5 py-0.5 rounded border",
                  job.missingSkills?.includes(s)
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200",
                )}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 pt-1">
        <select
          value={job.status}
          onChange={(e) => onUpdate(job.id, { status: e.target.value as SavedJob["status"] })}
          className="h-8 rounded-md border border-border bg-white px-2 text-[12px]"
        >
          {PLACEMENT_STAGES.map((s) => (
            <option key={s} value={s}>{PLACEMENT_STAGE_LABEL[s]}</option>
          ))}
        </select>
        <Button size="sm" variant="ghost" onClick={() => onRemove(job.id)} className="ml-auto">
          Remove
        </Button>
      </div>
    </Card>
  );
}

// ============================================================
// Skill Gap
// ============================================================
function SkillGapTab({ overview }: { overview: any }) {
  const [target, setTarget] = useState<string>(overview.preferences?.preferred_role ?? "");
  const [result, setResult] = useState<any | null>(() => loadLocal("skill-gap", null));
  const fn = useServerFn(analyzeSkillGap);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res) => {
      setResult(res);
      saveLocal("skill-gap", res);
      toast.success("Skill gap analysed");
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable"),
  });

  const analyze = () => {
    if (!target.trim()) {
      toast.error("Enter a target role");
      return;
    }
    mutation.mutate({
      targetRole: target,
      currentSkills: overview.skills.map((s: any) => s.skill_name),
    });
  };

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Zap className="size-4 text-primary" /> Skill Gap Analysis
        </h2>
        <div className="flex flex-col md:flex-row gap-2 mt-3">
          <Input
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Target role, e.g. Product Manager"
          />
          <Button onClick={analyze} disabled={mutation.isPending}>
            <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
            {mutation.isPending ? "Analysing…" : "Analyse"}
          </Button>
        </div>
      </Card>

      {result && (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Target" value={result.targetRole} />
            <StatCard label="Readiness" value={`${result.readinessPercent}%`} />
            <StatCard label="Matched skills" value={result.matchedSkills?.length ?? 0} />
          </div>

          <Card className="p-5">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Required Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {result.requiredSkills?.map((r: any, i: number) => (
                <span
                  key={i}
                  className={cn(
                    "text-[11px] px-2 py-1 rounded border font-mono uppercase tracking-widest",
                    r.importance === "must"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : r.importance === "core"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-muted text-foreground/70 border-border",
                  )}
                >
                  {r.skill} · {r.importance}
                </span>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Missing Skills & Learning Paths
            </div>
            <ul className="space-y-3">
              {result.missingSkills?.map((m: any, i: number) => (
                <li key={i} className="border-l-2 border-amber-300 pl-3">
                  <div className="font-medium text-sm">{m.skill}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.why}</div>
                  <div className="text-xs text-primary mt-0.5 flex items-center gap-1">
                    <ArrowRight className="size-3" /> {m.learningPath}
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          {result.recommendedProjects?.length ? (
            <Card className="p-5">
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-2">
                Recommended Projects
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {result.recommendedProjects.map((p: any, i: number) => (
                  <div key={i} className="rounded-lg border border-border p-3">
                    <div className="font-medium text-sm">{p.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{p.brief}</div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}

// ============================================================
// Placement Tracker
// ============================================================
function PlacementTab() {
  const [jobs, setJobs] = useState<SavedJob[]>(() => loadLocal("jobs", []));

  useEffect(() => {
    const handler = () => setJobs(loadLocal("jobs", []));
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const columns = PLACEMENT_STAGES.filter((s) => s !== "matched");

  const move = (id: string, status: SavedJob["status"]) => {
    const next = jobs.map((j) => (j.id === id ? { ...j, status } : j));
    setJobs(next);
    saveLocal("jobs", next);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Placement Tracker</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Move jobs across stages as you progress from application to offer.
        </p>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {columns.map((stage) => {
          const items = jobs.filter((j) => j.status === stage);
          return (
            <div key={stage} className="rounded-xl border border-border bg-surface-1/50 p-2 min-h-[180px]">
              <div className="flex items-center justify-between px-1 pb-2">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {PLACEMENT_STAGE_LABEL[stage]}
                </div>
                <span className="text-[10px] px-1.5 rounded-full bg-white text-muted-foreground border border-border">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2">
                {items.map((j) => (
                  <div key={j.id} className="rounded-lg bg-white border border-border p-2.5 shadow-sm">
                    <div className="font-medium text-[13px] leading-tight">{j.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{j.company}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <select
                        value={j.status}
                        onChange={(e) => move(j.id, e.target.value as SavedJob["status"])}
                        className="h-6 text-[10px] rounded border border-border bg-white px-1 flex-1"
                      >
                        {PLACEMENT_STAGES.map((s) => (
                          <option key={s} value={s}>{PLACEMENT_STAGE_LABEL[s]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {!items.length && (
                  <div className="text-[11px] text-muted-foreground/70 italic px-1 py-2">Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Calendar
// ============================================================
type CalItem = {
  id: string;
  title: string;
  date: string; // ISO
  type: "interview" | "assignment" | "event" | "fair" | "deadline" | "mentor";
};

function CalendarTab({ overview }: { overview: any }) {
  const [events, setEvents] = useState<CalItem[]>(() => loadLocal("calendar", []));
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<CalItem["type"]>("interview");

  const add = () => {
    if (!title || !date) return;
    const next = [{ id: crypto.randomUUID(), title, date, type }, ...events];
    setEvents(next);
    saveLocal("calendar", next);
    setTitle("");
    setDate("");
  };

  const remove = (id: string) => {
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    saveLocal("calendar", next);
  };

  // Auto-seed from placement tracker interviews if calendar empty
  useEffect(() => {
    if (events.length) return;
    const jobs: SavedJob[] = loadLocal("jobs", []);
    const seeded: CalItem[] = jobs
      .filter((j) => j.status === "interview")
      .slice(0, 3)
      .map((j) => ({
        id: crypto.randomUUID(),
        title: `Interview — ${j.title} @ ${j.company}`,
        date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        type: "interview" as const,
      }));
    if (seeded.length) {
      setEvents(seeded);
      saveLocal("calendar", seeded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <Card className="p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Calendar className="size-4 text-primary" /> Add to Calendar
        </h2>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as CalItem["type"])}
          className="w-full h-10 rounded-md border border-border bg-white px-3 text-sm"
        >
          <option value="interview">Mock Interview</option>
          <option value="assignment">Assignment</option>
          <option value="event">Career Event</option>
          <option value="fair">Job Fair</option>
          <option value="deadline">Application Deadline</option>
          <option value="mentor">Mentor Session</option>
        </select>
        <Button className="w-full" onClick={add}>Add Event</Button>
      </Card>

      <Card className="p-5">
        <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground mb-3">
          Upcoming
        </div>
        {!upcoming.length ? (
          <div className="text-sm text-muted-foreground">
            No events yet. Add your first career milestone.
          </div>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-l-2 border-primary/40 pl-3 py-1.5">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{e.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleDateString()} · {e.type}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove(e.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// Certificate Vault
// ============================================================
function VaultTab({ overview }: { overview: any }) {
  const certs = overview.certificates ?? [];
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Certificate Vault</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Course, internship, project, and skill certifications — verifiable and shareable.
        </p>
      </div>
      {!certs.length ? (
        <Card className="p-8 text-center">
          <Award className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <div className="font-display text-lg font-semibold">No certificates yet</div>
          <div className="text-sm text-muted-foreground mt-1">
            Complete your enrolled programs to unlock verifiable certificates.
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {certs.map((c: any) => (
            <Card key={c.id} className="p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Award className="size-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold truncate">{c.course_title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {c.certificate_type ?? "Certificate"} · {new Date(c.issued_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                #{c.certificate_number}
              </div>
              <div className="flex items-center gap-1.5 mt-auto">
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(c.certificate_number ?? "");
                    toast.success("Certificate number copied");
                  }}
                >
                  <Copy className="size-3 mr-1" /> Copy ID
                </Button>
                <Button size="sm" variant="outline" className="flex-1"
                  onClick={() => toast.success("Share link copied")}
                >
                  <Bookmark className="size-3 mr-1" /> Share
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Cover Letter
// ============================================================
function CoverLetterTab({ overview }: { overview: any }) {
  const [job, setJob] = useState("");
  const [company, setCompany] = useState("");
  const [highlights, setHighlights] = useState("");
  const [letter, setLetter] = useState<string>(() => loadLocal("coverLetter", ""));
  const fn = useServerFn(generateCoverLetter);
  const mutation = useMutation({
    mutationFn: (input: any) => fn({ data: input }),
    onSuccess: (res: any) => {
      setLetter(res.letter);
      saveLocal("coverLetter", res.letter);
      toast.success("Cover letter generated");
    },
    onError: (e: any) => toast.error(e?.message ?? "AI unavailable"),
  });

  const generate = () => {
    if (!job || !company) {
      toast.error("Enter both a role and a company");
      return;
    }
    mutation.mutate({
      fullName: overview.profile?.full_name || "Glintr Learner",
      jobTitle: job,
      company,
      skills: overview.skills.map((s: any) => s.skill_name).slice(0, 10),
      highlights,
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
      <Card className="p-5 space-y-3 h-fit">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-primary" /> Cover Letter Generator
        </h2>
        <Input value={job} onChange={(e) => setJob(e.target.value)} placeholder="Job title" />
        <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" />
        <Textarea
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          rows={5}
          placeholder="Personal highlights (optional)"
        />
        <Button className="w-full" onClick={generate} disabled={mutation.isPending}>
          <Sparkles className={cn("size-4 mr-1.5", mutation.isPending && "animate-pulse")} />
          {mutation.isPending ? "Writing…" : letter ? "Regenerate" : "Generate"}
        </Button>
      </Card>

      <Card className="p-5">
        {!letter ? (
          <div className="text-sm text-muted-foreground">
            Draft a tailored cover letter — copy/paste it directly into an application.
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Draft
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(letter);
                  toast.success("Copied");
                }}
              >
                <Copy className="size-3.5 mr-1" /> Copy
              </Button>
            </div>
            <div className="rounded-lg border border-border p-4 text-sm whitespace-pre-wrap leading-relaxed font-serif">
              {letter}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
