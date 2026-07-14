import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  GraduationCap,
  Sparkles,
  Award,
  Rocket,
  ClipboardList,
  MapPin,
  Building2,
  Target,
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  FileText,
  MessageSquare,
  BookOpen,
  ArrowRight,
  Eye,
  EyeOff,
  Compass,
  Link as LinkIcon,
} from "lucide-react";
import {
  getCareerOverview,
  saveCareerProfile,
  upsertEducation,
  deleteEducation,
  addSkill,
  toggleSkillVisibility,
  removeSkill,
  saveCareerPreferences,
  togglePortfolioProject,
  listEligiblePortfolioProjects,
} from "@/lib/student/career.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/student/career/")({
  head: () => ({ meta: [{ title: "Career Center — Glintr LMS" }] }),
  component: CareerCenterPage,
});

type Overview = Awaited<ReturnType<typeof getCareerOverview>>;

const WORK_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "full_time", label: "Full-Time" },
  { value: "internship", label: "Internship" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "open", label: "Open To Opportunities" },
];

function CareerCenterPage() {
  const fetchOverview = useServerFn(getCareerOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["career-overview"],
    queryFn: () => fetchOverview(),
  });

  if (isLoading) return <CareerSkeleton />;
  if (!data) return null;

  return <CareerContent data={data} />;
}

function CareerSkeleton() {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <div className="grid md:grid-cols-2 gap-4">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

function CareerContent({ data }: { data: Overview }) {
  const hasProfile = !!data.profile;
  const { metrics, readiness, tasks } = data;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <header>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-caption font-mono uppercase tracking-widest text-primary mb-1">
              Career Center
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-semibold tracking-tight">
              Prepare your next career move
            </h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
              Prepare your profile, practice interviews and organise your career journey in one place.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/student/career/resume">
                <FileText className="size-4 mr-1.5" /> Resume Builder
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/student/career/interview">
                <MessageSquare className="size-4 mr-1.5" /> Interview Practice
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard
          icon={<Target className="size-4" />}
          label="Profile Progress"
          value={`${metrics.profileProgressPercent}%`}
        />
        <MetricCard
          icon={<FileText className="size-4" />}
          label="Resume"
          value={metrics.resumeStatus === "not_started" ? "Not started" : "In progress"}
        />
        <MetricCard
          icon={<MessageSquare className="size-4" />}
          label="Interview Practice"
          value={metrics.interviewSessions}
        />
        <MetricCard
          icon={<Briefcase className="size-4" />}
          label="Portfolio Projects"
          value={metrics.portfolioProjectsCount}
        />
        <MetricCard
          icon={<ClipboardList className="size-4" />}
          label="Tasks Completed"
          value={`${metrics.careerTasksCompleted}/${metrics.careerTasksTotal}`}
        />
      </div>

      {/* Readiness */}
      <section className="rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <div className="text-sm font-semibold">Career Readiness</div>
            <div className="text-xs text-muted-foreground">
              Based on the sections you have completed. This is not a job-readiness score.
            </div>
          </div>
          <div className="text-2xl font-display font-semibold tracking-tight">
            {readiness.percent}%
          </div>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${readiness.percent}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(readiness.sections).map(([key, done]) => (
            <div
              key={key}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs",
                done ? "bg-primary/5 border-primary/30 text-foreground" : "text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "size-4 rounded-full flex items-center justify-center border",
                  done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30",
                )}
              >
                {done ? <Check className="size-3" /> : null}
              </div>
              <span className="capitalize">{key.replace(/_/g, " ")}</span>
            </div>
          ))}
        </div>
      </section>

      {!hasProfile ? (
        <EmptyProfileCta />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <ProfileSection profile={data.profile} />
            <EducationSection education={data.education} />
            <SkillsSection
              skills={data.skills}
              programSkillOptions={data.programSkillOptions}
            />
            <PortfolioSection portfolio={data.portfolioProjects} />
            <PreferencesSection preferences={data.preferences} />
          </div>
          <aside className="space-y-6">
            <TasksCard tasks={tasks} />
            <CertificatesCard certificates={data.certificates} />
            <InternshipCard internships={data.internships} />
            <GuidanceCard guidance={data.guidance} />
          </aside>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Metric card
// ============================================================
function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-1 text-lg font-display font-semibold tracking-tight">
        {value}
      </div>
    </div>
  );
}

// ============================================================
// Empty CTA
// ============================================================
function EmptyProfileCta() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border bg-white p-8 text-center">
      <div className="mx-auto size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Sparkles className="size-6" />
      </div>
      <h3 className="text-lg font-semibold">Start Your Career Profile</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
        Build your career profile using your learning, skills and project achievements.
      </p>
      <div className="mt-4">
        <Button onClick={() => setOpen(true)}>Create Career Profile</Button>
      </div>
      <ProfileDialog open={open} onOpenChange={setOpen} profile={null} />
    </div>
  );
}

// ============================================================
// Profile section
// ============================================================
function ProfileSection({ profile }: { profile: Overview["profile"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border bg-white p-5">
      <SectionHeader
        icon={<Sparkles className="size-4" />}
        title="Career Profile"
        action={
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="size-3.5 mr-1.5" />
            Edit
          </Button>
        }
      />
      <div className="mt-3 space-y-2 text-sm">
        {profile?.headline ? (
          <div className="text-base font-semibold">{profile.headline}</div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Add a professional headline (e.g. Aspiring Machine Learning Engineer).
          </div>
        )}
        {profile?.objective ? (
          <p className="text-sm text-muted-foreground">{profile.objective}</p>
        ) : null}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          <ProfileField
            icon={<MapPin className="size-3.5" />}
            label="Location"
            value={[profile?.city, profile?.state].filter(Boolean).join(", ") || "—"}
          />
          <ProfileField
            icon={<GraduationCap className="size-3.5" />}
            label="Education"
            value={profile?.education_level || "—"}
          />
          <ProfileField
            icon={<Building2 className="size-3.5" />}
            label="College"
            value={profile?.college || "—"}
          />
          <ProfileField
            icon={<BookOpen className="size-3.5" />}
            label="Degree"
            value={
              [profile?.degree, profile?.specialisation].filter(Boolean).join(" • ") || "—"
            }
          />
          <ProfileField
            icon={<Target className="size-3.5" />}
            label="Grad Year"
            value={profile?.graduation_year?.toString() || "—"}
          />
          <ProfileField
            icon={<Briefcase className="size-3.5" />}
            label="Experience"
            value={
              profile?.years_of_experience
                ? `${profile.years_of_experience} yrs`
                : profile?.current_student_status || "—"
            }
          />
        </div>
      </div>
      <ProfileDialog open={open} onOpenChange={setOpen} profile={profile} />
    </section>
  );
}

function ProfileField({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-sm font-medium truncate mt-0.5">{value}</div>
    </div>
  );
}

function ProfileDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: Overview["profile"];
}) {
  const qc = useQueryClient();
  const save = useServerFn(saveCareerProfile);
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    headline: profile?.headline ?? "",
    objective: profile?.objective ?? "",
    city: profile?.city ?? "",
    state: profile?.state ?? "",
    education_level: profile?.education_level ?? "",
    college: profile?.college ?? "",
    degree: profile?.degree ?? "",
    specialisation: profile?.specialisation ?? "",
    graduation_year: profile?.graduation_year?.toString() ?? "",
    current_student_status: profile?.current_student_status ?? "",
    years_of_experience: profile?.years_of_experience?.toString() ?? "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        full_name: profile?.full_name ?? "",
        headline: profile?.headline ?? "",
        objective: profile?.objective ?? "",
        city: profile?.city ?? "",
        state: profile?.state ?? "",
        education_level: profile?.education_level ?? "",
        college: profile?.college ?? "",
        degree: profile?.degree ?? "",
        specialisation: profile?.specialisation ?? "",
        graduation_year: profile?.graduation_year?.toString() ?? "",
        current_student_status: profile?.current_student_status ?? "",
        years_of_experience: profile?.years_of_experience?.toString() ?? "",
      });
    }
  }, [open, profile]);

  const mutation = useMutation({
    mutationFn: (payload: any) => save({ data: payload }),
    onSuccess: () => {
      toast.success("Career profile saved");
      qc.invalidateQueries({ queryKey: ["career-overview"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const submit = () => {
    mutation.mutate({
      ...form,
      graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
      full_name: form.full_name || null,
      headline: form.headline || null,
      objective: form.objective || null,
      city: form.city || null,
      state: form.state || null,
      education_level: form.education_level || null,
      college: form.college || null,
      degree: form.degree || null,
      specialisation: form.specialisation || null,
      current_student_status: form.current_student_status || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Career Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <FieldRow>
            <Field label="Full Name">
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </Field>
            <Field label="Professional Headline">
              <Input
                placeholder="e.g. Aspiring Machine Learning Engineer"
                value={form.headline}
                onChange={(e) => setForm({ ...form, headline: e.target.value })}
                maxLength={140}
              />
            </Field>
          </FieldRow>
          <Field label="Career Objective">
            <Textarea
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              maxLength={1000}
              rows={3}
              placeholder="Share the roles and impact you are working toward."
            />
          </Field>
          <FieldRow>
            <Field label="Current City">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Education Level">
              <Input
                placeholder="e.g. Undergraduate, Postgraduate"
                value={form.education_level}
                onChange={(e) => setForm({ ...form, education_level: e.target.value })}
              />
            </Field>
            <Field label="Current Student Status">
              <Input
                placeholder="e.g. Final year, Working professional"
                value={form.current_student_status}
                onChange={(e) => setForm({ ...form, current_student_status: e.target.value })}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="College / University">
              <Input
                value={form.college}
                onChange={(e) => setForm({ ...form, college: e.target.value })}
              />
            </Field>
            <Field label="Degree">
              <Input
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Specialisation">
              <Input
                value={form.specialisation}
                onChange={(e) => setForm({ ...form, specialisation: e.target.value })}
              />
            </Field>
            <Field label="Graduation Year">
              <Input
                type="number"
                min={1950}
                max={2100}
                value={form.graduation_year}
                onChange={(e) => setForm({ ...form, graduation_year: e.target.value })}
              />
            </Field>
          </FieldRow>
          <Field label="Years of Experience (optional)">
            <Input
              type="number"
              step="0.5"
              min={0}
              max={60}
              value={form.years_of_experience}
              onChange={(e) => setForm({ ...form, years_of_experience: e.target.value })}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={submit}>
            Save Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

// ============================================================
// Education
// ============================================================
function EducationSection({ education }: { education: Overview["education"] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();
  const del = useServerFn(deleteEducation);
  const removeMutation = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["career-overview"] });
      toast.success("Education removed");
    },
  });

  return (
    <section className="rounded-2xl border bg-white p-5">
      <SectionHeader
        icon={<GraduationCap className="size-4" />}
        title="Education"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="size-3.5 mr-1.5" /> Add
          </Button>
        }
      />
      {education.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground italic">
          Add your qualifications so employers understand your background.
        </div>
      ) : (
        <ul className="mt-3 divide-y">
          {education.map((e: any) => (
            <li key={e.id} className="py-3 flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-sm">{e.institution}</div>
                <div className="text-xs text-muted-foreground">
                  {[e.degree, e.specialisation].filter(Boolean).join(" • ")}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {e.start_year ?? "—"} – {e.is_current ? "Present" : e.end_year ?? "—"}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditing(e);
                    setOpen(true);
                  }}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMutation.mutate(e.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <EducationDialog open={open} onOpenChange={setOpen} editing={editing} />
    </section>
  );
}

function EducationDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: any;
}) {
  const qc = useQueryClient();
  const save = useServerFn(upsertEducation);
  const [form, setForm] = useState({
    id: editing?.id ?? undefined,
    institution: editing?.institution ?? "",
    degree: editing?.degree ?? "",
    specialisation: editing?.specialisation ?? "",
    start_year: editing?.start_year?.toString() ?? "",
    end_year: editing?.end_year?.toString() ?? "",
    is_current: editing?.is_current ?? false,
  });
  useEffect(() => {
    setForm({
      id: editing?.id ?? undefined,
      institution: editing?.institution ?? "",
      degree: editing?.degree ?? "",
      specialisation: editing?.specialisation ?? "",
      start_year: editing?.start_year?.toString() ?? "",
      end_year: editing?.end_year?.toString() ?? "",
      is_current: editing?.is_current ?? false,
    });
  }, [editing, open]);

  const mutation = useMutation({
    mutationFn: (payload: any) => save({ data: payload }),
    onSuccess: () => {
      toast.success("Education saved");
      qc.invalidateQueries({ queryKey: ["career-overview"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Education" : "Add Education"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Institution Name">
            <Input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
            />
          </Field>
          <FieldRow>
            <Field label="Degree / Qualification">
              <Input
                value={form.degree}
                onChange={(e) => setForm({ ...form, degree: e.target.value })}
              />
            </Field>
            <Field label="Specialisation">
              <Input
                value={form.specialisation}
                onChange={(e) => setForm({ ...form, specialisation: e.target.value })}
              />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Start Year">
              <Input
                type="number"
                value={form.start_year}
                onChange={(e) => setForm({ ...form, start_year: e.target.value })}
              />
            </Field>
            <Field label="End Year (or Expected)">
              <Input
                type="number"
                value={form.end_year}
                onChange={(e) => setForm({ ...form, end_year: e.target.value })}
                disabled={form.is_current}
              />
            </Field>
          </FieldRow>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.is_current}
              onChange={(e) =>
                setForm({ ...form, is_current: e.target.checked, end_year: "" })
              }
            />
            Currently studying here
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending || !form.institution}
            onClick={() =>
              mutation.mutate({
                id: form.id,
                institution: form.institution,
                degree: form.degree || null,
                specialisation: form.specialisation || null,
                start_year: form.start_year ? Number(form.start_year) : null,
                end_year: form.end_year ? Number(form.end_year) : null,
                is_current: form.is_current,
              })
            }
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Skills
// ============================================================
function SkillsSection({
  skills,
  programSkillOptions,
}: {
  skills: Overview["skills"];
  programSkillOptions: Overview["programSkillOptions"];
}) {
  const qc = useQueryClient();
  const add = useServerFn(addSkill);
  const toggle = useServerFn(toggleSkillVisibility);
  const remove = useServerFn(removeSkill);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<string>("");

  const addMutation = useMutation({
    mutationFn: (payload: any) => add({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["career-overview"] });
      setName("");
      setLevel("");
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to add skill"),
  });

  const toggleMutation = useMutation({
    mutationFn: (payload: any) => toggle({ data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career-overview"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["career-overview"] }),
  });

  const alreadyAdded = useMemo(
    () => new Set(skills.map((s: any) => `${s.skill_name}::${s.linked_course_id ?? ""}`)),
    [skills],
  );

  return (
    <section className="rounded-2xl border bg-white p-5">
      <SectionHeader icon={<Target className="size-4" />} title="My Skills" />
      <div className="mt-3 flex gap-2 flex-wrap">
        <Input
          className="flex-1 min-w-[180px]"
          placeholder="Add a skill (e.g. SQL, Public Speaking)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Level (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Button
          disabled={!name.trim() || addMutation.isPending}
          onClick={() =>
            addMutation.mutate({
              skill_name: name.trim(),
              skill_source: "student_added",
              skill_level: level || null,
            })
          }
        >
          <Plus className="size-4 mr-1" /> Add
        </Button>
      </div>

      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((s: any) => (
            <div
              key={s.id}
              className={cn(
                "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs",
                s.show_in_profile
                  ? "bg-primary/5 border-primary/30"
                  : "bg-muted/40 border-transparent text-muted-foreground",
              )}
            >
              <span className="font-medium">{s.skill_name}</span>
              {s.skill_level ? (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.skill_level}
                </span>
              ) : null}
              <button
                title={s.show_in_profile ? "Hide from profile" : "Show in profile"}
                className="ml-1 hover:text-primary"
                onClick={() =>
                  toggleMutation.mutate({ id: s.id, show_in_profile: !s.show_in_profile })
                }
              >
                {s.show_in_profile ? (
                  <Eye className="size-3.5" />
                ) : (
                  <EyeOff className="size-3.5" />
                )}
              </button>
              <button
                title="Remove"
                className="hover:text-destructive"
                onClick={() => removeMutation.mutate(s.id)}
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {programSkillOptions.length > 0 && (
        <div className="mt-5 pt-4 border-t">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Skills From Your Programs
          </div>
          <div className="flex flex-wrap gap-2">
            {programSkillOptions.map((opt: any) => {
              const key = `${opt.skill_name}::${opt.course_id}`;
              const added = alreadyAdded.has(key);
              return (
                <button
                  key={key}
                  disabled={added || addMutation.isPending}
                  onClick={() =>
                    addMutation.mutate({
                      skill_name: opt.skill_name,
                      skill_source: "program_skill",
                      linked_skill_id: opt.skill_id,
                      linked_course_id: opt.course_id,
                    })
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition",
                    added
                      ? "bg-primary/10 border-primary/40 text-primary cursor-default"
                      : "bg-white hover:bg-primary/5 hover:border-primary/40",
                  )}
                  title={`${opt.skill_name} from ${opt.course_title}`}
                >
                  {added ? <Check className="size-3" /> : <Plus className="size-3" />}
                  {opt.skill_name}
                  <span className="text-[10px] text-muted-foreground">
                    · {opt.course_title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

// ============================================================
// Portfolio
// ============================================================
function PortfolioSection({ portfolio }: { portfolio: Overview["portfolioProjects"] }) {
  const [manageOpen, setManageOpen] = useState(false);
  return (
    <section className="rounded-2xl border bg-white p-5">
      <SectionHeader
        icon={<Briefcase className="size-4" />}
        title="Portfolio Projects"
        action={
          <Button variant="outline" size="sm" onClick={() => setManageOpen(true)}>
            Manage Selection
          </Button>
        }
      />
      {portfolio.length === 0 ? (
        <div className="mt-3 rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          <div className="font-medium text-foreground">No Portfolio Projects Yet</div>
          Approved portfolio-eligible projects you select will appear here.
        </div>
      ) : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {portfolio.map((p: any) => (
            <div key={p.id} className="rounded-xl border p-3 bg-white">
              <div className="text-sm font-semibold">{p.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {p.course_title}
                {p.project_type ? ` • ${p.project_type}` : ""}
              </div>
              {p.completed_at ? (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Completed {new Date(p.completed_at).toLocaleDateString()}
                </div>
              ) : null}
              <div className="mt-2 flex gap-2 flex-wrap">
                {p.repository_url ? (
                  <a
                    href={p.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <LinkIcon className="size-3" /> Repository
                  </a>
                ) : null}
                {p.live_url ? (
                  <a
                    href={p.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <LinkIcon className="size-3" /> Live
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <ManagePortfolioDialog open={manageOpen} onOpenChange={setManageOpen} />
    </section>
  );
}

function ManagePortfolioDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const list = useServerFn(listEligiblePortfolioProjects);
  const toggle = useServerFn(togglePortfolioProject);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["portfolio-eligible"],
    queryFn: () => list(),
    enabled: open,
  });
  const mutation = useMutation({
    mutationFn: (payload: any) => toggle({ data: payload }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["portfolio-eligible"] });
      qc.invalidateQueries({ queryKey: ["career-overview"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Portfolio Projects</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Only completed projects marked portfolio-eligible are shown. Under-review,
          revision-required or rejected projects are excluded.
        </p>
        <div className="max-h-[60vh] overflow-y-auto space-y-2">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (data ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground italic p-3">
              No eligible projects yet. Complete portfolio-eligible projects to add them here.
            </div>
          ) : (
            (data ?? []).map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div>
                  <div className="text-sm font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {p.course_title}
                    {p.project_type ? ` • ${p.project_type}` : ""}
                  </div>
                </div>
                <Switch
                  checked={p.portfolio_added}
                  onCheckedChange={(v) =>
                    mutation.mutate({ student_project_id: p.id, include: v })
                  }
                />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Preferences
// ============================================================
function PreferencesSection({ preferences }: { preferences: Overview["preferences"] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl border bg-white p-5">
      <SectionHeader
        icon={<Rocket className="size-4" />}
        title="Career Preferences"
        action={
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            <Pencil className="size-3.5 mr-1.5" /> Edit
          </Button>
        }
      />
      {!preferences ? (
        <div className="mt-3 text-sm text-muted-foreground italic">
          Add your preferences so the platform tailors career guidance.
        </div>
      ) : (
        <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
          <ProfileField
            icon={<Target className="size-3.5" />}
            label="Preferred Role"
            value={preferences.preferred_role || "—"}
          />
          <ProfileField
            icon={<Building2 className="size-3.5" />}
            label="Industries"
            value={preferences.preferred_industries?.join(", ") || "—"}
          />
          <ProfileField
            icon={<Briefcase className="size-3.5" />}
            label="Work Types"
            value={
              preferences.preferred_work_types
                ?.map((v: string) => WORK_TYPE_OPTIONS.find((o) => o.value === v)?.label ?? v)
                .join(", ") || "—"
            }
          />
          <ProfileField
            icon={<MapPin className="size-3.5" />}
            label="Locations"
            value={preferences.preferred_locations?.join(", ") || "—"}
          />
          <div className="sm:col-span-2 flex flex-wrap gap-2 pt-1">
            {preferences.open_to_internship && <Badge variant="outline">Open to internship</Badge>}
            {preferences.open_to_entry_level && <Badge variant="outline">Open to entry-level</Badge>}
            {preferences.open_to_remote && <Badge variant="outline">Open to remote</Badge>}
            {preferences.open_to_opportunities && (
              <Badge variant="outline">Open to opportunities</Badge>
            )}
          </div>
        </div>
      )}
      <PreferencesDialog open={open} onOpenChange={setOpen} preferences={preferences} />
    </section>
  );
}

function PreferencesDialog({
  open,
  onOpenChange,
  preferences,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  preferences: Overview["preferences"];
}) {
  const qc = useQueryClient();
  const save = useServerFn(saveCareerPreferences);
  const [form, setForm] = useState<any>({
    preferred_role: preferences?.preferred_role ?? "",
    preferred_industries: preferences?.preferred_industries?.join(", ") ?? "",
    preferred_work_types: preferences?.preferred_work_types ?? [],
    preferred_locations: preferences?.preferred_locations?.join(", ") ?? "",
    open_to_internship: preferences?.open_to_internship ?? false,
    open_to_entry_level: preferences?.open_to_entry_level ?? false,
    open_to_remote: preferences?.open_to_remote ?? false,
    open_to_opportunities: preferences?.open_to_opportunities ?? false,
  });

  useEffect(() => {
    if (open) {
      setForm({
        preferred_role: preferences?.preferred_role ?? "",
        preferred_industries: preferences?.preferred_industries?.join(", ") ?? "",
        preferred_work_types: preferences?.preferred_work_types ?? [],
        preferred_locations: preferences?.preferred_locations?.join(", ") ?? "",
        open_to_internship: preferences?.open_to_internship ?? false,
        open_to_entry_level: preferences?.open_to_entry_level ?? false,
        open_to_remote: preferences?.open_to_remote ?? false,
        open_to_opportunities: preferences?.open_to_opportunities ?? false,
      });
    }
  }, [open, preferences]);

  const mutation = useMutation({
    mutationFn: (payload: any) => save({ data: payload }),
    onSuccess: () => {
      toast.success("Preferences saved");
      qc.invalidateQueries({ queryKey: ["career-overview"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  const toggleWorkType = (v: string) => {
    setForm((f: any) => ({
      ...f,
      preferred_work_types: f.preferred_work_types.includes(v)
        ? f.preferred_work_types.filter((x: string) => x !== v)
        : [...f.preferred_work_types, v],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Career Preferences</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Preferred Career Role">
            <Input
              value={form.preferred_role}
              onChange={(e) => setForm({ ...form, preferred_role: e.target.value })}
            />
          </Field>
          <Field label="Preferred Industries (comma separated)">
            <Input
              value={form.preferred_industries}
              onChange={(e) => setForm({ ...form, preferred_industries: e.target.value })}
            />
          </Field>
          <Field label="Preferred Work Types">
            <div className="flex flex-wrap gap-2">
              {WORK_TYPE_OPTIONS.map((opt) => {
                const active = form.preferred_work_types.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleWorkType(opt.value)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition",
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "hover:bg-muted",
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Preferred Work Locations (comma separated)">
            <Input
              value={form.preferred_locations}
              onChange={(e) => setForm({ ...form, preferred_locations: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <SwitchRow
              label="Open To Internship"
              value={form.open_to_internship}
              onChange={(v) => setForm({ ...form, open_to_internship: v })}
            />
            <SwitchRow
              label="Open To Entry-Level"
              value={form.open_to_entry_level}
              onChange={(v) => setForm({ ...form, open_to_entry_level: v })}
            />
            <SwitchRow
              label="Open To Remote"
              value={form.open_to_remote}
              onChange={(v) => setForm({ ...form, open_to_remote: v })}
            />
            <SwitchRow
              label="Open To Opportunities"
              value={form.open_to_opportunities}
              onChange={(v) => setForm({ ...form, open_to_opportunities: v })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                preferred_role: form.preferred_role || null,
                preferred_industries: form.preferred_industries
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
                preferred_work_types: form.preferred_work_types,
                preferred_locations: form.preferred_locations
                  .split(",")
                  .map((s: string) => s.trim())
                  .filter(Boolean),
                open_to_internship: form.open_to_internship,
                open_to_entry_level: form.open_to_entry_level,
                open_to_remote: form.open_to_remote,
                open_to_opportunities: form.open_to_opportunities,
              })
            }
          >
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SwitchRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2">
      <span className="text-sm">{label}</span>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

// ============================================================
// Aside cards
// ============================================================
function TasksCard({ tasks }: { tasks: Overview["tasks"] }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <SectionHeader icon={<ClipboardList className="size-4" />} title="Career Preparation Tasks" />
      <ul className="mt-3 space-y-2">
        {tasks.map((t) => (
          <li
            key={t.key}
            className="flex items-center justify-between gap-2 text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-4 rounded-full flex items-center justify-center border",
                  t.status === "completed"
                    ? "bg-primary border-primary text-primary-foreground"
                    : t.status === "in_progress"
                      ? "border-primary text-primary"
                      : "border-muted-foreground/30",
                )}
              >
                {t.status === "completed" ? <Check className="size-3" /> : null}
              </div>
              <span>{t.label}</span>
            </div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest",
                t.status === "completed"
                  ? "text-primary"
                  : t.status === "in_progress"
                    ? "text-amber-600"
                    : "text-muted-foreground",
              )}
            >
              {t.status.replace("_", " ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CertificatesCard({ certificates }: { certificates: Overview["certificates"] }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <SectionHeader icon={<Award className="size-4" />} title="My Certifications" />
      {certificates.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground italic">
          No Issued Certificates Yet
        </div>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {certificates.map((c: any) => (
            <li key={c.id} className="rounded-lg border p-3">
              <div className="font-medium">{c.course_title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {c.certificate_type}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                {c.certificate_number}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Issued {new Date(c.issued_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function InternshipCard({ internships }: { internships: Overview["internships"] }) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <SectionHeader icon={<Rocket className="size-4" />} title="Internship Experience" />
      {internships.length === 0 ? (
        <div className="mt-3 text-sm text-muted-foreground italic">
          No internship activity yet. Eligible internships appear once you meet program requirements.
        </div>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {internships.map((i: any) => (
            <li key={i.id} className="rounded-lg border p-3">
              <div className="font-medium">{i.course_title}</div>
              <div className="text-xs text-muted-foreground capitalize mt-0.5">
                {String(i.status).replace(/_/g, " ")}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {i.started_at
                  ? `Started ${new Date(i.started_at).toLocaleDateString()}`
                  : "Not started"}
                {i.completed_at
                  ? ` • Completed ${new Date(i.completed_at).toLocaleDateString()}`
                  : ""}
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Number(i.progress_percent ?? 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function GuidanceCard({ guidance }: { guidance: Overview["guidance"] }) {
  if (!guidance.length) return null;
  return (
    <div className="rounded-2xl border bg-white p-5">
      <SectionHeader icon={<Compass className="size-4" />} title="Career Guidance" />
      <ul className="mt-3 space-y-2 text-sm">
        {guidance.map((g: any, idx: number) => (
          <li key={idx} className="rounded-lg border p-3">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {g.type}
            </div>
            <div className="font-medium mt-0.5">{g.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{g.course_title}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// Section header
// ============================================================
function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="size-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
        <div className="font-semibold text-sm">{title}</div>
      </div>
      {action}
    </div>
  );
}
