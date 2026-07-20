// publish-instagram: publishes an image or video post to a connected IG Business account.
// Uses the two-step IG Graph publish flow: create media container -> publish.
import { graphGet, graphPost, json, preflight } from "../_shared/meta/meta.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

interface Payload {
  account_id: string; // soc_accounts.id (platform=instagram)
  image_url?: string;
  video_url?: string;
  caption?: string;
  media_type?: "IMAGE" | "VIDEO" | "REELS";
}

async function waitContainerReady(containerId: string, token: string): Promise<void> {
  // Poll status_code up to ~30s. IMAGE containers are usually ready immediately.
  for (let i = 0; i < 15; i++) {
    const data = await graphGet(`/${containerId}`, token, { fields: "status_code,status" });
    const status = (data as { status_code?: string }).status_code;
    if (status === "FINISHED") return;
    if (status === "ERROR" || status === "EXPIRED") {
      throw new Error(`Container ${containerId} status=${status}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error(`Container ${containerId} not ready after timeout`);
}

Deno.serve(async (req) => {
  const cors = preflight(req);
  if (cors) return cors;
  if (req.method !== "POST") return json({ error: "Method not allowed" }, { status: 405 });
  try {
    const user = await getUserFromRequest(req);
    if (!user) return json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Partial<Payload>;
    if (!body.account_id) return json({ error: "account_id required" }, { status: 400 });
    if (!body.image_url && !body.video_url) {
      return json({ error: "image_url or video_url required" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, owner_id, account_external_id, access_token_ciphertext")
      .eq("id", body.account_id)
      .eq("owner_id", user.id)
      .eq("platform", "instagram")
      .single();
    if (error || !acc) return json({ error: "Instagram account not found" }, { status: 404 });

    const igUserId = acc.account_external_id;
    const token = await decryptToken(acc.access_token_ciphertext);
    if (!token) return json({ error: "Token missing" }, { status: 500 });

    // Step 1: create container
    const containerForm: Record<string, string> = {};
    if (body.image_url) containerForm.image_url = body.image_url;
    if (body.video_url) {
      containerForm.video_url = body.video_url;
      containerForm.media_type = body.media_type ?? "REELS";
    }
    if (body.caption) containerForm.caption = body.caption;

    const container = (await graphPost(
      `/${igUserId}/media`,
      token,
      containerForm,
    )) as { id: string };

    // Step 2: wait for container to be ready (video)
    if (body.video_url) await waitContainerReady(container.id, token);

    // Step 3: publish
    const published = await graphPost(`/${igUserId}/media_publish`, token, {
      creation_id: container.id,
    });

    return json({ ok: true, container_id: container.id, result: published });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
