import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/applications")({
  component: Applications,
});

const STATUSES = ["new", "contacted", "qualified", "enrolled", "rejected", "archived"] as const;

function Applications() {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_applications")
        .select("id,full_name,email,mobile,status,partner_ref,created_at,course:courses(name,slug)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("course_applications").update({ status: status as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["admin-applications"] }); },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-heading-xl font-display font-semibold">Applications</h2>
        <p className="text-muted-foreground mt-1 text-sm">{data.length} submission{data.length === 1 ? "" : "s"}.</p>
      </div>
      <div className="card-elevated overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-2/60 text-left text-caption">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Applicant</th>
              <th className="p-3">Course</th>
              <th className="p-3">Partner</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr> : null}
            {data.map((a: any) => (
              <tr key={a.id} className="border-t border-border/50">
                <td className="p-3 text-caption">{new Date(a.created_at).toLocaleDateString()}</td>
                <td className="p-3">
                  <div className="font-medium">{a.full_name}</div>
                  <div className="text-caption">{a.email} · {a.mobile}</div>
                </td>
                <td className="p-3">{a.course?.name ?? "—"}</td>
                <td className="p-3">{a.partner_ref ? <Badge variant="outline">{a.partner_ref}</Badge> : <span className="text-muted-foreground">—</span>}</td>
                <td className="p-3">
                  <Select value={a.status} onValueChange={(v) => update.mutate({ id: a.id, status: v })}>
                    <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {!isLoading && data.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No applications yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
