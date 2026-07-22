import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { generateMarketingPlan } from "@/lib/marketing-os/plans.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/marketing-os/planner")({
  component: Planner,
});

const GOALS = ["Lead Generation","Admissions","Website Traffic","Brand Awareness","Sales","Community Growth","SEO","Newsletter","Partnerships","Event Promotion","Recruitment"];
const AUDIENCE = ["Students","Freshers","Working Professionals","Managers","Founders","HR","Recruiters","Companies","Parents","Teachers","Universities"];
const COUNTRIES = ["India","USA","UK","Canada","Australia","Singapore","Germany","UAE","Saudi Arabia"];
const LANGUAGES = ["English","Hindi","Telugu","Tamil","Kannada","Malayalam","Marathi","Spanish","French","German","Arabic"];
const PLATFORMS = ["Instagram","Facebook","LinkedIn","X","Threads","Blog","Pinterest","YouTube","TikTok"];
const PERIODS = [
  { v: "1_week", l: "1 Week" },
  { v: "2_weeks", l: "2 Weeks" },
  { v: "1_month", l: "1 Month" },
  { v: "3_months", l: "3 Months" },
  { v: "6_months", l: "6 Months" },
  { v: "1_year", l: "1 Year" },
];
const CONTENT_TYPES = ["Carousel","Single Image","Infographic","Reel Script","Short Video Script","Blog","Thread","Poll","Quote","Case Study","Industry News","Success Story","Student Testimonial","Faculty Highlight","Course Promotion","Webinar","Workshop","Hiring","Festival","Holiday","FAQ","Tips","Career Advice"];
const MIX_KEYS = ["Educational","Promotional","Entertainment","Community","Behind The Scenes","Thought Leadership","Industry News","User Generated"];
const TONES = ["Professional","Friendly","Bold","Playful","Inspiring","Authoritative","Empathetic","Witty"];

function useToggleList(initial: string[] = []) {
  const [v, setV] = useState<string[]>(initial);
  const toggle = (x: string) => setV((s) => (s.includes(x) ? s.filter((i) => i !== x) : [...s, x]));
  return [v, setV, toggle] as const;
}

function csv(s: string): string[] {
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-full border text-xs transition-colors",
        active ? "border-primary bg-primary/10 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function Planner() {
  const nav = useNavigate();
  const gen = useServerFn(generateMarketingPlan);

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("EdTech");
  const [goals, , toggleGoal] = useToggleList(["Lead Generation", "Admissions"]);
  const [audience, , toggleAud] = useToggleList(["Students", "Working Professionals"]);
  const [countries, setCountries, toggleCountry] = useToggleList(["India"]);
  const [customCountry, setCustomCountry] = useState("");
  const [primaryLang, setPrimaryLang] = useState("English");
  const [secondaryLangs, , toggleLang] = useToggleList([]);
  const [tone, setTone] = useState("Professional");
  const [personality, setPersonality] = useState("");
  const [keywords, setKeywords] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [products, setProducts] = useState("");
  const [courses, setCourses] = useState("");
  const [services, setServices] = useState("");
  const [cta, setCta] = useState("Enroll Now");
  const [platforms, , togglePlatform] = useToggleList(["Instagram", "LinkedIn", "Blog"]);
  const [period, setPeriod] = useState("1_month");
  const [contentTypes, , toggleCT] = useToggleList(["Carousel", "Blog", "Reel Script"]);
  const [mix, setMix] = useState<Record<string, number>>(() =>
    Object.fromEntries(MIX_KEYS.map((k) => [k, k === "Educational" ? 40 : k === "Promotional" ? 20 : 10])),
  );
  const [campaigns, setCampaigns] = useState("");
  const [freq, setFreq] = useState<Record<string, Record<string, number>>>({
    Instagram: { posts_per_day: 1, stories_per_day: 2, reels_per_week: 3 },
    LinkedIn: { posts_per_week: 3 },
    Blog: { posts_per_week: 1 },
  });

  const m = useMutation({
    mutationFn: () =>
      gen({
        data: {
          business_name: businessName,
          industry,
          goals,
          target_audience: audience,
          countries: [...countries, ...csv(customCountry)],
          primary_language: primaryLang,
          secondary_languages: secondaryLangs,
          brand_tone: tone,
          brand_personality: personality,
          brand_keywords: csv(keywords),
          competitors: csv(competitors),
          products: csv(products),
          courses: csv(courses),
          services: csv(services),
          cta_preference: cta,
          platforms,
          planning_period: period as "1_month",
          content_types: contentTypes,
          content_mix: mix,
          posting_frequency: freq,
          campaigns: csv(campaigns),
        },
      }),
    onSuccess: (r) => {
      toast.success("Plan generated");
      nav({ to: "/admin/marketing-os/plans/$id", params: { id: r.plan.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Validation reads CURRENT state on every render (no stale refs, no debounce).
  const trimmedName = businessName.trim();
  const missing: string[] = [];
  if (trimmedName.length < 1) missing.push("business name");
  if (goals.length === 0) missing.push("at least one goal");
  if (platforms.length === 0) missing.push("at least one platform");
  const canGenerate = missing.length === 0;
  // Super-admin debug — visible in browser console only when validation is off.
  if (typeof window !== "undefined" && !canGenerate) {
    // eslint-disable-next-line no-console
    console.debug("[planner.validation]", {
      businessName: trimmedName,
      goals: goals.length,
      platforms: platforms.length,
      missing,
    });
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">AI Content Planner</h2>
        <p className="text-sm text-muted-foreground">
          Configure your brand, audience, and platforms. AI generates a complete multi-platform content strategy. Planning only — no images, videos, or publishing.
        </p>
      </div>

      <Card className="p-6 space-y-5">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Business Profile</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Business Name *</Label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Glintr" />
          </div>
          <div>
            <Label>Industry</Label>
            <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="EdTech" />
          </div>
        </div>

        <div>
          <Label>Business Goals *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {GOALS.map((g) => <Chip key={g} active={goals.includes(g)} onClick={() => toggleGoal(g)}>{g}</Chip>)}
          </div>
        </div>

        <div>
          <Label>Target Audience</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {AUDIENCE.map((a) => <Chip key={a} active={audience.includes(a)} onClick={() => toggleAud(a)}>{a}</Chip>)}
          </div>
        </div>

        <div>
          <Label>Target Countries</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {COUNTRIES.map((c) => <Chip key={c} active={countries.includes(c)} onClick={() => toggleCountry(c)}>{c}</Chip>)}
          </div>
          <Input
            className="mt-2"
            value={customCountry}
            onChange={(e) => setCustomCountry(e.target.value)}
            placeholder="Custom (comma-separated) — e.g. Nigeria, Kenya"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Primary Language</Label>
            <select
              className="mt-1 w-full h-10 rounded-md border border-input bg-transparent px-3 text-sm"
              value={primaryLang}
              onChange={(e) => setPrimaryLang(e.target.value)}
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <Label>Secondary Languages</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {LANGUAGES.filter((l) => l !== primaryLang).map((l) => (
                <Chip key={l} active={secondaryLangs.includes(l)} onClick={() => toggleLang(l)}>{l}</Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Brand</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Brand Tone</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {TONES.map((t) => <Chip key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Chip>)}
            </div>
          </div>
          <div>
            <Label>CTA Preference</Label>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Enroll Now" />
          </div>
        </div>
        <div>
          <Label>Brand Personality</Label>
          <Input value={personality} onChange={(e) => setPersonality(e.target.value)} placeholder="Bold, mentor-like, results-driven" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>Brand Keywords <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
            <Input value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="AI, sales, career, upskilling" />
          </div>
          <div>
            <Label>Competitors <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
            <Input value={competitors} onChange={(e) => setCompetitors(e.target.value)} placeholder="Coursera, upGrad" />
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label>Products</Label>
            <Textarea rows={2} value={products} onChange={(e) => setProducts(e.target.value)} placeholder="Comma-separated" />
          </div>
          <div>
            <Label>Courses</Label>
            <Textarea rows={2} value={courses} onChange={(e) => setCourses(e.target.value)} placeholder="Comma-separated" />
          </div>
          <div>
            <Label>Services</Label>
            <Textarea rows={2} value={services} onChange={(e) => setServices(e.target.value)} placeholder="Comma-separated" />
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Platforms & Period</h3>
        <div>
          <Label>Platforms *</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PLATFORMS.map((p) => <Chip key={p} active={platforms.includes(p)} onClick={() => togglePlatform(p)}>{p}</Chip>)}
          </div>
        </div>
        <div>
          <Label>Planning Period</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {PERIODS.map((p) => <Chip key={p.v} active={period === p.v} onClick={() => setPeriod(p.v)}>{p.l}</Chip>)}
          </div>
        </div>
        <div>
          <Label>Content Types</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {CONTENT_TYPES.map((c) => <Chip key={c} active={contentTypes.includes(c)} onClick={() => toggleCT(c)}>{c}</Chip>)}
          </div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Content Mix (%)</h3>
        <div className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {MIX_KEYS.map((k) => (
            <div key={k}>
              <div className="flex justify-between text-xs mb-1">
                <span>{k}</span>
                <span className="font-mono text-muted-foreground">{mix[k] ?? 0}%</span>
              </div>
              <input
                type="range" min={0} max={100} step={5}
                value={mix[k] ?? 0}
                onChange={(e) => setMix({ ...mix, [k]: Number(e.target.value) })}
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Posting Frequency</h3>
        <p className="text-xs text-muted-foreground">Editable JSON per platform. AI will follow this cadence.</p>
        <Textarea
          rows={8}
          className="font-mono text-xs"
          value={JSON.stringify(freq, null, 2)}
          onChange={(e) => {
            try { setFreq(JSON.parse(e.target.value)); } catch { /* keep typing */ }
          }}
        />
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Campaigns to plan (optional)</h3>
        <Input
          value={campaigns}
          onChange={(e) => setCampaigns(e.target.value)}
          placeholder="Admissions 2026, AI Week, Cyber Security Week, Placement Drive, Scholarship, Festival Campaign"
        />
      </Card>

      <div className="flex items-center justify-between gap-4 sticky bottom-0 bg-background/80 backdrop-blur border-t border-border/60 py-4">
        <div className="text-xs text-muted-foreground">
          {canGenerate ? "Ready to generate. This takes ~15-40 seconds." : `Add: ${missing.join(", ")}.`}
        </div>
        <Button size="lg" disabled={!canGenerate || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? <><Loader2 className="size-4 mr-2 animate-spin" /> Generating…</> : <><Sparkles className="size-4 mr-2" /> Generate Plan</>}
        </Button>
      </div>
    </div>
  );
}
