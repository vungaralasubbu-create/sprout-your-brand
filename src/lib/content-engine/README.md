# AI Content Engine

Backend-only content generation engine layered on top of the existing AI
Router, Prompt infrastructure, and marketing schema. No existing UI, auth,
or payment code is modified.

## Database (new)

| Table | Purpose |
|---|---|
| `ce_prompt_registry` | Named prompts (keyed) with an `active_version_id` pointer. |
| `ce_prompt_versions` | Versioned prompt templates (`version` monotonically increases per registry entry). |
| `ce_campaigns` | User campaigns: title, description, goal, audience, platforms[], status, scheduled_at, language, tone, brand. |
| `ce_generations` | Generated assets per asset type, with `parent_generation_id` chain for regeneration history and `edited` flag for manual edits. |
| `ce_templates` | Reusable campaign presets. |

RLS: campaigns/generations/templates are scoped by `owner_id` (admins bypass).
Prompt registry is readable by any authed user; writes require admin/super_admin.

## Asset types (13)

`linkedin_post`, `instagram_caption`, `facebook_caption`, `x_post`,
`telegram_post`, `whatsapp_message`, `email`, `blog_outline`, `cta`,
`hashtags`, `keywords`, `seo_title`, `meta_description`.

Each has a default prompt in `default-prompts.ts` mapped to a registry
key (e.g. `ce.linkedin_post.v1`) and a routing quality preference.

## Services (createServerFn)

`prompt-registry.functions.ts`
- `ensureDefaultPrompts`, `listPrompts`, `getPromptWithVersions`
- `createPromptVersion` (auto increments version, optionally activates)
- `activatePromptVersion`
- `resolveActivePrompt` (server-only helper, auto-falls-back to defaults)

`campaigns.functions.ts`
- `upsertCampaign`, `getCampaign`, `listCampaigns`, `deleteCampaign`
- `setCampaignStatus`
- `campaignDashboard` (counts by status + recent + scheduled + analytics)

`generation.functions.ts`
- `generateAsset` — single asset for a campaign
- `generateCampaignAll` — fan-out over all (or a subset of) asset types
- `regenerateAsset` — new row with `parent_generation_id` set
- `editGeneration` — manual edit, sets `edited=true`, `status='edited'`
- `setGenerationStatus` — draft → edited → approved → scheduled → published
- `listCampaignGenerations`, `getGenerationHistory`

`templates.functions.ts`
- `upsertTemplate`, `listTemplates`, `deleteTemplate`, `instantiateTemplate`

## Model routing

All model calls go through `executeChat()` in `@/lib/ai/router/failover.server`,
so provider fallback, retries, and health telemetry are inherited.

## Unchanged surface area

No UI files were modified. No auth middleware, no payment code, no existing
`mkt_*` tables changed. The engine coexists with `src/lib/marketing/*`.
