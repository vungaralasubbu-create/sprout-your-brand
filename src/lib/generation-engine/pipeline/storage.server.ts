/**
 * Storage pipeline — persist Engine outputs.
 *
 * For image outputs, upload the base64 payload to Supabase Storage
 * ("media-library" bucket) and create a matching `media_assets` row so
 * every generated asset is discoverable from the Media Library.
 * Text/JSON outputs are stored inline on `generation_outputs`.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationOutput } from "../types";

const BUCKET = "media-library";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function persistOutput(
  supabase: SupabaseClient,
  ownerId: string,
  jobId: string,
  brandId: string | null,
  campaignId: string | null,
  output: GenerationOutput,
  prompt: string,
  model: string,
  saveToMediaLibrary: boolean,
): Promise<GenerationOutput> {
  let mediaAssetId: string | undefined;
  let publicUrl: string | undefined;
  let storagePath: string | undefined;

  const isBinary = output.kind === "image" || output.kind === "video" || output.kind === "audio" || output.kind === "pdf";
  const b64 = (output.metadata as { b64?: string } | undefined)?.b64;

  if (isBinary && b64 && saveToMediaLibrary) {
    const ext = output.kind === "image" ? "png" : output.kind === "video" ? "mp4" : output.kind === "audio" ? "mp3" : "pdf";
    const path = `${ownerId}/generation/${jobId}.${ext}`;
    const bytes = b64ToBytes(b64);
    const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: output.mimeType ?? `application/octet-stream`,
      upsert: true,
    });
    if (!upErr) {
      storagePath = path;
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
      publicUrl = signed?.signedUrl;

      const { data: asset } = await supabase.from("media_assets").insert({
        owner_id: ownerId,
        brand_id: brandId,
        campaign_id: campaignId,
        kind: output.kind,
        source: "ai-generation",
        ai_generated: true,
        ai_prompt: prompt,
        ai_model: model,
        bucket: BUCKET,
        storage_path: path,
        public_url: publicUrl,
        file_name: `${jobId}.${ext}`,
        mime_type: output.mimeType,
        size_bytes: bytes.byteLength,
        width: output.width,
        height: output.height,
        duration_seconds: output.durationSeconds,
        status: "ready",
        visibility: "private",
        metadata: { jobId, ...(output.metadata ?? {}) },
      }).select("id").maybeSingle();
      mediaAssetId = asset?.id;
    }
  }

  // Write the output row
  await supabase.from("generation_outputs").insert({
    job_id: jobId,
    owner_id: ownerId,
    output_kind: output.kind,
    media_asset_id: mediaAssetId,
    storage_path: storagePath,
    public_url: publicUrl,
    text_content: output.textContent,
    json_content: output.jsonContent as never,
    mime_type: output.mimeType,
    size_bytes: output.sizeBytes,
    width: output.width,
    height: output.height,
    duration_seconds: output.durationSeconds,
    metadata: { ...(output.metadata ?? {}), b64: undefined }, // never persist b64 twice
  });

  return { ...output, mediaAssetId, publicUrl, storagePath };
}
