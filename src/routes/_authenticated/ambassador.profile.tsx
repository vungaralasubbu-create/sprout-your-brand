import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useRef } from "react";
import {
  User, Camera, CheckCircle2, Circle, Trophy, Star, TrendingUp, Users, GraduationCap,
  Wallet, Sparkles, Loader2, Edit2, Save, X, MapPin, School, Calendar, Info,
  Linkedin, Instagram, Youtube, Globe, ShieldCheck, Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AmbassadorShell } from "@/components/ambassador/ambassador-shell";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  getAmbassadorProfile,
  updateAmbassadorProfile,
  updateProfilePhoto,
  suggestInstitution,
  requestCollegeChange,
  getAmbassadorPerformance,
  getAmbassadorLevels,
  getAmbassadorBadges,
  evaluateAmbassadorAchievements,
  getSignedPhotoUploadPath,
} from "@/lib/campus-ambassador/profile.functions";

export const Route = createFileRoute("/_authenticated/ambassador/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Glintr Campus Ambassador" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ProfilePage,
});

const inr = (n: number) =>
  "₹" + Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function ProfilePage() {
  const getProfile = useServerFn(getAmbassadorProfile);
  const { data, isLoading } = useQuery({
    queryKey: ["ambassador-profile"],
    queryFn: () => getProfile({ data: undefined as never }),
  });

  if (isLoading) {
    return (
      <AmbassadorShell>
        <div className="p-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-60 w-full rounded-2xl" />
        </div>
      </AmbassadorShell>
    );
  }

  if (!data || data.gate !== "ok") {
    return (
      <AmbassadorShell>
        <div className="p-8">
          <Card className="p-8 text-center">
            <User className="h-10 w-10 mx-auto text-slate-400 mb-3" />
            <h2 className="text-lg font-semibold mb-1">Ambassador profile not found</h2>
            <p className="text-sm text-slate-600">Complete your Campus Ambassador application first.</p>
          </Card>
        </div>
      </AmbassadorShell>
    );
  }

  const { profile, currentLevel, completion } = data;

  return (
    <AmbassadorShell>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <ProfileHeader profile={profile} currentLevel={currentLevel} completion={completion} />

        <Tabs defaultValue="identity" className="space-y-4">
          <TabsList className="bg-white border p-1 h-auto flex-wrap">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="college">College</TabsTrigger>
            <TabsTrigger value="socials">Socials</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="completion">Completion</TabsTrigger>
          </TabsList>

          <TabsContent value="identity"><IdentitySection profile={profile} /></TabsContent>
          <TabsContent value="college"><CollegeSection profile={profile} /></TabsContent>
          <TabsContent value="socials"><SocialsSection profile={profile} /></TabsContent>
          <TabsContent value="performance"><PerformanceSection /></TabsContent>
          <TabsContent value="levels"><LevelsSection /></TabsContent>
          <TabsContent value="badges"><BadgesSection /></TabsContent>
          <TabsContent value="completion"><CompletionSection completion={completion} /></TabsContent>
        </Tabs>
      </div>
    </AmbassadorShell>
  );
}

// ==== Header ====
function ProfileHeader({ profile, currentLevel, completion }: any) {
  const qc = useQueryClient();
  const getPath = useServerFn(getSignedPhotoUploadPath);
  const savePhoto = useServerFn(updateProfilePhoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const displayName =
    profile.display_name || profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Campus Ambassador";

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5 MB");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
      return toast.error("Only JPG, PNG or WebP allowed");
    setUploading(true);
    try {
      const res = await getPath({ data: { fileName: file.name } });
      if (res.gate !== "ok") throw new Error("path");
      const { error } = await supabase.storage
        .from("ambassador-profile-photos")
        .upload(res.path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      const save = await savePhoto({ data: { storagePath: res.path } });
      if (save.gate !== "ok") throw new Error("save");
      toast.success("Profile photo updated");
      qc.invalidateQueries({ queryKey: ["ambassador-profile"] });
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-white via-cyan-50/50 to-blue-50/50 border-blue-100">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="relative shrink-0">
          <div className="h-24 w-24 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-400 to-blue-500 grid place-items-center text-white text-3xl font-semibold">
            {profile.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white border shadow grid place-items-center hover:bg-slate-50"
            title="Change photo"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPickPhoto} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                {profile.ambassador_code} · {profile.college_name || "College pending"}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {(profile.status || "active").replace(/_/g, " ")}
                </Badge>
                {currentLevel && (
                  <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-transparent">
                    <Trophy className="h-3 w-3 mr-1" />
                    {currentLevel.name}
                  </Badge>
                )}
                <Badge variant="outline">Ambassador</Badge>
              </div>
            </div>

            <div className="min-w-[180px]">
              <div className="text-xs text-slate-500 mb-1 flex justify-between">
                <span>Profile completion</span>
                <span className="font-semibold text-slate-900">{completion.pct}%</span>
              </div>
              <Progress value={completion.pct} className="h-2" />
              <p className="text-[11px] text-slate-500 mt-1">
                {completion.done} of {completion.total} completed
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ==== Identity ====
function IdentitySection({ profile }: any) {
  const qc = useQueryClient();
  const save = useServerFn(updateAmbassadorProfile);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    first_name: profile.first_name || "",
    last_name: profile.last_name || "",
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    city: profile.city || profile.campus_city || "",
    state: profile.state || "",
  });
  const m = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: (r: any) => {
      if (r.gate === "ok") {
        toast.success("Saved");
        qc.invalidateQueries({ queryKey: ["ambassador-profile"] });
        setEditing(false);
      } else toast.error(r.message || "Failed");
    },
  });

  if (!editing) {
    return (
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold">Personal Information</h3>
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        </div>
        <dl className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <Field label="First Name" value={profile.first_name} />
          <Field label="Last Name" value={profile.last_name} />
          <Field label="Display Name" value={profile.display_name} />
          <Field label="Email" value={profile.email} readOnly />
          <Field label="Mobile" value={profile.mobile} readOnly />
          <Field label="Ambassador ID" value={profile.ambassador_code} readOnly />
          <div className="md:col-span-2">
            <Field label="Bio" value={profile.bio} />
          </div>
          <Field label="City" value={profile.city || profile.campus_city} />
          <Field label="State" value={profile.state} />
        </dl>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Edit Personal Information</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div><Label>First Name</Label><Input value={f.first_name} onChange={(e) => setF({ ...f, first_name: e.target.value })} /></div>
        <div><Label>Last Name</Label><Input value={f.last_name} onChange={(e) => setF({ ...f, last_name: e.target.value })} /></div>
        <div className="md:col-span-2"><Label>Display Name (optional)</Label><Input value={f.display_name} onChange={(e) => setF({ ...f, display_name: e.target.value })} placeholder="Shown on leaderboards" /></div>
        <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={3} maxLength={300} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} placeholder="Short introduction (max 300 chars)" /></div>
        <div><Label>City</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
        <div><Label>State</Label><Input value={f.state} onChange={(e) => setF({ ...f, state: e.target.value })} /></div>
      </div>
      <div className="flex gap-2 mt-5">
        <Button onClick={() => m.mutate(f)} disabled={m.isPending}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save changes
        </Button>
        <Button variant="ghost" onClick={() => setEditing(false)}><X className="h-4 w-4 mr-1" />Cancel</Button>
      </div>
    </Card>
  );
}

function Field({ label, value, readOnly }: { label: string; value?: any; readOnly?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-500 mb-1 flex items-center gap-1">
        {label} {readOnly && <span className="text-[9px] uppercase tracking-widest text-slate-400">Read-only</span>}
      </dt>
      <dd className="text-slate-900">{value || <span className="text-slate-400">—</span>}</dd>
    </div>
  );
}

// ==== College ====
function CollegeSection({ profile }: any) {
  const qc = useQueryClient();
  const save = useServerFn(updateAmbassadorProfile);
  const suggest = useServerFn(suggestInstitution);
  const changeReq = useServerFn(requestCollegeChange);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({
    degree_course: profile.degree_course || "",
    specialisation: profile.specialisation || "",
    current_year_of_study: profile.current_year_of_study || "",
    expected_graduation_year: profile.expected_graduation_year || null,
  });

  const m = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: (r: any) => {
      if (r.gate === "ok") {
        toast.success("Academic details updated");
        qc.invalidateQueries({ queryKey: ["ambassador-profile"] });
        setEditing(false);
      } else toast.error(r.message || "Failed");
    },
  });

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><School className="h-4 w-4" /> Institution</h3>
            <p className="text-xs text-slate-500 mt-0.5">Your registered college. Changes require admin approval.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setSuggestOpen(true)}>Suggest institution</Button>
            <Button size="sm" variant="outline" onClick={() => setChangeOpen(true)}>Request change</Button>
          </div>
        </div>
        <div className="rounded-xl border p-4 bg-slate-50">
          <div className="font-medium">{profile.college_name || "Not linked"}</div>
          <div className="text-sm text-slate-600 mt-0.5">
            {[profile.campus_city, profile.state].filter(Boolean).join(", ") || "Location pending"}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold flex items-center gap-2"><GraduationCap className="h-4 w-4" /> Academic Details</h3>
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              <Edit2 className="h-3.5 w-3.5 mr-1.5" />Edit
            </Button>
          )}
        </div>
        {!editing ? (
          <dl className="grid md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
            <Field label="Degree / Course" value={profile.degree_course} />
            <Field label="Specialisation" value={profile.specialisation} />
            <Field label="Year of Study" value={profile.current_year_of_study} />
            <Field label="Expected Graduation" value={profile.expected_graduation_year} />
          </dl>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              <div><Label>Degree / Course</Label><Input value={f.degree_course} onChange={(e) => setF({ ...f, degree_course: e.target.value })} /></div>
              <div><Label>Specialisation</Label><Input value={f.specialisation} onChange={(e) => setF({ ...f, specialisation: e.target.value })} /></div>
              <div>
                <Label>Year of Study</Label>
                <Select value={f.current_year_of_study} onValueChange={(v) => setF({ ...f, current_year_of_study: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {["1st Year","2nd Year","3rd Year","4th Year","5th Year","Postgraduate","Other"].map(y => (
                      <SelectItem key={y} value={y}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Expected Graduation Year</Label>
                <Input type="number" min={2020} max={2040} value={f.expected_graduation_year || ""}
                  onChange={(e) => setF({ ...f, expected_graduation_year: e.target.value ? Number(e.target.value) : null })} />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button onClick={() => m.mutate(f)} disabled={m.isPending}>
                {m.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          </>
        )}
      </Card>

      <SuggestInstitutionDialog open={suggestOpen} onOpenChange={setSuggestOpen} onSubmit={async (v) => {
        const r: any = await suggest({ data: v });
        if (r.gate === "ok") { toast.success("Suggestion submitted for review"); setSuggestOpen(false); }
        else toast.error(r.message || "Failed");
      }} />

      <CollegeChangeDialog open={changeOpen} onOpenChange={setChangeOpen} onSubmit={async (v) => {
        const r: any = await changeReq({ data: v });
        if (r.gate === "ok") { toast.success("College change request submitted"); setChangeOpen(false); }
        else toast.error(r.message || "Failed");
      }} />
    </div>
  );
}

function SuggestInstitutionDialog({ open, onOpenChange, onSubmit }: any) {
  const [v, setV] = useState({ name: "", city: "", state: "", website: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Suggest a new institution</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Institution Name *</Label><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={v.city} onChange={(e) => setV({ ...v, city: e.target.value })} /></div>
            <div><Label>State</Label><Input value={v.state} onChange={(e) => setV({ ...v, state: e.target.value })} /></div>
          </div>
          <div><Label>Official Website</Label><Input placeholder="https://" value={v.website} onChange={(e) => setV({ ...v, website: e.target.value })} /></div>
          <p className="text-xs text-slate-500">Admin will review and add to the institution directory.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(v)} disabled={v.name.length < 3}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CollegeChangeDialog({ open, onOpenChange, onSubmit }: any) {
  const [v, setV] = useState({ requestedCollege: "", requestedCity: "", requestedState: "", reason: "" });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Request college change</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>New College *</Label><Input value={v.requestedCollege} onChange={(e) => setV({ ...v, requestedCollege: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>City</Label><Input value={v.requestedCity} onChange={(e) => setV({ ...v, requestedCity: e.target.value })} /></div>
            <div><Label>State</Label><Input value={v.requestedState} onChange={(e) => setV({ ...v, requestedState: e.target.value })} /></div>
          </div>
          <div><Label>Reason</Label><Textarea rows={3} value={v.reason} onChange={(e) => setV({ ...v, reason: e.target.value })} /></div>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
            <Info className="h-4 w-4 shrink-0" />
            College changes require admin approval and may affect campus-based rewards.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit(v)} disabled={v.requestedCollege.length < 3}>Submit request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==== Socials ====
function SocialsSection({ profile }: any) {
  const qc = useQueryClient();
  const save = useServerFn(updateAmbassadorProfile);
  const [f, setF] = useState({
    linkedin_url: profile.linkedin_url || "",
    instagram_url: profile.instagram_url || "",
    youtube_url: profile.youtube_url || "",
    other_profile_url: profile.other_profile_url || "",
  });
  const m = useMutation({
    mutationFn: (d: any) => save({ data: d }),
    onSuccess: (r: any) => {
      if (r.gate === "ok") { toast.success("Socials updated"); qc.invalidateQueries({ queryKey: ["ambassador-profile"] }); }
      else toast.error(r.message || "Failed");
    },
  });
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Social Links</h3>
      <div className="space-y-3">
        <SocialInput icon={Linkedin} label="LinkedIn" placeholder="https://linkedin.com/in/…" value={f.linkedin_url} onChange={(v) => setF({ ...f, linkedin_url: v })} />
        <SocialInput icon={Instagram} label="Instagram" placeholder="@username or full URL" value={f.instagram_url} onChange={(v) => setF({ ...f, instagram_url: v })} />
        <SocialInput icon={Youtube} label="YouTube" placeholder="https://youtube.com/@…" value={f.youtube_url} onChange={(v) => setF({ ...f, youtube_url: v })} />
        <SocialInput icon={Globe} label="Other" placeholder="https://" value={f.other_profile_url} onChange={(v) => setF({ ...f, other_profile_url: v })} />
      </div>
      <div className="mt-5">
        <Button onClick={() => m.mutate(f)} disabled={m.isPending}>
          {m.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save socials
        </Button>
      </div>
    </Card>
  );
}

function SocialInput({ icon: Icon, label, placeholder, value, onChange }: any) {
  return (
    <div>
      <Label className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</Label>
      <Input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

// ==== Performance ====
function PerformanceSection() {
  const get = useServerFn(getAmbassadorPerformance);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "year" | "all">("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["amb-performance", period],
    queryFn: () => get({ data: { period } }),
  });

  if (isLoading || !data || data.gate !== "ok") return <Skeleton className="h-60 w-full" />;
  const m = data.metrics;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Performance Summary</h3>
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="year">This year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <MetricCard icon={Users} label="Referral Leads" value={m.referralLeads} tint="cyan" />
        <MetricCard icon={GraduationCap} label="Verified Enrollments" value={m.verifiedEnrollments} tint="emerald" />
        <MetricCard icon={TrendingUp} label="Conversion Rate" value={`${m.conversionRate}%`} tint="blue" />
        <MetricCard icon={Wallet} label="Commission Earned" value={inr(m.commissionEarned)} tint="violet" />
        <MetricCard icon={Star} label="Available Earnings" value={inr(m.availableEarnings)} tint="amber" />
        <MetricCard icon={Sparkles} label="Marketing Resources Used" value={m.marketingResourcesUsed} tint="pink" />
      </div>

      <Card className="p-2 pr-4">
        <p className="text-xs text-slate-500 mt-3 mb-2 ml-4">Trend</p>
        <div className="text-[11px] text-slate-500 ml-4 mb-3">
          Read-only. Numbers update automatically from your referrals, enrollments and payouts.
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tint }: any) {
  const tints: Record<string, string> = {
    cyan: "bg-cyan-100 text-cyan-700",
    emerald: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    violet: "bg-violet-100 text-violet-700",
    amber: "bg-amber-100 text-amber-700",
    pink: "bg-pink-100 text-pink-700",
  };
  return (
    <Card className="p-4">
      <div className={`h-8 w-8 rounded-lg grid place-items-center ${tints[tint]} mb-3`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </Card>
  );
}

// ==== Levels ====
function LevelsSection() {
  const get = useServerFn(getAmbassadorLevels);
  const evaluate = useServerFn(evaluateAmbassadorAchievements);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["amb-levels"],
    queryFn: () => get({ data: undefined as never }),
  });
  const mEval = useMutation({
    mutationFn: () => evaluate({ data: undefined as never }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["amb-levels"] });
      qc.invalidateQueries({ queryKey: ["amb-badges"] });
      qc.invalidateQueries({ queryKey: ["ambassador-profile"] });
      toast.success("Re-evaluated");
    },
  });

  if (isLoading || !data || data.gate !== "ok") return <Skeleton className="h-60 w-full" />;
  const { levels, currentLevelId, nextLevel, progress } = data;

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold flex items-center gap-2"><Trophy className="h-4 w-4" /> Level Progression</h3>
            <p className="text-xs text-slate-500 mt-1">Levels update automatically as you hit thresholds. You cannot self-assign.</p>
          </div>
          <Button size="sm" variant="outline" onClick={() => mEval.mutate()} disabled={mEval.isPending}>
            {mEval.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            Re-evaluate
          </Button>
        </div>

        <div className="grid gap-3">
          {levels.map((lv: any) => {
            const current = lv.id === currentLevelId;
            const unlocked = current || (levels.find((l: any) => l.id === currentLevelId)?.level_order || 0) > lv.level_order;
            return (
              <div key={lv.id} className={`rounded-xl border p-4 flex items-center gap-4 ${current ? "border-blue-300 bg-gradient-to-r from-cyan-50 to-blue-50" : unlocked ? "bg-emerald-50 border-emerald-200" : "bg-slate-50"}`}>
                <div className={`h-12 w-12 rounded-xl grid place-items-center text-white text-lg font-bold ${current ? "bg-gradient-to-br from-cyan-500 to-blue-500" : unlocked ? "bg-emerald-500" : "bg-slate-300"}`}>
                  {lv.level_order}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium">{lv.name}</div>
                    {current && <Badge className="bg-blue-600 text-white border-transparent">Current</Badge>}
                    {unlocked && !current && <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Unlocked</Badge>}
                  </div>
                  {lv.description && <div className="text-xs text-slate-600 mt-0.5">{lv.description}</div>}
                  <div className="text-[11px] text-slate-500 mt-1">
                    Requires: {lv.min_verified_enrollments || 0}+ verified enrollments
                    {lv.min_commission_earned > 0 && ` · ${inr(Number(lv.min_commission_earned))}+ earned`}
                    {lv.min_conversion_rate > 0 && ` · ${lv.min_conversion_rate}%+ conversion`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {nextLevel && (
          <div className="mt-5 rounded-xl border-2 border-dashed p-4 bg-slate-50">
            <div className="text-sm font-medium mb-2">Progress to {nextLevel.name}</div>
            <div className="space-y-2 text-xs text-slate-600">
              <ProgressRow label="Verified enrollments" value={progress.verifiedEnrollments} target={nextLevel.min_verified_enrollments} />
              {nextLevel.min_commission_earned > 0 && (
                <ProgressRow label="Commission earned" value={progress.commissionEarned} target={nextLevel.min_commission_earned} format={inr} />
              )}
              {nextLevel.min_conversion_rate > 0 && (
                <ProgressRow label="Conversion rate" value={progress.conversionRate} target={nextLevel.min_conversion_rate} format={(n) => `${n}%`} />
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProgressRow({ label, value, target, format }: any) {
  const pct = Math.min(100, target > 0 ? (value / target) * 100 : 0);
  const fmt = format || ((n: any) => n);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span>{label}</span>
        <span className="font-medium text-slate-900">{fmt(value)} / {fmt(target)}</span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

// ==== Badges ====
function BadgesSection() {
  const get = useServerFn(getAmbassadorBadges);
  const { data, isLoading } = useQuery({
    queryKey: ["amb-badges"],
    queryFn: () => get({ data: undefined as never }),
  });
  if (isLoading || !data || data.gate !== "ok") return <Skeleton className="h-60 w-full" />;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2"><Award className="h-4 w-4" /> Achievement Badges</h3>
          <p className="text-xs text-slate-500 mt-1">{data.earnedCount} of {data.totalCount} earned. Badges are auto-awarded — cannot be self-assigned.</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {data.badges.map((b: any) => {
          const pct = b.threshold_value > 0 ? Math.min(100, (b.progressValue / b.threshold_value) * 100) : (b.earned ? 100 : 0);
          return (
            <div key={b.id} className={`rounded-xl border p-4 ${b.earned ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200" : "bg-white"}`}>
              <div className="flex items-start gap-3">
                <div className={`h-10 w-10 rounded-xl grid place-items-center text-lg ${b.earned ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                  {b.icon || "🏅"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-medium text-sm">{b.name}</div>
                    {b.earned && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  {b.description && <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{b.description}</div>}
                </div>
              </div>
              {!b.earned && b.threshold_value > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>{b.progressValue}/{b.threshold_value}</span>
                    <span>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="h-1" />
                </div>
              )}
              {b.earned && b.earnedAt && (
                <div className="text-[10px] text-emerald-700 mt-3">
                  Earned {new Date(b.earnedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ==== Completion ====
function CompletionSection({ completion }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="font-semibold">Profile Completion</h3>
          <p className="text-xs text-slate-500 mt-1">A complete profile helps you unlock higher levels and campaign eligibility.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{completion.pct}%</div>
          <div className="text-xs text-slate-500">{completion.done} / {completion.total}</div>
        </div>
      </div>
      <Progress value={completion.pct} className="h-2 mb-5" />
      <div className="grid md:grid-cols-2 gap-2">
        {completion.items.map((i: any) => (
          <div key={i.key} className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${i.done ? "bg-emerald-50 border-emerald-100 text-emerald-900" : "bg-white text-slate-700"}`}>
            {i.done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-slate-300" />}
            <span>{i.label}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
