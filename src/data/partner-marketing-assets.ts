// Curated marketing asset catalog for partners. No fabricated media URLs —
// these describe the assets available and provide copy-ready templates.
// Actual downloads point to admin-uploaded resources in the marketing_resources table.

export type AssetCategory =
  | "logo"
  | "poster"
  | "brochure"
  | "video"
  | "reel"
  | "social_caption"
  | "email_template"
  | "whatsapp_template"
  | "sales_deck";

export type AssetKind = "download" | "template" | "external";

export type MarketingAsset = {
  id: string;
  category: AssetCategory;
  title: string;
  description: string;
  kind: AssetKind;
  tags: string[];
  body?: string; // for copy-ready templates
  href?: string; // for external / download links (admin-controlled)
};

export const ASSET_CATEGORIES: { key: AssetCategory; label: string; hint: string }[] = [
  { key: "logo", label: "Logos", hint: "Glintr brand marks, monograms, dark/light variants" },
  { key: "poster", label: "Posters", hint: "A4 & square posters for programs" },
  { key: "brochure", label: "Brochures", hint: "Full program brochures (PDF)" },
  { key: "video", label: "Videos", hint: "Program explainer videos" },
  { key: "reel", label: "Reels", hint: "Short vertical clips for Reels / Shorts" },
  { key: "social_caption", label: "Social Captions", hint: "Copy-ready captions for Instagram, LinkedIn, X" },
  { key: "email_template", label: "Email Templates", hint: "Warm intro, follow-up, closing emails" },
  { key: "whatsapp_template", label: "WhatsApp Templates", hint: "Short, friendly WhatsApp scripts" },
  { key: "sales_deck", label: "Sales Decks", hint: "Consultation decks for closing conversations" },
];

export const MARKETING_ASSETS: MarketingAsset[] = [
  // Templates — always available regardless of admin uploads
  {
    id: "cap-ig-ai",
    category: "social_caption",
    title: "Instagram — AI programs",
    description: "Short, curiosity-led caption for AI courses",
    kind: "template",
    tags: ["instagram", "ai", "student"],
    body:
      "The tools that used to take 10 people now take one prompt.\n\nOur AI programs teach you to work like a team of ten — with ChatGPT, Claude, and Gemini.\n\nMore in bio → #GlintrLearning",
  },
  {
    id: "cap-li-mgmt",
    category: "social_caption",
    title: "LinkedIn — Management programs",
    description: "Professional post highlighting career shifts",
    kind: "template",
    tags: ["linkedin", "management", "career"],
    body:
      "Most careers stall not because of skill, but because of narrative.\n\nGlintr's Management programs help mid-career professionals rebuild both — with structured mentorship, real projects, and outcome coaching.\n\nExplore programs on glintr.com.",
  },
  {
    id: "cap-x-launch",
    category: "social_caption",
    title: "X — Launch your brand",
    description: "Concise post for entrepreneurs",
    kind: "template",
    tags: ["x", "twitter", "entrepreneur"],
    body:
      "You don't need a course. You need a business.\n\nGlintr helps you launch your own EdTech brand — with LMS, marketing, and mentorship support. Details on glintr.com/launch-your-brand.",
  },
  {
    id: "email-warm-intro",
    category: "email_template",
    title: "Warm intro — friend of a friend",
    description: "Reach out after a warm intro",
    kind: "template",
    tags: ["intro", "warm"],
    body:
      "Subject: Quick note after {mutual}'s intro\n\nHi {name},\n\n{mutual} mentioned you're exploring {program_area}. I work with Glintr, an education platform that focuses on outcome-first programs (not just certificates).\n\nWould a 15-minute call this week work? I can walk you through the two or three programs that fit your background — no pressure to enroll.\n\nWarmly,\n{partner_name}",
  },
  {
    id: "email-followup",
    category: "email_template",
    title: "Follow-up — after first conversation",
    description: "Recap and next step",
    kind: "template",
    tags: ["follow-up"],
    body:
      "Subject: Recap of our conversation\n\nHi {name},\n\nThanks for the time yesterday. Based on what you shared, {program} looks like the best fit — it aligns with your {goal} and the {duration} timeline.\n\nHere is the program page: {link}\n\nHappy to answer questions before you decide. Reply when it works for you.\n\n— {partner_name}",
  },
  {
    id: "email-close",
    category: "email_template",
    title: "Closing — enrolment step",
    description: "Move to the payment step",
    kind: "template",
    tags: ["close"],
    body:
      "Subject: Ready when you are\n\nHi {name},\n\nGlad you're moving ahead. Here is your payment link: {payment_link}\n\nOnce it's completed we schedule your onboarding and add you to the first cohort session. Let me know if anything looks unclear.\n\n— {partner_name}",
  },
  {
    id: "wa-first",
    category: "whatsapp_template",
    title: "WhatsApp — first message",
    description: "Short, human first line",
    kind: "template",
    tags: ["first-touch"],
    body:
      "Hi {name}, this is {partner_name} from Glintr. Saw you were exploring {program_area}. Would you like a quick 10-min call this week? No pressure — just to help you pick the right program.",
  },
  {
    id: "wa-nudge",
    category: "whatsapp_template",
    title: "WhatsApp — polite nudge",
    description: "Second nudge after silence",
    kind: "template",
    tags: ["nudge"],
    body:
      "Hi {name}, just checking in. Let me know if now is a bad time, happy to circle back next week. If you'd rather explore on your own here's the program: {link}",
  },
  {
    id: "wa-payment",
    category: "whatsapp_template",
    title: "WhatsApp — payment reminder",
    description: "Gentle reminder for a pending payment",
    kind: "template",
    tags: ["payment"],
    body:
      "Hi {name}, sharing your payment link again for {program}: {payment_link}. Batch starts on {date} — happy to hop on a quick call if you have questions.",
  },
  // Curated placeholders that point to admin-uploaded resources
  { id: "logo-primary", category: "logo", title: "Glintr — primary mark", description: "PNG + SVG, light backgrounds", kind: "download", tags: ["brand"] },
  { id: "logo-mono", category: "logo", title: "Glintr — monogram", description: "Square avatar for social profiles", kind: "download", tags: ["brand", "avatar"] },
  { id: "logo-dark", category: "logo", title: "Glintr — dark variant", description: "For dark backgrounds and posters", kind: "download", tags: ["brand"] },
  { id: "poster-ai", category: "poster", title: "AI programs — A4 poster", description: "Print-ready A4, showcase 3 AI programs", kind: "download", tags: ["print"] },
  { id: "poster-mgmt", category: "poster", title: "Management — A4 poster", description: "Print-ready A4, management catalog", kind: "download", tags: ["print"] },
  { id: "brochure-full", category: "brochure", title: "Master brochure — all programs", description: "12-page PDF of the full catalog", kind: "download", tags: ["pdf"] },
  { id: "brochure-ai", category: "brochure", title: "AI programs brochure", description: "4-page PDF for the AI specialisation", kind: "download", tags: ["pdf", "ai"] },
  { id: "video-intro", category: "video", title: "Glintr — 60-sec intro", description: "Short intro to Glintr's models & mission", kind: "external", tags: ["intro"] },
  { id: "reel-ai", category: "reel", title: "Reel — AI in 45 seconds", description: "Vertical reel, ready to repost", kind: "external", tags: ["reel", "ai"] },
  { id: "reel-earn", category: "reel", title: "Reel — Earn as a Partner", description: "Vertical reel for creator audiences", kind: "external", tags: ["reel", "earn"] },
  { id: "deck-consult", category: "sales_deck", title: "Consultation deck — programs", description: "10-slide deck for a 20-minute call", kind: "download", tags: ["deck"] },
  { id: "deck-brand", category: "sales_deck", title: "Consultation deck — Launch Your Brand", description: "Deck for white-label conversations", kind: "download", tags: ["deck", "brand"] },
];
