import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listModerationQueue, moderateItem } from "@/lib/community/community.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, EyeOff, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/community")({
  component: CommunityModeration,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">{error.message}</div>,
});

function CommunityModeration() {
  const qc = useQueryClient();
  const listFn = useServerFn(listModerationQueue);
  const modFn = useServerFn(moderateItem);
  const queue = useQuery({ queryKey: ["community-moderation"], queryFn: () => listFn() });
  const m = useMutation({
    mutationFn: (v: { target_type: "thread" | "post"; target_id: string; action: "approve" | "hide" | "delete" }) =>
      modFn({ data: v }),
    onSuccess: (_, v) => { toast.success(`${v.action}d`); qc.invalidateQueries({ queryKey: ["community-moderation"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <header>
        <h1 className="text-3xl font-bold flex items-center gap-2"><ShieldAlert className="w-7 h-7 text-amber-500" /> Community Moderation</h1>
        <p className="text-muted-foreground mt-1">AI-flagged threads and posts land here. Approve, hide, or delete.</p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-3">Threads ({queue.data?.threads.length ?? 0})</h2>
        {queue.data?.threads.length === 0 && <Card className="p-6 text-center text-muted-foreground">Queue empty.</Card>}
        <div className="space-y-2">
          {queue.data?.threads.map((t: any) => (
            <Card key={t.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === "hidden" ? "danger" : "warning"}>{t.status}</Badge>
                    {typeof t.moderation_score === "number" && (
                      <span className="text-xs text-muted-foreground">score {Number(t.moderation_score).toFixed(2)}</span>
                    )}
                    {t.moderation_reason && <span className="text-xs text-amber-600">· {t.moderation_reason}</span>}
                  </div>
                  <div className="font-semibold mt-1">{t.title}</div>
                  <div className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{t.body_md}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ target_type: "thread", target_id: t.id, action: "approve" })}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ target_type: "thread", target_id: t.id, action: "hide" })}>
                    <EyeOff className="w-4 h-4 mr-1" /> Hide
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete thread?") && m.mutate({ target_type: "thread", target_id: t.id, action: "delete" })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Posts ({queue.data?.posts.length ?? 0})</h2>
        {queue.data?.posts.length === 0 && <Card className="p-6 text-center text-muted-foreground">Queue empty.</Card>}
        <div className="space-y-2">
          {queue.data?.posts.map((p: any) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2">
                    <Badge variant={p.status === "hidden" ? "danger" : "warning"}>{p.status}</Badge>
                    {typeof p.moderation_score === "number" && (
                      <span className="text-xs text-muted-foreground">score {Number(p.moderation_score).toFixed(2)}</span>
                    )}
                    {p.moderation_reason && <span className="text-xs text-amber-600">· {p.moderation_reason}</span>}
                  </div>
                  <div className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">{p.body_md}</div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ target_type: "post", target_id: p.id, action: "approve" })}>
                    <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => m.mutate({ target_type: "post", target_id: p.id, action: "hide" })}>
                    <EyeOff className="w-4 h-4 mr-1" /> Hide
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => confirm("Delete post?") && m.mutate({ target_type: "post", target_id: p.id, action: "delete" })}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <div className="pt-4 border-t text-sm">
        <Link to="/community" className="text-primary hover:underline">Open public community →</Link>
      </div>
    </div>
  );
}
