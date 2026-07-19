// Server-only token encryption for connected social accounts.
import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

function key(): Buffer {
  const raw =
    process.env.SOCIAL_TOKEN_SECRET ||
    process.env.APP_USER_CONNECTION_KEY_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!raw) throw new Error("Missing token encryption secret");
  // Derive a 32-byte key so any-length secret works.
  return createHash("sha256").update(raw).digest();
}

export function encryptToken(plaintext: string): string {
  if (!plaintext) return "";
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptToken(stored: string | null | undefined): string {
  if (!stored) return "";
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}
