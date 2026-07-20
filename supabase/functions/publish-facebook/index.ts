// publish-facebook: publishes a text/link/photo post to a connected FB Page.
import { graphPost, json, preflight } from "../_shared/meta/meta.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

interface Payload {
  account_id: string; // soc_accounts.id
  message?: string;
  link?: string;
  image_url?: string; // hosted image URL for photo posts
  scheduled_publish_time?: number; // unix seconds, optional
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
    if (!body.message && !body.link && !body.image_url) {
      return json({ error: "message, link, or image_url required" }, { status: 400 });
    }

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, owner_id, platform, account_external_id, access_token_ciphertext")
      .eq("id", body.account_id)
      .eq("owner_id", user.id)
      .eq("platform", "facebook")
      .single();
    if (error || !acc) return json({ error: "Facebook account not found" }, { status: 404 });

    const pageToken = await decryptToken(acc.access_token_ciphertext);
    if (!pageToken) return json({ error: "Page token missing" }, { status: 500 });

    const pageId = acc.account_external_id;
    let result: unknown;

    if (body.image_url) {
      const form: Record<string, string> = {
        url: body.image_url,
        published: body.scheduled_publish_time ? "false" : "true",
      };
      if (body.message) form.caption = body.message;
      if (body.scheduled_publish_time) {
        form.scheduled_publish_time = String(body.scheduled_publish_time);
      }
      result = await graphPost(`/${pageId}/photos`, pageToken, form);
    } else {
      const form: Record<string, string> = { message: body.message ?? "" };
      if (body.link) form.link = body.link;
      if (body.scheduled_publish_time) {
        form.published = "false";
        form.scheduled_publish_time = String(body.scheduled_publish_time);
      }
      result = await graphPost(`/${pageId}/feed`, pageToken, form);
    }

    return json({ ok: true, result });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
