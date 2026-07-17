import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAdminSuccessStories,
  initialsAvatarUrl,
  type SuccessStoryRow,
} from "@/lib/success-stories/hooks";

export const Route = createFileRoute("/_authenticated/admin/success-stories")({
  head: () => ({
    meta: [
      { title: "Success Stories — Glintr Admin" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSuccessStoriesPage,
});

type Draft = Omit<Partial<SuccessStoryRow>, "id"> & { id?: string };

const EMPTY: Draft = {
  name: "",
  role: "",
  company: "",
  company_slug: "",
  company_domain: "",
  course: "",
  course_category: "",
  batch: "",
  package_label: "",
  package_lpa: null,
  location: "",
  graduation_year: null,
  rating: 5,
  quote: "",
  linkedin_url: "",
  story_url: "",
  avatar_url: "",
  featured: false,
  published: true,
  sort_order: 0,
};

function AdminSuccessStoriesPage() {
  const qc = useQueryClient();
  const { data: stories = [], isLoading } = useAdminSuccessStories();

  const [q, setQ] = React.useState("");
  const [draft, setDraft] = React.useState<Draft | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["success-stories"] });
  };

  const saveMut = useMutation({
    mutationFn: async (d: Draft) => {
      const payload = { ...d };
      if (payload.package_lpa != null && String(payload.package_lpa) === "")
        payload.package_lpa = null;
      if (payload.graduation_year != null && String(payload.graduation_year) === "")
        payload.graduation_year = null;
      // Blank optional strings -> null
      for (const k of [
        "avatar_url",
        "company_slug",
        "company_domain",
        "batch",
        "package_label",
        "location",
        "linkedin_url",
        "story_url",
        "course_category",
      ] as const) {
        if (payload[k] === "") (payload as Record<string, unknown>)[k] = null;
      }
      if (d.id) {
        const { error } = await supabase
          .from("success_stories")
          .update(payload)
          .eq("id", d.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("success_stories").insert(payload as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Story saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("success_stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Story deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SuccessStoryRow> }) => {
      const { error } = await supabase
        .from("success_stories")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const reorderMut = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const idx = stories.findIndex((s) => s.id === id);
      const swap = stories[idx + delta];
      const me = stories[idx];
      if (!swap || !me) return;
      await Promise.all([
        supabase
          .from("success_stories")
          .update({ sort_order: swap.sort_order })
          .eq("id", me.id),
        supabase
          .from("success_stories")
          .update({ sort_order: me.sort_order })
          .eq("id", swap.id),
      ]);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return stories;
    return stories.filter((s) =>
      `${s.name} ${s.company} ${s.course}`.toLowerCase().includes(needle),
    );
  }, [stories, q]);

  const kpis = React.useMemo(() => {
    const published = stories.filter((s) => s.published).length;
    const featured = stories.filter((s) => s.featured).length;
    const avg =
      stories.length === 0
        ? 0
        : stories.reduce((a, s) => a + (s.package_lpa ?? 0), 0) / stories.length;
    return { total: stories.length, published, featured, avg };
  }, [stories]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Success Stories
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every learner testimonial rendered across course pages.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="pl-9"
            />
          </div>
          <Button onClick={() => setDraft(EMPTY)}>
            <Plus className="size-4" /> Add story
          </Button>
        </div>
      </header>

      <div className="grid gap-3 md:grid-cols-4">
        <Kpi label="Total" value={kpis.total} />
        <Kpi label="Published" value={kpis.published} />
        <Kpi label="Featured" value={kpis.featured} />
        <Kpi label="Avg Package (LPA)" value={kpis.avg.toFixed(1)} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border/60 bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Student</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Company</th>
              <th className="px-4 py-3 text-left">Course</th>
              <th className="px-4 py-3 text-left">Package</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  No stories yet. Click “Add story” to create the first one.
                </td>
              </tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id} className="border-t border-border/40 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatar_url || initialsAvatarUrl(s.name)}
                        alt=""
                        className="size-9 rounded-full object-cover ring-1 ring-border"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.location ?? "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{s.role}</td>
                  <td className="px-4 py-3">{s.company}</td>
                  <td className="px-4 py-3">
                    <p className="truncate">{s.course}</p>
                    <p className="text-xs text-muted-foreground">{s.batch ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold">{s.package_label ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={s.published ? "success" : "muted"}>
                        {s.published ? "Live" : "Hidden"}
                      </Badge>
                      {s.featured ? <Badge variant="premium">Featured</Badge> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconBtn
                        title="Move up"
                        disabled={i === 0}
                        onClick={() => reorderMut.mutate({ id: s.id, delta: -1 })}
                      >
                        <ArrowUp className="size-4" />
                      </IconBtn>
                      <IconBtn
                        title="Move down"
                        disabled={i === filtered.length - 1}
                        onClick={() => reorderMut.mutate({ id: s.id, delta: 1 })}
                      >
                        <ArrowDown className="size-4" />
                      </IconBtn>
                      <IconBtn
                        title={s.featured ? "Unfeature" : "Feature"}
                        onClick={() =>
                          toggleMut.mutate({
                            id: s.id,
                            patch: { featured: !s.featured },
                          })
                        }
                      >
                        <Star
                          className={
                            s.featured ? "size-4 fill-amber-400 text-amber-500" : "size-4"
                          }
                        />
                      </IconBtn>
                      <IconBtn
                        title={s.published ? "Hide" : "Publish"}
                        onClick={() =>
                          toggleMut.mutate({
                            id: s.id,
                            patch: { published: !s.published },
                          })
                        }
                      >
                        {s.published ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </IconBtn>
                      <IconBtn title="Edit" onClick={() => setDraft(s)}>
                        <Pencil className="size-4" />
                      </IconBtn>
                      <IconBtn
                        title="Delete"
                        onClick={() => {
                          if (confirm(`Delete story from ${s.name}?`))
                            deleteMut.mutate(s.id);
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </IconBtn>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <StoryEditor
        draft={draft}
        onCancel={() => setDraft(null)}
        onSave={(d) => saveMut.mutate(d)}
        saving={saveMut.isPending}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl font-semibold">{value}</p>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-8 items-center justify-center rounded-lg border border-transparent text-muted-foreground transition hover:border-border hover:bg-muted disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function StoryEditor({
  draft,
  onCancel,
  onSave,
  saving,
}: {
  draft: Draft | null;
  onCancel: () => void;
  onSave: (d: Draft) => void;
  saving: boolean;
}) {
  const [form, setForm] = React.useState<Draft>(EMPTY);
  React.useEffect(() => {
    if (draft) setForm({ ...EMPTY, ...draft });
  }, [draft]);

  const setF = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const open = draft !== null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onCancel() : null)}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit success story" : "Add success story"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <Field label="Full name *">
            <Input
              value={form.name ?? ""}
              onChange={(e) => setF("name", e.target.value)}
              placeholder="Aarav Sharma"
            />
          </Field>
          <Field label="Job title / role *">
            <Input
              value={form.role ?? ""}
              onChange={(e) => setF("role", e.target.value)}
              placeholder="AI Engineer"
            />
          </Field>
          <Field label="Company *">
            <Input
              value={form.company ?? ""}
              onChange={(e) => setF("company", e.target.value)}
              placeholder="Google"
            />
          </Field>
          <Field label="Company logo slug (SimpleIcons)">
            <Input
              value={form.company_slug ?? ""}
              onChange={(e) => setF("company_slug", e.target.value)}
              placeholder="google"
            />
          </Field>
          <Field label="Company domain (fallback)">
            <Input
              value={form.company_domain ?? ""}
              onChange={(e) => setF("company_domain", e.target.value)}
              placeholder="google.com"
            />
          </Field>
          <Field label="Photo URL (leave blank for initials avatar)">
            <Input
              value={form.avatar_url ?? ""}
              onChange={(e) => setF("avatar_url", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Course *">
            <Input
              value={form.course ?? ""}
              onChange={(e) => setF("course", e.target.value)}
              placeholder="Artificial Intelligence Program"
            />
          </Field>
          <Field label="Course category slug">
            <Input
              value={form.course_category ?? ""}
              onChange={(e) => setF("course_category", e.target.value)}
              placeholder="artificial-intelligence"
            />
          </Field>
          <Field label="Batch">
            <Input
              value={form.batch ?? ""}
              onChange={(e) => setF("batch", e.target.value)}
              placeholder="2026 Batch"
            />
          </Field>
          <Field label="Package label">
            <Input
              value={form.package_label ?? ""}
              onChange={(e) => setF("package_label", e.target.value)}
              placeholder="₹18 LPA"
            />
          </Field>
          <Field label="Package LPA (number, for filters)">
            <Input
              type="number"
              step="0.5"
              value={form.package_lpa ?? ""}
              onChange={(e) =>
                setF("package_lpa", e.target.value === "" ? null : Number(e.target.value))
              }
              placeholder="18"
            />
          </Field>
          <Field label="Location">
            <Input
              value={form.location ?? ""}
              onChange={(e) => setF("location", e.target.value)}
              placeholder="Bengaluru"
            />
          </Field>
          <Field label="Graduation year">
            <Input
              type="number"
              value={form.graduation_year ?? ""}
              onChange={(e) =>
                setF(
                  "graduation_year",
                  e.target.value === "" ? null : Number(e.target.value),
                )
              }
              placeholder="2026"
            />
          </Field>
          <Field label="Rating (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={form.rating ?? 5}
              onChange={(e) => setF("rating", Number(e.target.value))}
            />
          </Field>
          <Field label="LinkedIn URL">
            <Input
              value={form.linkedin_url ?? ""}
              onChange={(e) => setF("linkedin_url", e.target.value)}
              placeholder="https://linkedin.com/in/…"
            />
          </Field>
          <Field label="Full story URL">
            <Input
              value={form.story_url ?? ""}
              onChange={(e) => setF("story_url", e.target.value)}
              placeholder="/success-stories/aarav-sharma"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Testimonial quote *">
              <Textarea
                rows={4}
                value={form.quote ?? ""}
                onChange={(e) => setF("quote", e.target.value)}
                placeholder="Glintr completely changed my career…"
              />
            </Field>
          </div>

          <div className="flex items-center gap-6 md:col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(form.published)}
                onCheckedChange={(v) => setF("published", v)}
              />
              Published
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(form.featured)}
                onCheckedChange={(v) => setF("featured", v)}
              />
              Featured
            </label>
            <div className="ml-auto">
              <Label className="text-xs text-muted-foreground">Sort order</Label>
              <Input
                type="number"
                value={form.sort_order ?? 0}
                onChange={(e) => setF("sort_order", Number(e.target.value))}
                className="mt-1 w-24"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!form.name?.trim() || !form.role?.trim() || !form.company?.trim() || !form.course?.trim() || !form.quote?.trim()) {
                toast.error("Name, role, company, course and quote are required.");
                return;
              }
              onSave(form);
            }}
            disabled={saving}
          >
            <Upload className="size-4" /> {saving ? "Saving…" : "Save story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
