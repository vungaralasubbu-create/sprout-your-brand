import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/agency/dashboard")({
  component: () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Operations Dashboard</h2>
        <p className="text-sm text-muted-foreground">Deep, real-time performance metrics across every client.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {["Revenue trend", "Client health", "AI usage"].map((t) => (
          <Card key={t} className="p-5">
            <div className="text-sm font-medium">{t}</div>
            <div className="mt-4 h-40 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
            <div className="mt-2 text-xs text-muted-foreground">Chart preview</div>
          </Card>
        ))}
      </div>
      <Card className="p-6">
        <h3 className="font-semibold">Signal feed</h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>• 3 clients approaching AI credit limit — auto-topup recommended</li>
          <li>• Vertex Labs domain pending DNS verification</li>
          <li>• Cielo University onboarding — 4 users pending activation</li>
        </ul>
      </Card>
    </div>
  ),
});
