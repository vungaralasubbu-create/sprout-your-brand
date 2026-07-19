// GEO Entity Extractor — uses centralized AI Router (OpenAI via aiChat).
// Extracts entities and returns type + salience + confidence + aliases.

import { aiChat } from "@/lib/ai/router.server";
import { GEO_ENTITY_TYPES, type GeoEntityType } from "./constants";

export type ExtractedEntity = {
  name: string;
  type: GeoEntityType | string;
  aliases: string[];
  salience: number;
  confidence: number;
  description?: string;
};

const SYSTEM = `You are the Glintr GEO Entity Extractor. Identify canonical named entities from EdTech / career content.
Return STRICT JSON: { "entities": [{"name","type","aliases","salience","confidence","description"}] }.
Valid types: ${GEO_ENTITY_TYPES.join(", ")}.
Rules:
- Deduplicate by canonical name.
- salience & confidence are 0..1 floats.
- Prefer specific technologies over generic terms.
- Include short 1-line description when useful.
- Return at most 40 entities.`;

export async function extractEntities(args: {
  title?: string;
  body: string;
  maxEntities?: number;
}): Promise<ExtractedEntity[]> {
  const text = [args.title, args.body].filter(Boolean).join("\n\n").slice(0, 12000);
  const raw = await aiChat({
    system: SYSTEM,
    messages: [{ role: "user", content: text }],
    responseFormat: "json",
    temperature: 0.2,
    maxTokens: 1800,
  });
  const parsed = raw as { entities?: ExtractedEntity[] };
  const list = Array.isArray(parsed?.entities) ? parsed.entities : [];
  const limit = args.maxEntities ?? 40;
  return list
    .filter((e) => e && typeof e.name === "string" && e.name.trim())
    .slice(0, limit)
    .map((e) => ({
      name: e.name.trim(),
      type: (GEO_ENTITY_TYPES as readonly string[]).includes(e.type as string)
        ? (e.type as GeoEntityType)
        : "concept",
      aliases: Array.isArray(e.aliases) ? e.aliases.slice(0, 8) : [],
      salience: clamp01(Number(e.salience) || 0.5),
      confidence: clamp01(Number(e.confidence) || 0.5),
      description: e.description?.toString().slice(0, 240),
    }));
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export function slugifyEntity(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
