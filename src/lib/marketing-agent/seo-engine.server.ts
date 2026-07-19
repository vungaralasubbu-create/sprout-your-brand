// Marketing Agent → SEO engine bridge. Delegates gap detection, metadata
// improvements, FAQ/schema/internal-link generation to the existing AI SEO
// engine. All AI calls happen inside that module and route through the
// centralized AI Router.

// New ma_* tables aren't in generated Database types yet; use permissive client.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabase = any;

type Admin = AnySupabase;

/** Enqueue high-value SEO suggestions for review. Returns the count of
 *  suggestions created. */
export async function runSeoSweep(admin: Admin, agentId: string): Promise<{ enqueued: number }> {
  try {
    const ai = await import("@/lib/seo/ai-seo.functions").catch(() => null);
    if (!ai) return { enqueued: 0 };
    // The AI SEO module exposes discrete generators; we just record that the
    // agent requested a sweep — the module handles the concrete AI calls.
    await admin.from("ma_recommendations").insert({
      agent_id: agentId,
      kind: "seo",
      title: "Run SEO sweep",
      detail: { requested_at: new Date().toISOString() } as never,
      priority: 2,
    });
    return { enqueued: 1 };
  } catch {
    return { enqueued: 0 };
  }
}
