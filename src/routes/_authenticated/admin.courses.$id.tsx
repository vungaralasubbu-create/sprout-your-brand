import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Trash2, Plus, GripVertical } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/courses/$id")({
  component: CourseBuilder,
});

function CourseBuilder() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["admin-course", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*, category:course_categories(name,slug)").eq("id", id).single();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => (await supabase.from("course_categories").select("id,name").order("display_order")).data ?? [],
  });

  const [form, setForm] = useState<any>({});
  useEffect(() => { if (course) setForm(course); }, [course]);

  const save = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await supabase.from("courses").update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["admin-course", id] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Deleted"); navigate({ to: "/admin/courses" }); },
    onError: (e: any) => toast.error(e.message ?? "Cannot delete — may have applications"),
  });

  if (isLoading || !course) return <div className="p-12 text-center text-muted-foreground">Loading…</div>;

  function saveAll() {
    const patch: any = {};
    const keys = [
      "name","slug","category_id","short_description","full_description","thumbnail_url","hero_image_url","promo_video_url",
      "duration","learning_mode","level","language","weekly_commitment","format","prerequisites","eligibility","target_audience",
      "base_price","offer_price","currency","emi_available","emi_starting","scholarship_available","pricing_notes",
      "white_label_eligible","partner_sale_eligible","supported_sales_eligible",
      "is_featured","is_trending","is_popular","is_bestseller","status",
      "seo_title","seo_description","og_image_url",
    ];
    keys.forEach((k) => { if (k in form) patch[k] = form[k]; });
    save.mutate(patch);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link to="/admin/courses" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-5" /></Link>
          <div>
            <h2 className="text-heading-xl font-display font-semibold">{form.name || "Untitled course"}</h2>
            <div className="text-caption flex items-center gap-2 mt-1">
              <Badge variant={form.status === "published" ? "success" : "outline"}>{form.status}</Badge>
              {course.category?.slug ? (
                <a className="inline-flex items-center gap-1 hover:text-foreground" target="_blank" rel="noreferrer" href={`/programs/${course.category.slug}/${course.slug}`}>
                  Preview <ExternalLink className="size-3" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={form.status ?? "draft"} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="outline"><Trash2 className="size-4" /></Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Delete this course?</AlertDialogTitle>
                <AlertDialogDescription>This cannot be undone. Courses with applications cannot be deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => del.mutate()}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="gradient" onClick={saveAll} disabled={save.isPending}>Save changes</Button>
        </div>
      </div>

      <Tabs defaultValue="basics">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="basics">1. Basics</TabsTrigger>
          <TabsTrigger value="category">2. Category & Eligibility</TabsTrigger>
          <TabsTrigger value="pricing">3. Pricing</TabsTrigger>
          <TabsTrigger value="details">4. Details</TabsTrigger>
          <TabsTrigger value="curriculum">5. Curriculum</TabsTrigger>
          <TabsTrigger value="skills">6. Skills & Tools</TabsTrigger>
          <TabsTrigger value="careers">7. Careers</TabsTrigger>
          <TabsTrigger value="cert">8. Certification & Support</TabsTrigger>
          <TabsTrigger value="faqs">9. FAQs</TabsTrigger>
          <TabsTrigger value="seo">10. SEO & Publish</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="mt-6 space-y-4">
          <Card>
            <Field label="Course name"><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug ?? ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
            <Field label="Short description" full><Textarea rows={2} value={form.short_description ?? ""} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></Field>
            <Field label="Full description" full><Textarea rows={5} value={form.full_description ?? ""} onChange={(e) => setForm({ ...form, full_description: e.target.value })} /></Field>
            <Field label="Thumbnail URL"><Input value={form.thumbnail_url ?? ""} onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })} /></Field>
            <Field label="Hero image URL"><Input value={form.hero_image_url ?? ""} onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })} /></Field>
            <Field label="Promo video URL" full><Input value={form.promo_video_url ?? ""} onChange={(e) => setForm({ ...form, promo_video_url: e.target.value })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="category" className="mt-6 space-y-4">
          <Card>
            <Field label="Category">
              <Select value={form.category_id ?? ""} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <ToggleField label="Featured" checked={!!form.is_featured} onChange={(v) => setForm({ ...form, is_featured: v })} />
            <ToggleField label="Trending" checked={!!form.is_trending} onChange={(v) => setForm({ ...form, is_trending: v })} />
            <ToggleField label="Popular" checked={!!form.is_popular} onChange={(v) => setForm({ ...form, is_popular: v })} />
            <ToggleField label="Best seller" checked={!!form.is_bestseller} onChange={(v) => setForm({ ...form, is_bestseller: v })} />
            <div className="col-span-full pt-2 border-t border-border/50" />
            <ToggleField label="Partner sale eligible" checked={!!form.partner_sale_eligible} onChange={(v) => setForm({ ...form, partner_sale_eligible: v })} />
            <ToggleField label="Supported sales eligible" checked={!!form.supported_sales_eligible} onChange={(v) => setForm({ ...form, supported_sales_eligible: v })} />
            <ToggleField label="White-label eligible" checked={!!form.white_label_eligible} onChange={(v) => setForm({ ...form, white_label_eligible: v })} />
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="mt-6 space-y-4">
          <Card>
            <Field label="Base price"><Input type="number" value={form.base_price ?? ""} onChange={(e) => setForm({ ...form, base_price: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Offer price"><Input type="number" value={form.offer_price ?? ""} onChange={(e) => setForm({ ...form, offer_price: e.target.value ? Number(e.target.value) : null })} /></Field>
            <Field label="Currency"><Input value={form.currency ?? "INR"} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></Field>
            <Field label="EMI starting amount"><Input type="number" value={form.emi_starting ?? ""} onChange={(e) => setForm({ ...form, emi_starting: e.target.value ? Number(e.target.value) : null })} /></Field>
            <ToggleField label="EMI available" checked={!!form.emi_available} onChange={(v) => setForm({ ...form, emi_available: v })} />
            <ToggleField label="Scholarship available" checked={!!form.scholarship_available} onChange={(v) => setForm({ ...form, scholarship_available: v })} />
            <Field label="Pricing notes" full><Textarea rows={2} value={form.pricing_notes ?? ""} onChange={(e) => setForm({ ...form, pricing_notes: e.target.value })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="mt-6 space-y-4">
          <Card>
            <Field label="Duration"><Input value={form.duration ?? ""} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
            <Field label="Learning mode">
              <Select value={form.learning_mode ?? ""} onValueChange={(v) => setForm({ ...form, learning_mode: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Self-paced">Self-paced</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Level">
              <Select value={form.level ?? ""} onValueChange={(v) => setForm({ ...form, level: v })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Language"><Input value={form.language ?? "English"} onChange={(e) => setForm({ ...form, language: e.target.value })} /></Field>
            <Field label="Weekly commitment"><Input value={form.weekly_commitment ?? ""} onChange={(e) => setForm({ ...form, weekly_commitment: e.target.value })} /></Field>
            <Field label="Format"><Input value={form.format ?? ""} onChange={(e) => setForm({ ...form, format: e.target.value })} /></Field>
            <Field label="Prerequisites" full><Textarea rows={2} value={form.prerequisites ?? ""} onChange={(e) => setForm({ ...form, prerequisites: e.target.value })} /></Field>
            <Field label="Eligibility" full><Textarea rows={2} value={form.eligibility ?? ""} onChange={(e) => setForm({ ...form, eligibility: e.target.value })} /></Field>
            <Field label="Target audience" full><Textarea rows={2} value={form.target_audience ?? ""} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} /></Field>
          </Card>
        </TabsContent>

        <TabsContent value="curriculum" className="mt-6">
          <CurriculumEditor courseId={id} />
        </TabsContent>

        <TabsContent value="skills" className="mt-6">
          <SkillsToolsEditor courseId={id} />
        </TabsContent>

        <TabsContent value="careers" className="mt-6">
          <CareersEditor courseId={id} />
        </TabsContent>

        <TabsContent value="cert" className="mt-6">
          <CertPlacementEditor courseId={id} />
        </TabsContent>

        <TabsContent value="faqs" className="mt-6">
          <FaqsEditor courseId={id} />
        </TabsContent>

        <TabsContent value="seo" className="mt-6 space-y-4">
          <Card>
            <Field label="SEO title" full><Input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} /></Field>
            <Field label="SEO description" full><Textarea rows={3} value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} /></Field>
            <Field label="OG image URL" full><Input value={form.og_image_url ?? ""} onChange={(e) => setForm({ ...form, og_image_url: e.target.value })} /></Field>
          </Card>
          <div className="flex justify-end">
            <Button variant="gradient" size="lg" onClick={saveAll} disabled={save.isPending}>Save all changes</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card-elevated p-6 grid md:grid-cols-2 gap-4">{children}</div>;
}
function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return <div className={full ? "md:col-span-2" : ""}><Label className="text-sm">{label}</Label><div className="mt-2">{children}</div></div>;
}
function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3 cursor-pointer">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

/* --------------------- CURRICULUM --------------------- */
function CurriculumEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const { data: modules = [] } = useQuery({
    queryKey: ["modules", courseId],
    queryFn: async () => {
      const { data } = await supabase.from("course_modules").select("*").eq("course_id", courseId).order("display_order");
      const withTopics = await Promise.all((data ?? []).map(async (m: any) => {
        const { data: t } = await supabase.from("course_topics").select("*").eq("module_id", m.id).order("display_order");
        return { ...m, topics: t ?? [] };
      }));
      return withTopics;
    },
  });

  const addModule = useMutation({
    mutationFn: async () => {
      const order = (modules[modules.length - 1]?.display_order ?? 0) + 1;
      const { error } = await supabase.from("course_modules").insert({ course_id: courseId, name: "New module", display_order: order, number: modules.length + 1 });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });
  const updateModule = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("course_modules").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });
  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("course_topics").delete().eq("module_id", id);
      await supabase.from("course_modules").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });
  const addTopic = useMutation({
    mutationFn: async ({ module_id, count }: { module_id: string; count: number }) => {
      await supabase.from("course_topics").insert({ module_id, name: "New topic", display_order: count + 1 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });
  const updateTopic = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      await supabase.from("course_topics").update(patch).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });
  const deleteTopic = useMutation({
    mutationFn: async (id: string) => { await supabase.from("course_topics").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules", courseId] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div><h3 className="font-display font-semibold text-lg">Curriculum</h3><p className="text-caption">Modules → topics.</p></div>
        <Button variant="outline" onClick={() => addModule.mutate()}><Plus className="size-4" /> Add module</Button>
      </div>
      <Accordion type="multiple" className="space-y-2">
        {modules.map((m: any) => (
          <AccordionItem value={m.id} key={m.id} className="card-elevated px-4">
            <AccordionTrigger className="hover:no-underline"><span className="text-left font-medium"><GripVertical className="inline size-4 text-muted-foreground mr-1" />Module {m.number ?? "—"}: {m.name}</span></AccordionTrigger>
            <AccordionContent className="pb-4 space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Input placeholder="Module name" defaultValue={m.name} onBlur={(e) => e.target.value !== m.name && updateModule.mutate({ id: m.id, patch: { name: e.target.value } })} />
                <Input placeholder="Duration" defaultValue={m.duration ?? ""} onBlur={(e) => e.target.value !== (m.duration ?? "") && updateModule.mutate({ id: m.id, patch: { duration: e.target.value || null } })} />
                <Textarea className="md:col-span-2" rows={2} placeholder="Description" defaultValue={m.description ?? ""} onBlur={(e) => e.target.value !== (m.description ?? "") && updateModule.mutate({ id: m.id, patch: { description: e.target.value || null } })} />
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="text-caption font-medium mb-2">Topics</div>
                <div className="space-y-2">
                  {m.topics.map((t: any) => (
                    <div key={t.id} className="flex gap-2 items-center">
                      <Input defaultValue={t.name} onBlur={(e) => e.target.value !== t.name && updateTopic.mutate({ id: t.id, patch: { name: e.target.value } })} className="flex-1" />
                      <Button variant="ghost" size="icon" onClick={() => deleteTopic.mutate(t.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => addTopic.mutate({ module_id: m.id, count: m.topics.length })}><Plus className="size-3.5" /> Add topic</Button>
              </div>
              <div className="flex justify-end pt-2 border-t border-border/50">
                <Button variant="ghost" size="sm" onClick={() => deleteModule.mutate(m.id)}><Trash2 className="size-4" /> Delete module</Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      {modules.length === 0 ? <div className="card-elevated p-8 text-center text-muted-foreground">No modules yet. Add your first module to build the curriculum.</div> : null}
    </div>
  );
}

/* --------------------- SKILLS & TOOLS --------------------- */
function SkillsToolsEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const [newSkill, setNewSkill] = useState("");
  const [newTool, setNewTool] = useState("");

  const skills = useQuery({
    queryKey: ["skills", courseId],
    queryFn: async () => (await supabase.from("course_skills").select("skills(id,name)").eq("course_id", courseId)).data ?? [],
  });
  const tools = useQuery({
    queryKey: ["tools", courseId],
    queryFn: async () => (await supabase.from("course_tools").select("tools(id,name)").eq("course_id", courseId)).data ?? [],
  });

  async function findOrCreate(table: "skills" | "tools", name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const existing = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
    if (existing.data?.id) return existing.data.id;
    const ins = await supabase.from(table).insert({ name, slug } as any).select("id").single();
    return ins.data?.id;
  }

  const addSkill = useMutation({
    mutationFn: async () => {
      if (!newSkill.trim()) return;
      const skillId = await findOrCreate("skills", newSkill.trim());
      if (!skillId) return;
      await supabase.from("course_skills").insert({ course_id: courseId, skill_id: skillId });
      setNewSkill("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills", courseId] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const removeSkill = useMutation({
    mutationFn: async (skillId: string) => { await supabase.from("course_skills").delete().eq("course_id", courseId).eq("skill_id", skillId); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["skills", courseId] }),
  });
  const addTool = useMutation({
    mutationFn: async () => {
      if (!newTool.trim()) return;
      const toolId = await findOrCreate("tools", newTool.trim());
      if (!toolId) return;
      await supabase.from("course_tools").insert({ course_id: courseId, tool_id: toolId });
      setNewTool("");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", courseId] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const removeTool = useMutation({
    mutationFn: async (toolId: string) => { await supabase.from("course_tools").delete().eq("course_id", courseId).eq("tool_id", toolId); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tools", courseId] }),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-elevated p-6">
        <h3 className="font-display font-semibold mb-3">Skills</h3>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Add a skill (e.g. Python)" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill.mutate()} />
          <Button variant="outline" onClick={() => addSkill.mutate()}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(skills.data ?? []).map((r: any) => (
            <Badge key={r.skills.id} variant="outline" className="gap-1">{r.skills.name}
              <button className="ml-1 hover:text-destructive" onClick={() => removeSkill.mutate(r.skills.id)}>×</button>
            </Badge>
          ))}
        </div>
      </div>
      <div className="card-elevated p-6">
        <h3 className="font-display font-semibold mb-3">Tools & technologies</h3>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Add a tool (e.g. TensorFlow)" value={newTool} onChange={(e) => setNewTool(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTool.mutate()} />
          <Button variant="outline" onClick={() => addTool.mutate()}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(tools.data ?? []).map((r: any) => (
            <Badge key={r.tools.id} variant="outline" className="gap-1">{r.tools.name}
              <button className="ml-1 hover:text-destructive" onClick={() => removeTool.mutate(r.tools.id)}>×</button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------- CAREERS --------------------- */
function CareersEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const roles = useQuery({
    queryKey: ["careers", courseId],
    queryFn: async () => (await supabase.from("course_career_roles").select("career_roles(*)").eq("course_id", courseId)).data ?? [],
  });
  const [form, setForm] = useState({ title: "", salary_min: "", salary_max: "", currency: "INR", salary_period: "yearly" });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) return;
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const ins = await supabase.from("career_roles").insert({
        title: form.title, slug,
        salary_min: form.salary_min ? Number(form.salary_min) : null,
        salary_max: form.salary_max ? Number(form.salary_max) : null,
        currency: form.currency, salary_period: form.salary_period,
      } as any).select("id").single();
      if (ins.data?.id) {
        await supabase.from("course_career_roles").insert({ course_id: courseId, career_role_id: ins.data.id });
      }
      setForm({ title: "", salary_min: "", salary_max: "", currency: "INR", salary_period: "yearly" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careers", courseId] }),
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });
  const remove = useMutation({
    mutationFn: async (roleId: string) => { await supabase.from("course_career_roles").delete().eq("course_id", courseId).eq("career_role_id", roleId); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["careers", courseId] }),
  });

  return (
    <div className="space-y-4">
      <div className="card-elevated p-6">
        <h3 className="font-display font-semibold mb-3">Add career role</h3>
        <p className="text-caption mb-4">Salary ranges display as "indicative" on the public page — never as guaranteed earnings.</p>
        <div className="grid md:grid-cols-5 gap-3">
          <Input className="md:col-span-2" placeholder="Job title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input type="number" placeholder="Salary min" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} />
          <Input type="number" placeholder="Salary max" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} />
          <Button variant="outline" onClick={() => add.mutate()}>Add role</Button>
        </div>
      </div>
      <div className="space-y-2">
        {(roles.data ?? []).map((r: any) => (
          <div key={r.career_roles.id} className="card-elevated p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{r.career_roles.title}</div>
              {r.career_roles.salary_min && r.career_roles.salary_max ? (
                <div className="text-caption text-mono">₹{Number(r.career_roles.salary_min).toLocaleString("en-IN")} – ₹{Number(r.career_roles.salary_max).toLocaleString("en-IN")} / {r.career_roles.salary_period}</div>
              ) : null}
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(r.career_roles.id)}><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------- CERT & PLACEMENT --------------------- */
function CertPlacementEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const certs = useQuery({ queryKey: ["certs", courseId], queryFn: async () => (await supabase.from("course_certifications").select("*").eq("course_id", courseId)).data ?? [] });
  const support = useQuery({ queryKey: ["support", courseId], queryFn: async () => (await supabase.from("course_placement_support").select("*").eq("course_id", courseId).order("display_order")).data ?? [] });

  const [cert, setCert] = useState({ name: "", issuer: "", description: "" });
  const [supp, setSupp] = useState({ support_type: "", description: "" });

  const addCert = useMutation({
    mutationFn: async () => {
      if (!cert.name.trim()) return;
      await supabase.from("course_certifications").insert({ course_id: courseId, name: cert.name, issuer: cert.issuer || null, description: cert.description || null } as any);
      setCert({ name: "", issuer: "", description: "" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certs", courseId] }),
  });
  const delCert = useMutation({
    mutationFn: async (id: string) => { await supabase.from("course_certifications").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certs", courseId] }),
  });
  const addSupp = useMutation({
    mutationFn: async () => {
      if (!supp.support_type.trim()) return;
      const order = ((support.data ?? []) as any[]).length + 1;
      await supabase.from("course_placement_support").insert({ course_id: courseId, support_type: supp.support_type, description: supp.description || null, display_order: order } as any);
      setSupp({ support_type: "", description: "" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support", courseId] }),
  });
  const delSupp = useMutation({
    mutationFn: async (id: string) => { await supabase.from("course_placement_support").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support", courseId] }),
  });

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card-elevated p-6 space-y-3">
        <h3 className="font-display font-semibold">Certifications</h3>
        <p className="text-caption">Use neutral language. Do not claim government/university recognition unless authorized.</p>
        <div className="space-y-2">
          <Input placeholder="Certificate name" value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} />
          <Input placeholder="Issuer" value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} />
          <Textarea placeholder="Description" rows={2} value={cert.description} onChange={(e) => setCert({ ...cert, description: e.target.value })} />
          <Button variant="outline" onClick={() => addCert.mutate()}>Add certification</Button>
        </div>
        <div className="space-y-2 pt-3 border-t border-border/50">
          {(certs.data ?? []).map((c: any) => (
            <div key={c.id} className="flex items-center justify-between gap-2">
              <div><div className="font-medium text-sm">{c.name}</div><div className="text-caption">{c.issuer}</div></div>
              <Button variant="ghost" size="icon" onClick={() => delCert.mutate(c.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </div>
      <div className="card-elevated p-6 space-y-3">
        <h3 className="font-display font-semibold">Placement & career support</h3>
        <p className="text-caption">e.g. Resume building, Mock interviews, Portfolio guidance.</p>
        <div className="space-y-2">
          <Input placeholder="Support type" value={supp.support_type} onChange={(e) => setSupp({ ...supp, support_type: e.target.value })} />
          <Textarea placeholder="Description" rows={2} value={supp.description} onChange={(e) => setSupp({ ...supp, description: e.target.value })} />
          <Button variant="outline" onClick={() => addSupp.mutate()}>Add support option</Button>
        </div>
        <div className="space-y-2 pt-3 border-t border-border/50">
          {(support.data ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <div><div className="font-medium text-sm">{s.support_type}</div><div className="text-caption">{s.description}</div></div>
              <Button variant="ghost" size="icon" onClick={() => delSupp.mutate(s.id)}><Trash2 className="size-4" /></Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* --------------------- FAQS --------------------- */
function FaqsEditor({ courseId }: { courseId: string }) {
  const qc = useQueryClient();
  const faqs = useQuery({ queryKey: ["faqs", courseId], queryFn: async () => (await supabase.from("course_faqs").select("*").eq("course_id", courseId).order("display_order")).data ?? [] });
  const [form, setForm] = useState({ question: "", answer: "" });

  const add = useMutation({
    mutationFn: async () => {
      if (!form.question.trim() || !form.answer.trim()) return;
      const order = ((faqs.data ?? []) as any[]).length + 1;
      await supabase.from("course_faqs").insert({ course_id: courseId, question: form.question, answer: form.answer, display_order: order } as any);
      setForm({ question: "", answer: "" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faqs", courseId] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { await supabase.from("course_faqs").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faqs", courseId] }),
  });

  return (
    <div className="space-y-4">
      <div className="card-elevated p-6 space-y-3">
        <h3 className="font-display font-semibold">Add FAQ</h3>
        <Input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
        <Textarea placeholder="Answer" rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
        <div><Button variant="outline" onClick={() => add.mutate()}>Add FAQ</Button></div>
      </div>
      <div className="space-y-2">
        {((faqs.data ?? []) as any[]).map((f) => (
          <div key={f.id} className="card-elevated p-4 flex items-start justify-between gap-3">
            <div><div className="font-medium">{f.question}</div><div className="text-caption mt-1">{f.answer}</div></div>
            <Button variant="ghost" size="icon" onClick={() => del.mutate(f.id)}><Trash2 className="size-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
