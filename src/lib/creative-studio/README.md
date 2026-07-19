# Glintr AI Creative Studio (backend module)

A backend-only extension that adds an AI-powered design platform to Glintr.
It does not modify any existing UI, auth, or payment code — it registers a
new set of server functions that a future UI (or existing dashboards) can
call via TanStack RPC.

## Files

- `types.ts` — canonical design shape (`DesignLayout`, `DesignElement`,
  `DesignCopy`, `DesignPalette`, `DesignTypography`, plus the full
  `DesignFormat` catalog and `FORMAT_SPECS` sizing table).
- `layout-engine.ts` — deterministic layout builder used to normalize AI
  output and provide sensible defaults per style (minimal, modern,
  glassmorphism, luxury, …).
- `studio.functions.ts` — TanStack `createServerFn` surface. All AI calls
  go through the centralized AI Router (`aiChat`, `aiImage` in
  `src/lib/ai/ai-platform.functions.ts`).

## Database (all `cs_*`)

Applied via a single migration. RLS enforces owner isolation with an
admin/super_admin override; templates support opt-in public sharing.

| Table | Purpose |
| --- | --- |
| `cs_brand_kits`         | Unlimited brand kits per user (logo, palette, fonts, tone, watermark). |
| `cs_templates`          | Reusable design presets, per-user or shared (`is_public`). |
| `cs_folders`            | Hierarchical folders for designs. |
| `cs_designs`            | Every generated / edited design with layout + copy JSON. |
| `cs_design_versions`    | Full version history for undo/redo and rollback. |
| `cs_assets`             | Asset library — images, logos, icons, illustrations, fonts, backgrounds. |
| `cs_design_comments`    | Team comments and approvals. |
| `cs_design_analytics`   | Event log — views, exports, edits, duplicates, AI regenerations. |

## Server functions

| Domain | Exports |
| --- | --- |
| Brand Kits    | `createBrandKit`, `listBrandKits`, `updateBrandKit`, `deleteBrandKit` |
| Templates     | `listTemplates`, `saveTemplate` |
| Folders       | `listFolders`, `createFolder` |
| Designs       | `generateDesign`, `listDesigns`, `getDesign`, `updateDesign`, `duplicateDesign`, `deleteDesign` |
| Versions      | `saveDesignVersion`, `listDesignVersions`, `restoreDesignVersion` |
| Assets        | `listAssets`, `saveAsset`, `deleteAsset`, `generateAsset` |
| AI features   | `rewriteHeadline`, `generateVariations`, `generatePalette`, `generateCTA`, `resizeDesign`, `translateDesign`, `replaceBackground`, `suggestLayout`, `suggestTypography` |
| Collaboration | `addComment`, `listComments` |
| Analytics     | `trackDesignEvent`, `designAnalytics` |
| Export        | `exportDesign` (records format + URL and logs export event) |

### `generateDesign` — the primary entrypoint

```ts
await generateDesign({ data: {
  prompt: "Create an Instagram carousel promoting our AI Internship Program.",
  format: "instagram_carousel",
  style: "premium",
  category: "internships",
  brand_kit_id: "…",           // optional; auto-applied palette + fonts + watermark
  generate_image: true,        // optional; queues background art via aiImage
}});
```

Flow:

1. Load the selected Brand Kit (fonts, palette, watermark, tone of voice).
2. Ask the AI Router for structured JSON copy (headline, subheadline,
   body, CTA, bullets, hashtags, keywords) sized to the format's slide
   count.
3. Optionally generate a background image through `aiImage`.
4. Feed the copy + brand + palette into `buildLayout()` which emits a
   normalized `DesignLayout` (canvas → slides → elements) that any
   renderer or editor can consume.
5. Persist the design and seed version 1.

## Supported design formats

Instagram (post, carousel, story), Facebook (post, cover), LinkedIn (post,
carousel, banner), X post image, YouTube (thumbnail, banner), Blog
featured, Email banner, Website hero, Course/Webinar/Workshop/Event
posters, Internship + Hiring promos, Certificate, Presentation cover,
Infographic, Quote card, Flyer, Brochure, Business card, Social ad. All
formats include exact canvas dimensions in `FORMAT_SPECS`.

## Guardrails

- Every AI request is routed through the existing `executeChat` /
  `executeImage` layer, so provider failover, health telemetry, and
  fallbacks work automatically.
- No changes to UI, routing, auth, or payment code.
- All new tables have RLS enforcing `auth.uid() = owner_id`, plus an
  admin/super_admin override; grants issued for `authenticated` and
  `service_role`.
- Zero coupling to the existing `mkt_*` marketing automation or `ce_*`
  content engine modules — the Creative Studio can be consumed
  independently, or those modules can call `generateDesign` to attach a
  visual asset to a campaign.
