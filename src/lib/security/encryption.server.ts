/**
 * Encryption Helpers (AES-256-GCM)
 * --------------------------------
 * Application-level envelope encryption for anything the server persists
 * that must not be readable via a raw DB browse (connection keys, PAT
 * tokens, personal notes, etc.). Uses `SECURITY_ENCRYPTION_KEY`
 * (base64, 32 bytes). If unavailable, falls back to
 * `APP_USER_CONNECTION_KEY_SECRET` when present (already provisioned by
 * the App User Connector integration).
 *
 * The encoded value is opaque: iv (12) | authTag (16) | ciphertext, base64.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function loadKey(): Buffer {
  const raw = process.env.SECURITY_ENCRYPTION_KEY ?? process.env.APP_USER_CONNECTION_KEY_SECRET;
  if (!raw) throw new Error("Missing SECURITY_ENCRYPTION_KEY (or APP_USER_CONNECTION_KEY_SECRET) env var");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("Encryption key must decode to 32 bytes");
  return key;
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", loadKey(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decrypt(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  if (buf.length < 28) throw new Error("Ciphertext too short");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", loadKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

/** Deterministic search index (HMAC-SHA256 hex) for encrypted columns. */
export function searchToken(value: string): string {
  // Node's crypto is already imported in this module; use HMAC-SHA256 with the same key.
  const { createHmac } = require("node:crypto") as typeof import("node:crypto");
  return createHmac("sha256", loadKey()).update(value.toLowerCase().trim()).digest("hex");
}
