// publish-x: publishes a tweet, an image tweet, multiple images, or a thread
// to a connected X account. Supports the existing publishing pipeline by
// accepting a single `body` with `message`, optional `image_url` /
// `image_urls`, and optional `thread` (array of segment strings).
import { createTweet, json, preflight, uploadMedia } from "../_shared/x/x.ts";
import { decryptToken } from "../_shared/meta/crypto.ts";
import { getAdminClient, getUserFromRequest } from "../_shared/meta/auth.ts";

interface Payload {
  account_id: string;
  message?: string;
  image_url?: string;
  image_urls?: string[];
  thread?: string[];               // additional segments -> reply chain
  in_reply_to_tweet_id?: string;   // reply to an external tweet
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

    const images = [
      ...(body.image_url ? [body.image_url] : []),
      ...(Array.isArray(body.image_urls) ? body.image_urls : []),
    ].slice(0, 4);

    const hasContent = (body.message && body.message.trim().length > 0) || images.length > 0 || (body.thread && body.thread.length > 0);
    if (!hasContent) return json({ error: "message, image_url(s), or thread required" }, { status: 400 });

    const admin = getAdminClient();
    const { data: acc, error } = await admin
      .from("soc_accounts")
      .select("id, owner_id, account_external_id, access_token_ciphertext")
      .eq("id", body.account_id)
      .eq("owner_id", user.id)
      .eq("platform", "x")
      .single();
    if (error || !acc) return json({ error: "X account not found" }, { status: 404 });

    const accessToken = await decryptToken(acc.access_token_ciphertext);
    if (!accessToken) return json({ error: "Access token missing" }, { status: 500 });

    // Upload media for the root tweet.
    const mediaIds: string[] = [];
    for (const url of images) {
      try {
        mediaIds.push(await uploadMedia(accessToken, url));
      } catch (e) {
        return json({ error: `media upload failed: ${(e as Error).message}` }, { status: 502 });
      }
    }

    // Root tweet
    const rootText = body.message ?? "";
    const root = await createTweet(accessToken, {
      text: rootText,
      mediaIds: mediaIds.length ? mediaIds : undefined,
      replyToTweetId: body.in_reply_to_tweet_id,
    });

    // Thread replies
    const threadResults: { id: string; text: string }[] = [];
    let previousId = root.id;
    if (Array.isArray(body.thread) && body.thread.length > 0) {
      for (const seg of body.thread) {
        const t = await createTweet(accessToken, {
          text: seg ?? "",
          replyToTweetId: previousId,
        });
        threadResults.push(t);
        previousId = t.id;
      }
    }

    return json({ ok: true, result: { root, thread: threadResults } });
  } catch (err) {
    return json({ error: (err as Error).message }, { status: 500 });
  }
});
