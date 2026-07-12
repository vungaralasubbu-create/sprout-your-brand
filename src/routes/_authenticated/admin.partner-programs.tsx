import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  listPartnersLite, getPartnerProgramMatrix, setPartnerEligibility, removePartnerEligibility,
} from "@/lib/admin/admin.functions";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/partner-programs")({
  validateSearch: (s: Record<string, unknown>) => ({ partner_id: (s.partner_id as string) ?? "" }),
  component: PartnerPrograms,
});

const ELIG_COLOR: Record<string, string> = {
  eligible: "bg-emerald-50 text-emerald-700 border-emerald-200",
  restricted: "bg-amber-50 text-amber-800 border-amber-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
  pending_review: "bg-sky-50 text-sky-700 border-sky-200",
};

function PartnerPrograms() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const partnersFn = useServerFn(listPartnersLite);
  const matrixFn = useServerFn(getPartnerProgramMatrix);
  const setFn = useServerFn(setPartnerEligibility);
  const removeFn = useServerFn(removePartnerEligibility);
  const qc = useQueryClient();

  const [partnerQ, setPartnerQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newStatus, setNewStatus] = useState<"eligible" | "restricted" | "suspended" | "pending_review">("eligible");
  const [reason, setReason] = useState("");

  const { data: partners = [] } = useQuery({
    queryKey: ["admin-partners-lite", partnerQ],
    queryFn: () => partnersFn({ data: { q: partnerQ } }),
  });

  const partnerId = search.partner_id;

  const { data: matrix } = useQuery({
    queryKey: ["admin-partner-matrix", partnerId],
    queryFn: () => matrixFn({ data: { partner_id: partnerId } }),
    enabled: !!partnerId,
  });

  const eligibilityMap = useMemo(() => {
    const map = new Map<string, any>();
    (matrix?.eligibility ?? []).forEach((e: any) => map.set(e.course_id, e));
    return map;
  }, [matrix]);

  const interestSet = useMemo(() => {
    const s = new Set<string>();
    (matrix?.interests ?? []).forEach((i: any) => { if (i.course_id) s.add(i.course_id); });
    return s;
  }, [matrix]);

  const applyStatus = useMutation({
    mutationFn: () => setFn({ data: { partner_id: partnerId, course_ids: [...selected], status: newStatus, reason } }),
    onSuccess: () => {
      toast.success(`Applied "${newStatus}" to ${selected.size} program${selected.size === 1 ? "" : "s"}`);
      setSelected(new Set()); setReason("");
      qc.invalidateQueries({ queryKey: ["admin-partner-matrix", partnerId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const revoke = useMutation({
    mutationFn: () => removeFn({ data: { partner_id: partnerId, course_ids: [...selected] } }),
    onSuccess: () => {
      toast.success(`Removed access for ${selected.size} program${selected.size === 1 ? "" : "s"}`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["admin-partner-matrix", partnerId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const assignAll = useMutation({
    mutationFn: () => {
      const ids = (matrix?.courses ?? []).map((c: any) => c.id);
      return setFn({ data: { partner_id: partnerId, course_ids: ids, status: "eligible" } });
    },
    onSuccess: () => {
      toast.success("Assigned all partner-eligible programs");
      qc.invalidateQueries({ queryKey: ["admin-partner-matrix", partnerId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleCategory(categoryId: string) {
    const ids = (matrix?.courses ?? []).filter((c: any) => c.category_id === categoryId).map((c: any) => c.id);
    setSelected((prev) => {
      const n = new Set(prev);
      const allIn = ids.every((id: string) => n.has(id));
      ids.forEach((id: string) => (allIn ? n.delete(id) : n.add(id)));
      return n;
    });
  }

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = {};
    (matrix?.courses ?? []).forEach((c: any) => {
      const k = c.category_id ?? "uncat";
      (g[k] ??= []).push(c);
    });
    return g;
  }, [matrix]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h2 className="text-2xl font-display font-semibold">Partner Program Eligibility</h2>
        <p className="text-muted-foreground text-sm">
          Control which programs each partner is allowed to sell. Interests do not grant selling permission.
        </p>
      </div>

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Partner picker */}
        <div className="rounded-xl border border-border/70 bg-white p-3 space-y-2 h-fit sticky top-16">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={partnerQ} onChange={(e) => setPartnerQ(e.target.value)} placeholder="Search partners" className="pl-9 h-9" />
          </div>
          <div className="max-h-[520px] overflow-y-auto divide-y divide-border/40">
            {partners.map((p: any) => {
              const active = p.id === partnerId;
              return (
                <button
                  key={p.id}
                  onClick={() => navigate({ search: { partner_id: p.id } })}
                  className={`w-full text-left px-2.5 py-2 hover:bg-surface-1/60 ${active ? "bg-primary/10" : ""}`}
                >
                  <div className="text-sm font-medium">{p.display_name ?? "Partner"}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{p.partner_code}</div>
                </button>
              );
            })}
            {partners.length === 0 && <div className="text-[12px] text-muted-foreground p-3">No partners.</div>}
          </div>
        </div>

        {/* Matrix */}
        <div className="space-y-4">
          {!partnerId && (
            <div className="rounded-xl border border-dashed p-10 text-center text-muted-foreground bg-white">
              Select a partner to manage program eligibility.
            </div>
          )}

          {partnerId && matrix && (
            <>
              <div className="rounded-xl border border-border/70 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-display font-semibold">{matrix.partner?.display_name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{matrix.partner?.partner_code}</div>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Approved model: <span className="capitalize">{(matrix.partner?.approved_sales_model ?? "not approved").replace(/_/g, " ")}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <Select value={newStatus} onValueChange={(v: any) => setNewStatus(v)}>
                    <SelectTrigger className="h-9 w-[160px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eligible">Eligible</SelectItem>
                      <SelectItem value="restricted">Restricted</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending_review">Pending Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => applyStatus.mutate()} disabled={!selected.size || applyStatus.isPending}>
                    Apply to selection ({selected.size})
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => revoke.mutate()} disabled={!selected.size}>
                    Remove access
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => assignAll.mutate()} disabled={assignAll.isPending}>
                    Assign all
                  </Button>
                </div>
              </div>

              <Input placeholder="Optional reason / note" value={reason} onChange={(e) => setReason(e.target.value)} className="h-9" />

              {matrix.categories.map((cat: any) => {
                const courses = grouped[cat.id] ?? [];
                if (!courses.length) return null;
                return (
                  <div key={cat.id} className="rounded-xl border border-border/70 bg-white overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-surface-1/50">
                      <div>
                        <div className="font-medium text-sm">{cat.name}</div>
                        <div className="text-[11px] text-muted-foreground">{courses.length} programs</div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => toggleCategory(cat.id)}>Toggle all</Button>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {courses.map((c: any) => {
                          const el = eligibilityMap.get(c.id);
                          const isSel = selected.has(c.id);
                          return (
                            <tr key={c.id} className="border-t border-border/40 hover:bg-surface-1/30">
                              <td className="pl-4 py-2 w-8">
                                <Checkbox checked={isSel} onCheckedChange={() => toggle(c.id)} />
                              </td>
                              <td className="px-3 py-2">
                                <div className="font-medium">{c.name}</div>
                                <div className="flex gap-1 mt-0.5 flex-wrap">
                                  {c.partner_sale_eligible && <Badge variant="outline" className="text-[10px]">Own leads</Badge>}
                                  {c.supported_sales_eligible && <Badge variant="outline" className="text-[10px]">Supported</Badge>}
                                  {interestSet.has(c.id) && <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Interested</Badge>}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-right">
                                {el ? (
                                  <Badge variant="outline" className={ELIG_COLOR[el.status] ?? ""}>
                                    {el.status.replace(/_/g, " ")}
                                  </Badge>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground">No access</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
