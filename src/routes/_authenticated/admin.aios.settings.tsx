import { createFileRoute } from "@tanstack/react-router";
import { Settings, Shield } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/aios/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-mono uppercase tracking-[0.16em] text-primary flex items-center gap-1.5"><Settings className="size-3" /> Settings</p>
        <h1 className="mt-1 text-2xl font-semibold">AIOS settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Model routing, safety guardrails and permission rules for every AIOS agent.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-border/60 bg-white p-4">
          <h2 className="text-sm font-semibold mb-2">Model routing</h2>
          <ul className="space-y-1.5 text-[12px]">
            <li className="flex justify-between border-b border-border/40 py-1.5"><span className="text-muted-foreground">Primary chat</span><span className="font-mono">google/gemini-2.5-flash</span></li>
            <li className="flex justify-between border-b border-border/40 py-1.5"><span className="text-muted-foreground">Fallback</span><span className="font-mono">google/gemini-2.5-flash-lite</span></li>
            <li className="flex justify-between border-b border-border/40 py-1.5"><span className="text-muted-foreground">Gateway</span><span className="font-mono">Lovable AI</span></li>
            <li className="flex justify-between py-1.5"><span className="text-muted-foreground">Temperature</span><span>0.6</span></li>
          </ul>
        </div>

        <div className="rounded-lg border border-border/60 bg-white p-4">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Shield className="size-4" /> Guardrails</h2>
          <ul className="space-y-1 text-[12px] text-muted-foreground">
            <li>• No fabricated Glintr policies, guarantees or partnerships</li>
            <li>• No unsupported income or placement claims</li>
            <li>• User input wrapped and treated as untrusted</li>
            <li>• Role-scoped: no cross-tenant data</li>
            <li>• Uncertainty declared explicitly</li>
            <li>• No internal system prompts revealed</li>
          </ul>
        </div>

        <div className="rounded-lg border border-border/60 bg-white p-4 md:col-span-2">
          <h2 className="text-sm font-semibold mb-2">Permission matrix</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="text-left text-muted-foreground border-b border-border/60">
                  <th className="py-1.5 pr-3">Agent</th><th className="py-1.5 pr-3">Student</th><th className="py-1.5 pr-3">Partner</th><th className="py-1.5 pr-3">Brand</th><th className="py-1.5 pr-3">Editor</th><th className="py-1.5">Admin</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Learning Mentor", "✓","","","",""],
                  ["Career Coach", "✓","","","",""],
                  ["Sales Assistant", "","✓","","",""],
                  ["Marketing Assistant", "","✓","✓","✓",""],
                  ["Content Assistant", "","","","✓",""],
                  ["Partner Assistant", "","✓","","",""],
                  ["White Label Assistant", "","","✓","",""],
                  ["Support Assistant", "✓","✓","✓","",""],
                  ["Administrator Assistant", "","","","","✓"],
                  ["SEO & GEO Assistant", "","","","✓","✓"],
                ].map((row) => (
                  <tr key={row[0]} className="border-b border-border/40 last:border-0">
                    {row.map((cell, i) => (
                      <td key={i} className={"py-1.5 pr-3 " + (i === 0 ? "font-medium" : "text-center")}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Students cannot access admin information. Partners cannot access student data. Editors cannot access financial records unless explicitly authorized.</p>
        </div>
      </div>
    </div>
  );
}
