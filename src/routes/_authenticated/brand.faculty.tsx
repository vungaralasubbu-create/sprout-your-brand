import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/faculty")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/faculty", title: "Faculty — Glintr", noindex: true }),
  component: Faculty,
});

function Faculty() {
  const [s, setS] = useState(loadState());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);

  const add = () => {
    if (!name || !email) return;
    updateState((x) => {
      x.faculty.push({ id: `f${Date.now()}`, name, email, programs: [], role: "instructor" });
    });
    setName(""); setEmail("");
  };
  const remove = (id: string) => updateState((x) => { x.faculty = x.faculty.filter((f) => f.id !== id); });
  const setRole = (id: string, role: any) => updateState((x) => { const f = x.faculty.find((f) => f.id === id); if (f) f.role = role; });

  return (
    <>
      <BrandPageHeader eyebrow="Academy" title="Faculty" description="Instructors, mentors, and authors. Assign programs and permissions." />
      <BrandBody>
        <GlassCard>
          <h3 className="font-display font-semibold text-sm mb-3">Add faculty</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@brand.com" />
            <Button onClick={add}><Plus className="size-4 mr-1" />Add</Button>
          </div>
        </GlassCard>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {s.faculty.map((f) => (
            <GlassCard key={f.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{f.name}</div>
                  <div className="text-xs text-muted-foreground">{f.email}</div>
                </div>
                <button onClick={() => remove(f.id)} className="p-1 rounded hover:bg-red-50 text-red-500"><Trash2 className="size-4" /></button>
              </div>
              <div className="mt-3 text-xs">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Role</div>
                <div className="flex gap-1">
                  {(["instructor", "mentor", "author"] as const).map((r) => (
                    <button key={r} onClick={() => setRole(f.id, r)} className={`rounded px-2 py-1 text-[11px] capitalize border ${f.role === r ? "border-primary bg-primary/5 text-primary" : "bg-white"}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="mt-3 text-xs">
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Programs</div>
                <div className="flex flex-wrap gap-1">
                  {f.programs.length ? f.programs.map((p) => <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">{p}</span>) : <span className="text-muted-foreground italic">None assigned</span>}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </BrandBody>
    </>
  );
}
