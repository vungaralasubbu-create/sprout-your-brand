import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listMySubscriptions, setMySubscription } from "@/lib/engage/subscriptions.functions";

export const Route = createFileRoute("/_authenticated/notifications/")({
  head: () => ({
    meta: [
      { title: "Notification preferences — Glintr" },
      { name: "description", content: "Choose which emails and notifications you receive from Glintr." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const listFn = useServerFn(listMySubscriptions);
  const setFn = useServerFn(setMySubscription);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["my-engage-subs"], queryFn: () => listFn({ data: {} }) });

  const flip = useMutation({
    mutationFn: (p: { category: string; is_subscribed: boolean }) =>
      setFn({ data: { category: p.category, channel: "email", is_subscribed: p.is_subscribed } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-engage-subs"] }),
    onError: () => toast.error("Couldn't update — try again"),
  });

  const categories = data?.ok ? data.categories : [];
  const subs = data?.ok ? data.subs : [];
  const isOn = (cat: string) => {
    const row = subs.find((s) => s.category === cat && s.channel === "email");
    return row ? row.is_subscribed : true;
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <div className="text-xs font-medium uppercase tracking-widest text-cyan-500">Preferences</div>
        <h1 className="mt-1 text-3xl font-bold">Notifications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose which emails you'd like to receive. Transactional messages (receipts, security alerts, password resets) will always be delivered.
        </p>
      </div>
      <Card className="divide-y">
        {categories.map((c) => (
          <div key={c.id} className="flex items-start justify-between gap-4 p-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="font-medium">{c.label}</div>
                {c.locked && <Badge variant="outline" className="text-[10px]">always on</Badge>}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{c.description}</div>
            </div>
            <Switch
              disabled={c.locked}
              checked={c.locked ? true : isOn(c.id)}
              onCheckedChange={(v) => !c.locked && flip.mutate({ category: c.id, is_subscribed: v })}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
