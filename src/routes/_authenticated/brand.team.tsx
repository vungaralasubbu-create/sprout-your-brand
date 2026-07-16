import { createFileRoute } from "@tanstack/react-router";
import { BrandPageHeader, BrandBody, GlassCard } from "@/components/brand-os/brand-shell";
import { loadState, updateState } from "@/lib/brand-os/storage";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Shield } from "lucide-react";
import { buildPageHead } from "@/lib/seo-head";

export const Route = createFileRoute("/_authenticated/brand/team")({
  ssr: false,
  head: () => buildPageHead({ path: "/brand/team", title: "Team & Roles — Glintr", description: "White Label OS", noindex: true }),
  component: Team,
});

const ROLES = ["owner", "admin", "manager", "faculty", "support", "marketing"] as const;

const PERMS: Record<(typeof ROLES)[number], string[]> = {
  owner: ["Full access", "Billing", "Delete workspace"],
  admin: ["Manage team", "Manage LMS", "Manage brand", "Publish content"],
  manager: ["Manage students", "Manage courses", "View analytics"],
  faculty: ["Manage assigned programs", "Issue certificates"],
  support: ["Manage tickets", "View students"],
  marketing: ["Marketing center", "Communications", "Website"],
};

function Team() {
  const [s, setS] = useState(loadState());
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [role, setRole] = useState<(typeof ROLES)[number]>("manager");
  useEffect(() => {
    const h = () => setS(loadState()); window.addEventListener("brand-os:update", h);
    return () => window.removeEventListener("brand-os:update", h);
  }, []);
  const add = () => { if (!name || !email) return; updateState((x) => { x.team.push({ id: `u${Date.now()}`, name, email, role }); }); setName(""); setEmail(""); };
  const remove = (id: string) => updateState((x) => { x.team = x.team.filter((m) => m.id !== id); });
  const setUserRole = (id: string, r: (typeof ROLES)[number]) => updateState((x) => { const u = x.team.find((m) => m.id === id); if (u) u.role = r; });

  return (
    <>
      <BrandPageHeader eyebrow="Workspace" title="Team & roles" description="Invite team members and control what they can do." />
      <BrandBody>
        <GlassCard>
          <h3 className="font-display font-semibold text-sm mb-3">Invite member</h3>
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_180px_auto]">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@brand.com" />
            <select value={role} onChange={(e) => setRole(e.target.value as any)} className="rounded-md border h-10 px-2 text-sm">
              {ROLES.filter((r) => r !== "owner").map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
            <Button onClick={add}><Plus className="size-4 mr-1" />Invite</Button>
          </div>
        </GlassCard>

        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <GlassCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-slate-50/40">
                  <tr><th className="text-left px-4 py-2.5">Member</th><th className="text-left px-4 py-2.5">Role</th><th></th></tr>
                </thead>
                <tbody>
                  {s.team.map((m) => (
                    <tr key={m.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <select value={m.role} disabled={m.role === "owner"} onChange={(e) => setUserRole(m.id, e.target.value as any)} className="rounded-md border h-8 px-2 text-xs capitalize">
                          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {m.role !== "owner" && (
                          <button onClick={() => remove(m.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="size-4" /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="size-4" />Role permissions</h3>
            <div className="space-y-3">
              {ROLES.map((r) => (
                <div key={r}>
                  <div className="text-xs font-medium capitalize">{r}</div>
                  <ul className="mt-1 text-xs text-muted-foreground space-y-0.5">
                    {PERMS[r].map((p) => <li key={p}>· {p}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </BrandBody>
    </>
  );
}
