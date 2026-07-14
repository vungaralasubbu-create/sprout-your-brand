import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyOwnershipReviews } from "@/lib/partner/ownership-reviews.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/partner/ownership-reviews")({
  component: PartnerOwnershipReviews,
});

const STATUS_LABEL: Record<string, { label: string; tone: "warning" | "success" | "secondary" | "destructive" }> = {
  pending_review: { label: "Pending Review", tone: "warning" },
  under_review: { label: "Under Review", tone: "warning" },
  possible_duplicate: { label: "Possible Duplicate", tone: "warning" },
  disputed: { label: "Ownership Disputed", tone: "warning" },
  resolved_partner_own: { label: "Approved As Own Lead", tone: "success" },
  resolved_glintr_provided: { label: "Classified As Glintr Lead", tone: "secondary" },
  resolved_keep_existing: { label: "Existing Ownership Retained", tone: "secondary" },
  resolved_merged: { label: "Merged With Existing Lead", tone: "secondary" },
  rejected: { label: "Rejected", tone: "destructive" },
};

function PartnerOwnershipReviews() {
  const fetchList = useServerFn(listMyOwnershipReviews);
  const { data, isLoading } = useQuery({
    queryKey: ["partner-ownership-reviews"],
    queryFn: () => fetchList(),
  });

  const reviews = data?.reviews ?? [];

  return (
    <div className="p-6 lg:p-10 space-y-6">
      <div>
        <div className="text-caption font-mono uppercase tracking-widest text-primary">
          Ownership Reviews
        </div>
        <h1 className="mt-1 font-display text-2xl font-semibold">Lead Ownership Review Status</h1>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          When a lead you submit matches a mobile number that already exists in Glintr, your submission
          is sent for admin ownership review. You will see the outcome here. Existing lead details
          remain private.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead Name</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Program</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admin Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No ownership review submissions yet.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => {
                const meta = STATUS_LABEL[r.status] ?? { label: r.status, tone: "secondary" as const };
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="font-mono text-xs">{r.mobile_masked}</TableCell>
                    <TableCell>{r.program}</TableCell>
                    <TableCell className="capitalize">{r.source?.replaceAll("_", " ")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={meta.tone as any}>{meta.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {r.decided_at ? r.admin_reason ?? "—" : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
