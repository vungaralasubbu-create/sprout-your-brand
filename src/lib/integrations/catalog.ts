export type IntegrationCategory =
  | "marketing" | "crm" | "sales" | "support" | "analytics" | "productivity"
  | "finance" | "storage" | "communication" | "development" | "commerce" | "ai" | "social";

export type IntegrationProvider = {
  id: string;
  name: string;
  category: IntegrationCategory;
  tagline: string;
  description: string;
  verified?: boolean;
  featured?: boolean;
  docsUrl?: string;
  aiAgent?: string;
  capabilities: string[];
  scopes?: string[];
  brandColor?: string;
};

export const CATEGORIES: { id: IntegrationCategory; label: string; icon: string }[] = [
  { id: "marketing", label: "Marketing", icon: "Megaphone" },
  { id: "crm", label: "CRM", icon: "Users" },
  { id: "sales", label: "Sales", icon: "TrendingUp" },
  { id: "support", label: "Support", icon: "LifeBuoy" },
  { id: "analytics", label: "Analytics", icon: "BarChart3" },
  { id: "productivity", label: "Productivity", icon: "Calendar" },
  { id: "finance", label: "Finance", icon: "CreditCard" },
  { id: "storage", label: "Storage", icon: "HardDrive" },
  { id: "communication", label: "Communication", icon: "MessageSquare" },
  { id: "development", label: "Development", icon: "Code2" },
  { id: "commerce", label: "Commerce", icon: "ShoppingBag" },
  { id: "ai", label: "AI", icon: "Sparkles" },
  { id: "social", label: "Social", icon: "Share2" },
];

const p = (
  id: string, name: string, category: IntegrationCategory, tagline: string,
  opts: Partial<IntegrationProvider> = {},
): IntegrationProvider => ({
  id, name, category, tagline,
  description: opts.description ?? tagline,
  capabilities: opts.capabilities ?? [],
  verified: opts.verified ?? true,
  ...opts,
});

export const PROVIDERS: IntegrationProvider[] = [
  // Social
  p("instagram", "Instagram", "social", "Publish posts, reels, and stories", { featured: true, aiAgent: "Social Agent", brandColor: "#E4405F", capabilities: ["Publish", "Insights", "Comments"] }),
  p("facebook", "Facebook", "social", "Pages, posts, and audience insights", { featured: true, aiAgent: "Social Agent", brandColor: "#1877F2", capabilities: ["Publish", "Ads", "Insights"] }),
  p("linkedin", "LinkedIn", "social", "Company page and personal posting", { featured: true, aiAgent: "Social Agent", brandColor: "#0A66C2", capabilities: ["Publish", "Company insights"] }),
  p("threads", "Threads", "social", "Meta's text-first network"),
  p("x", "X (Twitter)", "social", "Publish tweets and read timelines", { brandColor: "#000000" }),
  p("pinterest", "Pinterest", "social", "Publish pins and boards", { brandColor: "#E60023" }),
  p("tiktok", "TikTok", "social", "Publish short-form video", { brandColor: "#000000" }),
  p("youtube", "YouTube", "social", "Upload videos and read analytics", { brandColor: "#FF0000" }),
  p("snapchat", "Snapchat", "social", "Snap Ads and Spotlight"),

  // Google
  p("google_ads", "Google Ads", "marketing", "Search, Display, Performance Max", { aiAgent: "Ads Agent", featured: true, brandColor: "#4285F4" }),
  p("google_analytics", "Google Analytics", "analytics", "GA4 metrics and audiences", { aiAgent: "Analytics Agent", featured: true, brandColor: "#F9AB00" }),
  p("google_tag_manager", "Google Tag Manager", "analytics", "Tags, triggers, and variables"),
  p("google_search_console", "Google Search Console", "analytics", "Search performance and indexing", { aiAgent: "SEO Agent" }),
  p("google_business_profile", "Google Business Profile", "marketing", "Local presence and reviews"),
  p("google_drive", "Google Drive", "storage", "Files, folders, shared drives", { featured: true, brandColor: "#0F9D58" }),
  p("google_calendar", "Google Calendar", "productivity", "Events and scheduling"),
  p("google_docs", "Google Docs", "productivity", "Read and write documents"),
  p("google_sheets", "Google Sheets", "productivity", "Read and write spreadsheets"),
  p("gmail", "Gmail", "communication", "Send, read, label emails", { brandColor: "#EA4335" }),

  // Meta
  p("meta_business", "Meta Business", "marketing", "Business Manager assets"),
  p("meta_ads", "Meta Ads", "marketing", "Facebook & Instagram Ads", { aiAgent: "Ads Agent", featured: true, brandColor: "#1877F2" }),
  p("instagram_business", "Instagram Business", "social", "Business accounts and insights"),
  p("facebook_pages", "Facebook Pages", "social", "Manage multiple pages"),
  p("facebook_ads", "Facebook Ads", "marketing", "Campaigns, adsets, ads"),

  // Microsoft
  p("outlook", "Outlook", "communication", "Mail, calendar, contacts", { brandColor: "#0078D4" }),
  p("teams", "Microsoft Teams", "communication", "Channels and chat"),
  p("onedrive", "OneDrive", "storage", "Personal and business files"),
  p("sharepoint", "SharePoint", "storage", "Sites and document libraries"),
  p("azure_ad", "Azure AD / Entra ID", "productivity", "SSO and identity"),
  p("dynamics", "Dynamics 365", "crm", "Sales, marketing, service"),

  // CRM
  p("hubspot", "HubSpot", "crm", "Contacts, deals, marketing hub", { aiAgent: "CRM Agent", featured: true, brandColor: "#FF7A59" }),
  p("salesforce", "Salesforce", "crm", "Enterprise CRM platform", { aiAgent: "CRM Agent", brandColor: "#00A1E0" }),
  p("zoho_crm", "Zoho CRM", "crm", "Sales pipeline and contacts", { aiAgent: "CRM Agent" }),
  p("pipedrive", "Pipedrive", "crm", "Sales-focused pipeline CRM", { aiAgent: "CRM Agent" }),
  p("freshsales", "Freshsales", "crm", "AI-powered CRM"),
  p("monday_crm", "monday CRM", "crm", "Board-based CRM"),

  // Commerce
  p("shopify", "Shopify", "commerce", "Products, orders, customers", { featured: true, brandColor: "#96BF47" }),
  p("woocommerce", "WooCommerce", "commerce", "WordPress commerce"),
  p("magento", "Magento", "commerce", "Adobe Commerce"),
  p("bigcommerce", "BigCommerce", "commerce", "Headless commerce"),
  p("amazon", "Amazon Seller", "commerce", "Listings, orders, ads"),
  p("flipkart", "Flipkart Seller", "commerce", "India marketplace"),
  p("etsy", "Etsy", "commerce", "Shops and listings"),

  // CMS
  p("wordpress", "WordPress", "productivity", "Posts, pages, media"),
  p("webflow", "Webflow", "productivity", "CMS collections and forms"),
  p("framer", "Framer", "productivity", "Sites and CMS"),
  p("ghost", "Ghost", "productivity", "Publications and members"),
  p("wix", "Wix", "productivity", "Sites, blogs, stores"),
  p("squarespace", "Squarespace", "productivity", "Sites and commerce"),

  // Communication
  p("slack", "Slack", "communication", "Channels, DMs, workflows", { aiAgent: "Support Agent", featured: true, brandColor: "#4A154B" }),
  p("discord", "Discord", "communication", "Servers and channels"),
  p("telegram", "Telegram", "communication", "Bots and channels"),
  p("whatsapp_business", "WhatsApp Business", "communication", "Cloud API messaging", { brandColor: "#25D366" }),
  p("twilio", "Twilio", "communication", "SMS, WhatsApp, Voice"),
  p("intercom", "Intercom", "support", "Conversations and inbox", { aiAgent: "Support Agent" }),
  p("zendesk", "Zendesk", "support", "Tickets and help center", { aiAgent: "Support Agent" }),
  p("freshdesk", "Freshdesk", "support", "Support ticketing"),

  // Payments
  p("cashfree", "Cashfree", "finance", "Payments for India", { featured: true }),
  p("stripe", "Stripe", "finance", "Global payments platform", { featured: true, brandColor: "#635BFF" }),
  p("razorpay", "Razorpay", "finance", "Payments and payouts"),
  p("paypal", "PayPal", "finance", "Global checkout"),
  p("wise", "Wise", "finance", "International transfers"),
  p("paddle", "Paddle", "finance", "MoR for SaaS"),
  p("lemonsqueezy", "LemonSqueezy", "finance", "Digital products MoR"),

  // Storage
  p("dropbox", "Dropbox", "storage", "Files and Paper", { brandColor: "#0061FF" }),
  p("box", "Box", "storage", "Enterprise content cloud"),
  p("s3", "Amazon S3", "storage", "Object storage"),
  p("r2", "Cloudflare R2", "storage", "S3-compatible storage"),

  // Development
  p("github", "GitHub", "development", "Repos, PRs, actions", { aiAgent: "Engineering Agent", featured: true }),
  p("gitlab", "GitLab", "development", "Repos and pipelines"),
  p("bitbucket", "Bitbucket", "development", "Repos and pipelines"),
  p("jira", "Jira", "development", "Issues and boards"),
  p("linear", "Linear", "development", "Modern issue tracking", { aiAgent: "Engineering Agent" }),
  p("clickup", "ClickUp", "productivity", "Tasks and docs"),
  p("asana", "Asana", "productivity", "Projects and tasks"),
  p("trello", "Trello", "productivity", "Kanban boards"),

  // AI
  p("openai", "OpenAI", "ai", "GPT and Responses API", { featured: true, aiAgent: "All AI Agents", brandColor: "#10A37F" }),
  p("anthropic", "Anthropic", "ai", "Claude models", { aiAgent: "All AI Agents" }),
  p("google_gemini", "Google Gemini", "ai", "Gemini models"),
  p("mistral", "Mistral", "ai", "Open-weight models"),
  p("xai", "xAI", "ai", "Grok family"),
  p("replicate", "Replicate", "ai", "Model hosting"),
  p("fal", "Fal", "ai", "Fast inference"),
  p("runway", "Runway", "ai", "AI video generation"),
  p("elevenlabs", "ElevenLabs", "ai", "Voice AI"),
  p("ideogram", "Ideogram", "ai", "Text-to-image"),
  p("flux", "Flux", "ai", "Image models by BFL"),
];

export function getProvider(id: string) {
  return PROVIDERS.find((x) => x.id === id) ?? null;
}
