// Curated announcements feed. Editable list — no fabricated dates in the future.
export type Announcement = {
  id: string;
  type: "program" | "marketing" | "policy" | "training" | "platform";
  title: string;
  summary: string;
  body: string;
  publishedOn: string; // ISO date
  href?: string;
  pinned?: boolean;
};

export const ANNOUNCEMENT_TYPES: { key: Announcement["type"]; label: string }[] = [
  { key: "program", label: "New Programs" },
  { key: "marketing", label: "Marketing" },
  { key: "policy", label: "Policy" },
  { key: "training", label: "Training" },
  { key: "platform", label: "Platform" },
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a-ai-catalog",
    type: "program",
    title: "Three new AI programs are live",
    summary: "ChatGPT, Claude, and Gemini programs are now enrollable across all partner accounts.",
    body:
      "Three programs — Mastering ChatGPT, Building with Claude, and Applied Gemini AI — are now available across every partner account. All three ship with cohort delivery, mentor support, and portfolio projects. Review the program pages before your next consultation call.",
    publishedOn: "2025-01-04",
    href: "/programs/computer-science",
    pinned: true,
  },
  {
    id: "a-marketing-refresh",
    type: "marketing",
    title: "Marketing asset library refreshed",
    summary: "New posters, reels, and social captions available under Marketing Assets.",
    body:
      "The marketing library has been refreshed with new A4 posters, 6 short reels, and copy-ready captions for LinkedIn, Instagram, and X. Reuse in your own campaigns — attribution to Glintr is appreciated but not required.",
    publishedOn: "2025-01-02",
  },
  {
    id: "a-policy-payouts",
    type: "policy",
    title: "Payout cycle clarification",
    summary: "Standard payouts run monthly on eligible, unrefunded revenue.",
    body:
      "The payout cycle has always been monthly, calculated on revenue that has completed the refund window and cleared compliance. This is documented on the Payout Policy page — no changes to the policy itself. Please review before the next cycle.",
    publishedOn: "2024-12-28",
    href: "/payout-policy",
  },
  {
    id: "a-training-consult",
    type: "training",
    title: "Live training: consultation skills",
    summary: "Optional live session on running a 20-minute consultation.",
    body:
      "Partner ops is running an optional live training on consultation skills — structure, listening, closing to a decision. See your inbox for the scheduling link once dates are confirmed.",
    publishedOn: "2024-12-20",
    href: "/partner/academy/consultation-skills",
  },
  {
    id: "a-platform-mobile",
    type: "platform",
    title: "Partner mobile experience improvements",
    summary: "Lead lists, follow-ups, and payment links now flow better on small screens.",
    body:
      "We tightened the mobile experience across lead lists, follow-up manager, and payment links. Tap targets are larger and the navigation is now sticky on small screens.",
    publishedOn: "2024-12-15",
  },
];
