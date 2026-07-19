import { getSecret } from "../config.ts";
import { ProviderNotConfiguredError, ProviderSecretMalformedError } from "../errors.ts";

export const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";

export interface OpenAiSecretDiagnostics {
  secretExists: boolean;
  secretLength: number;
  startsWith: string;
  endsWith: string;
  malformedReasons: string[];
  authorizationHeaderShape: "Authorization: Bearer <OPENAI_API_KEY>";
}

interface OpenAiSecretState extends OpenAiSecretDiagnostics {
  value?: string;
}

export interface OpenAiErrorInfo {
  status: number;
  message: string;
  type?: string;
  code?: string | null;
  param?: string | null;
}

function safeStart(value: string): string {
  return value.slice(0, 8);
}

function safeEnd(value: string): string {
  return value.slice(-4);
}

function redactKeyLikeTokens(value: string): string {
  return value.replace(/sk-[A-Za-z0-9_-]{8,}/g, (match) => `${match.slice(0, 8)}…${match.slice(-4)}`);
}

function malformedReasons(raw: string): string[] {
  const reasons: string[] = [];

  if (raw.length === 0) {
    reasons.push("The secret value is empty.");
    return reasons;
  }
  if (raw !== raw.trim()) {
    reasons.push("The secret has leading or trailing whitespace; paste only the API key value.");
  }
  if (raw.includes("\n") || raw.includes("\r")) {
    reasons.push("The secret contains newline characters; paste it as a single line.");
  }
  if (/^OPENAI_API_KEY\s*=/.test(raw)) {
    reasons.push("The secret includes the 'OPENAI_API_KEY=' prefix; save only the key value.");
  }
  if (/^Bearer\s+/i.test(raw)) {
    reasons.push("The secret includes a 'Bearer ' prefix; save only the key value.");
  }
  if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    reasons.push("The secret is wrapped in quotes; remove the quotes.");
  }
  if (/%0A|%0D|%22|%27|%20/i.test(raw)) {
    reasons.push("The secret appears URL-encoded; paste the raw OpenAI key instead.");
  }
  if (!raw.startsWith("sk-")) {
    reasons.push("The secret must start with 'sk-'.");
  }
  if (/\s/.test(raw)) {
    reasons.push("The secret contains whitespace characters.");
  }
  if (!/^sk-[A-Za-z0-9_-]+$/.test(raw)) {
    reasons.push("The secret contains characters outside the expected OpenAI key character set.");
  }
  if (raw.length < 40) {
    reasons.push("The secret is shorter than expected for an OpenAI API key.");
  }

  return Array.from(new Set(reasons));
}

export function inspectOpenAiSecret(): OpenAiSecretState {
  const raw = getSecret("OPENAI_API_KEY");
  const value = raw ?? "";
  return {
    value: raw,
    secretExists: typeof raw === "string" && raw.length > 0,
    secretLength: value.length,
    startsWith: value ? safeStart(value) : "",
    endsWith: value ? safeEnd(value) : "",
    malformedReasons: typeof raw === "string" ? malformedReasons(raw) : [],
    authorizationHeaderShape: "Authorization: Bearer <OPENAI_API_KEY>",
  };
}

export function publicOpenAiSecretDiagnostics(): OpenAiSecretDiagnostics {
  const { value: _value, ...safe } = inspectOpenAiSecret();
  return safe;
}

export function getOpenAiAuthHeader(apiKey: string): string {
  return `Bearer ${apiKey}`;
}

export function getOpenAiSecretForAuth(): { value: string; diagnostics: OpenAiSecretDiagnostics } {
  const { value, ...diagnostics } = inspectOpenAiSecret();
  if (!value) throw new ProviderNotConfiguredError("openai");
  if (diagnostics.malformedReasons.length > 0) {
    throw new ProviderSecretMalformedError("openai", diagnostics.malformedReasons, diagnostics);
  }
  return { value, diagnostics };
}

export function isOpenAiAuthHeaderExact(apiKey: string, header: string): boolean {
  return header === `Bearer ${apiKey}` && header.startsWith("Bearer sk-") && !/[\r\n]/.test(header);
}

export async function readOpenAiError(response: Response): Promise<OpenAiErrorInfo> {
  const text = await response.text().catch(() => "");
  try {
    const parsed = JSON.parse(text) as { error?: { message?: string; type?: string; code?: string | null; param?: string | null } };
    return {
      status: response.status,
      message: redactKeyLikeTokens(parsed.error?.message ?? text.slice(0, 500) ?? `OpenAI HTTP ${response.status}`),
      type: parsed.error?.type,
      code: parsed.error?.code,
      param: parsed.error?.param,
    };
  } catch {
    return {
      status: response.status,
      message: redactKeyLikeTokens(text.slice(0, 500) || `OpenAI HTTP ${response.status}`),
    };
  }
}