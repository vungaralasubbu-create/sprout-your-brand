import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { getPublishingQueue, changeContentStatus } from "@/lib/admin/content.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONTENT_TYPE_LABEL } from "@/lib/admin/content-meta";

export const Route = createFileRoute("/_authenticated/admin/content/queue")({
  component: QueuePage,
});

function QueuePage() {
  const fn = useServerFn(getPublishingQueue);
  const statusFn = useServerFn(changeContentStatus);
  const { data, refetch } = useQuery({ queryKey: ["cms-queue"], queryFn: () => fn(), staleTime: 15_000 });

  const mut = useMutation({
    mutationFn: ({ id, status }: any) => statusFn({ data: { id, status } }),
    onSuccess: () => { toast.success("Updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  const columns = [
    { key: "in_review", title: "In Review", rows: data?.in_review ?? [], next: "approved" as const, nextLabel: "Approve" },
    { key: "approved", title: "Approved", rows: data?.approved ?? [], next: "published" as const, nextLabel: "Publish" },
    { key: "scheduled", title: "Scheduled", rows: data?.scheduled ?? [], next: "published" as const, nextLabel: "Publish now" },
  ];

  return (
    <div className="space-y-4 max-w-7xl">
      <header>
        <h1 className="font-display text-2xl font-semibold">Publishing Queue</h1>
        <p className="text-sm text-muted-foreground">Editorial workflow — review, approve and publish.</p>
      </header>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map((c) => (
          <Card key={c.key} className="p-4 space-y-2">
            <h2 className="font-medium text-sm">{c.title} <span className="text-muted-foreground">({c.rows.length})</span></h2>
            {c.rows.map((r: any) => (
              <div key={r.id} className="rounded-md border border-border/60 p-2.5 space-y-2">
                <Link to={"/admin/content/articles/$id" as any} params={{ id: r.id } as any} className="block">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {CONTENT_TYPE_LABEL[r.type]} · {r.scheduled_for ? `for ${new Date(r.scheduled_for).toLocaleString()}` : `updated ${formatDistanceToNow(new Date(r.updated_at))} ago`}
                  </div>
                </Link>
                <Button size="sm" className="w-full" onClick={() => mut.mutate({ id: r.id, status: c.next })} disabled={mut.isPending}>
                  {c.nextLabel}
                </Button>
              </div>
            ))}
            {!c.rows.length && <div className="text-xs text-muted-foreground text-center py-4">Empty</div>}
          </Card>
        ))}
      </div>
    </div>
  );
}
