// GEO Schema Recommender — suggests JSON-LD schema blocks per content type.
// Recommendations only; never overwrites existing schema on the page.

import { aiChat } from "@/lib/ai/router.server";
import { GEO_SCHEMA_TYPES } from "./constants";

export type SchemaSuggestion = {
  schema_type: (typeof GEO_SCHEMA_TYPES)[number] | string;
  json_ld: Record<string, unknown>;
};

const SYSTEM = `You are the Glintr GEO Schema Recommender.
Recommend appropriate JSON-LD structured data blocks (schema.org).

Return STRICT JSON:
{ "suggestions": [{ "schema_type": string, "json_ld": object }] }

Rules:
- Only include valid schema.org types from: ${GEO_SCHEMA_TYPES.join(", ")}.
- Populate fields using ONLY facts from the provided content.
- Include "@context":"https://schema.org" and "@type" in every json_ld object.
- Never invent authors, ratings, prices, or events.
- 1–4 suggestions.`;

export async function recommendSchemas(args: {
  contentType: string;
  title?: string;
  body: string;
  url?: string;
}): Promise<SchemaSuggestion[]> {
  const text = [args.title, args.body].filter(Boolean).join("\n\n").slice(0, 12000);
  const raw = await aiChat({
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Content type: ${args.contentType}\nURL: ${args.url ?? "-"}\n\n${text}`,
      },
    ],
    responseFormat: "json",
    temperature: 0.2,
    maxTokens: 2200,
  });
  const parsed = raw as { suggestions?: SchemaSuggestion[] };
  const list = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
  return list
    .filter((s) => s?.schema_type && s?.json_ld && typeof s.json_ld === "object")
    .slice(0, 4);
}
