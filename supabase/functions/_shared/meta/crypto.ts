// AES-256-GCM token crypto for Meta (Facebook/Instagram) edge functions.
// Format: base64(iv[12] || tag[16] || ciphertext)
// Compatible with node:crypto version in src/lib/social-automation/crypto.server.ts.

const enc = new TextEncoder();
const dec = new TextDecoder();

async function keyBytes(): Promise<Uint8Array> {
  const raw =
    Deno.env.get("SOCIAL_TOKEN_SECRET") ||
    Deno.env.get("APP_USER_CONNECTION_KEY_SECRET") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!raw) throw new Error("Missing token encryption secret");
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(raw));
  return new Uint8Array(hash);
}

async function importKey(usage: "encrypt" | "decrypt"): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    await keyBytes(),
    { name: "AES-GCM" },
    false,
    [usage],
  );
}

function b64encode(buf: Uint8Array): string {
  let s = "";
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptToken(plaintext: string): Promise<string> {
  if (!plaintext) return "";
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey("encrypt");
  const ctBuf = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plaintext)),
  );
  // WebCrypto returns ciphertext||tag; split to iv||tag||ct to match node format.
  const ct = ctBuf.slice(0, ctBuf.length - 16);
  const tag = ctBuf.slice(ctBuf.length - 16);
  const out = new Uint8Array(iv.length + tag.length + ct.length);
  out.set(iv, 0);
  out.set(tag, iv.length);
  out.set(ct, iv.length + tag.length);
  return b64encode(out);
}

export async function decryptToken(stored: string | null | undefined): Promise<string> {
  if (!stored) return "";
  const buf = b64decode(stored);
  const iv = buf.slice(0, 12);
  const tag = buf.slice(12, 28);
  const ct = buf.slice(28);
  const combined = new Uint8Array(ct.length + tag.length);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const key = await importKey("decrypt");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, combined);
  return dec.decode(pt);
}
