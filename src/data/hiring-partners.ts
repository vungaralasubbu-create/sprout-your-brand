/**
 * Category-driven hiring partners with logo resolution.
 *
 * Logos are pulled from SimpleIcons CDN (official SVG brand logos, no auth).
 * Fallback: DuckDuckGo icon service by domain. Final fallback: initials tile.
 */

export type HiringPartner = {
  /** Display name. */
  name: string;
  /** SimpleIcons slug (see simpleicons.org). */
  slug?: string;
  /** Domain for favicon fallback. */
  domain?: string;
};

/** Universal default when no category matches. */
const DEFAULT_PARTNERS: HiringPartner[] = [
  { name: "Google", slug: "google", domain: "google.com" },
  { name: "Microsoft", slug: "microsoft", domain: "microsoft.com" },
  { name: "Amazon", slug: "amazon", domain: "amazon.com" },
  { name: "Meta", slug: "meta", domain: "meta.com" },
  { name: "Apple", slug: "apple", domain: "apple.com" },
  { name: "Adobe", slug: "adobe", domain: "adobe.com" },
  { name: "NVIDIA", slug: "nvidia", domain: "nvidia.com" },
  { name: "IBM", slug: "ibm", domain: "ibm.com" },
  { name: "Oracle", slug: "oracle", domain: "oracle.com" },
  { name: "Salesforce", slug: "salesforce", domain: "salesforce.com" },
  { name: "Infosys", slug: "infosys", domain: "infosys.com" },
  { name: "Accenture", slug: "accenture", domain: "accenture.com" },
];

// Reusable brand entries.
const P = {
  google: { name: "Google", slug: "google", domain: "google.com" },
  microsoft: { name: "Microsoft", slug: "microsoft", domain: "microsoft.com" },
  amazon: { name: "Amazon", slug: "amazon", domain: "amazon.com" },
  aws: { name: "AWS", slug: "amazonwebservices", domain: "aws.amazon.com" },
  azure: { name: "Microsoft Azure", slug: "microsoftazure", domain: "azure.microsoft.com" },
  gcp: { name: "Google Cloud", slug: "googlecloud", domain: "cloud.google.com" },
  meta: { name: "Meta", slug: "meta", domain: "meta.com" },
  apple: { name: "Apple", slug: "apple", domain: "apple.com" },
  adobe: { name: "Adobe", slug: "adobe", domain: "adobe.com" },
  nvidia: { name: "NVIDIA", slug: "nvidia", domain: "nvidia.com" },
  ibm: { name: "IBM", slug: "ibm", domain: "ibm.com" },
  oracle: { name: "Oracle", slug: "oracle", domain: "oracle.com" },
  salesforce: { name: "Salesforce", slug: "salesforce", domain: "salesforce.com" },
  sap: { name: "SAP", slug: "sap", domain: "sap.com" },
  intel: { name: "Intel", slug: "intel", domain: "intel.com" },
  amd: { name: "AMD", slug: "amd", domain: "amd.com" },
  cisco: { name: "Cisco", slug: "cisco", domain: "cisco.com" },
  cloudflare: { name: "Cloudflare", slug: "cloudflare", domain: "cloudflare.com" },
  vmware: { name: "VMware", slug: "vmware", domain: "vmware.com" },
  redhat: { name: "Red Hat", slug: "redhat", domain: "redhat.com" },
  docker: { name: "Docker", slug: "docker", domain: "docker.com" },
  kubernetes: { name: "Kubernetes", slug: "kubernetes", domain: "kubernetes.io" },
  github: { name: "GitHub", slug: "github", domain: "github.com" },
  gitlab: { name: "GitLab", slug: "gitlab", domain: "gitlab.com" },
  atlassian: { name: "Atlassian", slug: "atlassian", domain: "atlassian.com" },
  hashicorp: { name: "HashiCorp", slug: "hashicorp", domain: "hashicorp.com" },
  vercel: { name: "Vercel", slug: "vercel", domain: "vercel.com" },
  netlify: { name: "Netlify", slug: "netlify", domain: "netlify.com" },
  shopify: { name: "Shopify", slug: "shopify", domain: "shopify.com" },
  stripe: { name: "Stripe", slug: "stripe", domain: "stripe.com" },
  paypal: { name: "PayPal", slug: "paypal", domain: "paypal.com" },
  openai: { name: "OpenAI", slug: "openai", domain: "openai.com" },
  anthropic: { name: "Anthropic", slug: "anthropic", domain: "anthropic.com" },
  huggingface: { name: "Hugging Face", slug: "huggingface", domain: "huggingface.co" },
  cohere: { name: "Cohere", slug: "cohere", domain: "cohere.com" },
  mistral: { name: "Mistral AI", slug: "mistralai", domain: "mistral.ai" },
  perplexity: { name: "Perplexity", slug: "perplexity", domain: "perplexity.ai" },
  deepmind: { name: "Google DeepMind", slug: "googledeepmind", domain: "deepmind.google" },
  xai: { name: "xAI", domain: "x.ai" },
  databricks: { name: "Databricks", slug: "databricks", domain: "databricks.com" },
  snowflake: { name: "Snowflake", slug: "snowflake", domain: "snowflake.com" },
  mongodb: { name: "MongoDB", slug: "mongodb", domain: "mongodb.com" },
  linkedin: { name: "LinkedIn", slug: "linkedin", domain: "linkedin.com" },
  hubspot: { name: "HubSpot", slug: "hubspot", domain: "hubspot.com" },
  workday: { name: "Workday", slug: "workday", domain: "workday.com" },
  servicenow: { name: "ServiceNow", slug: "servicenow", domain: "servicenow.com" },
  figma: { name: "Figma", slug: "figma", domain: "figma.com" },
  autodesk: { name: "Autodesk", slug: "autodesk", domain: "autodesk.com" },
  siemens: { name: "Siemens", slug: "siemens", domain: "siemens.com" },
  bosch: { name: "Bosch", slug: "bosch", domain: "bosch.com" },
  samsung: { name: "Samsung", slug: "samsung", domain: "samsung.com" },
  qualcomm: { name: "Qualcomm", slug: "qualcomm", domain: "qualcomm.com" },
  broadcom: { name: "Broadcom", slug: "broadcom", domain: "broadcom.com" },
  ti: { name: "Texas Instruments", slug: "texasinstruments", domain: "ti.com" },
  tsmc: { name: "TSMC", domain: "tsmc.com" },
  micron: { name: "Micron", domain: "micron.com" },
  mediatek: { name: "MediaTek", slug: "mediatek", domain: "mediatek.com" },
  nxp: { name: "NXP", slug: "nxp", domain: "nxp.com" },
  stm: { name: "STMicroelectronics", slug: "stmicroelectronics", domain: "st.com" },
  honeywell: { name: "Honeywell", slug: "honeywell", domain: "honeywell.com" },
  abb: { name: "ABB", slug: "abb", domain: "abb.com" },
  schneider: { name: "Schneider Electric", slug: "schneiderelectric", domain: "se.com" },
  tesla: { name: "Tesla", slug: "tesla", domain: "tesla.com" },
  bostondynamics: { name: "Boston Dynamics", domain: "bostondynamics.com" },
  fanuc: { name: "Fanuc", domain: "fanuc.com" },
  kuka: { name: "KUKA", domain: "kuka.com" },
  hyundairobotics: { name: "Hyundai Robotics", domain: "hyundai-robotics.com" },
  amazonrobotics: { name: "Amazon Robotics", domain: "amazon.jobs" },
  paloalto: { name: "Palo Alto Networks", slug: "paloaltosoftware", domain: "paloaltonetworks.com" },
  fortinet: { name: "Fortinet", slug: "fortinet", domain: "fortinet.com" },
  crowdstrike: { name: "CrowdStrike", slug: "crowdstrike", domain: "crowdstrike.com" },
  checkpoint: { name: "Check Point", domain: "checkpoint.com" },
  rapid7: { name: "Rapid7", domain: "rapid7.com" },
  trendmicro: { name: "Trend Micro", slug: "trendmicro", domain: "trendmicro.com" },
  infosys: { name: "Infosys", slug: "infosys", domain: "infosys.com" },
  tcs: { name: "TCS", slug: "tatasteel", domain: "tcs.com" },
  wipro: { name: "Wipro", slug: "wipro", domain: "wipro.com" },
  hcl: { name: "HCLTech", slug: "hcl", domain: "hcltech.com" },
  capgemini: { name: "Capgemini", slug: "capgemini", domain: "capgemini.com" },
  accenture: { name: "Accenture", slug: "accenture", domain: "accenture.com" },
  cognizant: { name: "Cognizant", slug: "cognizant", domain: "cognizant.com" },
  techmahindra: { name: "Tech Mahindra", domain: "techmahindra.com" },
  deloitte: { name: "Deloitte", slug: "deloitte", domain: "deloitte.com" },
  ey: { name: "EY", slug: "ey", domain: "ey.com" },
  pwc: { name: "PwC", slug: "pwc", domain: "pwc.com" },
  kpmg: { name: "KPMG", slug: "kpmg", domain: "kpmg.com" },
  zoho: { name: "Zoho", slug: "zoho", domain: "zoho.com" },
  freshworks: { name: "Freshworks", slug: "freshworks", domain: "freshworks.com" },
  flipkart: { name: "Flipkart", slug: "flipkart", domain: "flipkart.com" },
  phonepe: { name: "PhonePe", slug: "phonepe", domain: "phonepe.com" },
  paytm: { name: "Paytm", slug: "paytm", domain: "paytm.com" },
  swiggy: { name: "Swiggy", slug: "swiggy", domain: "swiggy.com" },
  zomato: { name: "Zomato", slug: "zomato", domain: "zomato.com" },
  meesho: { name: "Meesho", domain: "meesho.com" },
  uber: { name: "Uber", slug: "uber", domain: "uber.com" },
  netflix: { name: "Netflix", slug: "netflix", domain: "netflix.com" },
  spotify: { name: "Spotify", slug: "spotify", domain: "spotify.com" },
  airbnb: { name: "Airbnb", slug: "airbnb", domain: "airbnb.com" },
  visa: { name: "Visa", slug: "visa", domain: "visa.com" },
  mastercard: { name: "Mastercard", slug: "mastercard", domain: "mastercard.com" },
  amex: { name: "American Express", slug: "americanexpress", domain: "americanexpress.com" },
  goldman: { name: "Goldman Sachs", slug: "goldmansachs", domain: "goldmansachs.com" },
  jpmc: { name: "JPMorgan", domain: "jpmorgan.com" },
  ms: { name: "Morgan Stanley", domain: "morganstanley.com" },
  bofa: { name: "Bank of America", slug: "bankofamerica", domain: "bankofamerica.com" },
  citi: { name: "Citi", slug: "citigroup", domain: "citigroup.com" },
  barclays: { name: "Barclays", slug: "barclays", domain: "barclays.com" },
  hsbc: { name: "HSBC", slug: "hsbc", domain: "hsbc.com" },
  ubs: { name: "UBS", domain: "ubs.com" },
  nomura: { name: "Nomura", domain: "nomura.com" },
  db: { name: "Deutsche Bank", slug: "deutschebank", domain: "db.com" },
  aecom: { name: "AECOM", domain: "aecom.com" },
  jacobs: { name: "Jacobs", domain: "jacobs.com" },
  fluor: { name: "Fluor", domain: "fluor.com" },
  bechtel: { name: "Bechtel", domain: "bechtel.com" },
  lnt: { name: "L&T", domain: "larsentoubro.com" },
  tataprojects: { name: "Tata Projects", domain: "tataprojects.com" },
  digitalocean: { name: "DigitalOcean", slug: "digitalocean", domain: "digitalocean.com" },
  dell: { name: "Dell", slug: "dell", domain: "dell.com" },
  hpe: { name: "HPE", slug: "hp", domain: "hpe.com" },
};

const CATEGORY_PARTNERS: Record<string, HiringPartner[]> = {
  "artificial-intelligence": [
    P.openai, P.anthropic, P.deepmind, P.microsoft, P.meta, P.nvidia,
    P.aws, P.ibm, P.cohere, P.huggingface, P.mistral, P.perplexity,
    P.xai, P.databricks, P.snowflake,
  ],
  "machine-learning": [
    P.google, P.microsoft, P.amazon, P.ibm, P.nvidia, P.databricks,
    P.snowflake, P.intel, P.amd, P.oracle, P.sap, P.meta,
  ],
  "data-science": [
    P.google, P.amazon, P.microsoft, P.databricks, P.snowflake,
    P.oracle, P.sap, P.ibm, P.adobe, P.flipkart, P.phonepe, P.swiggy, P.uber,
  ],
  "data-analytics": [
    P.deloitte, P.ey, P.pwc, P.kpmg, P.accenture, P.infosys, P.tcs,
    P.wipro, P.capgemini, P.cognizant, P.zoho, P.freshworks,
  ],
  "cyber-security": [
    P.cisco, P.paloalto, P.fortinet, P.cloudflare, P.crowdstrike,
    P.ibm, P.microsoft, P.gcp, P.aws, P.checkpoint, P.rapid7, P.trendmicro,
  ],
  "web-development": [
    P.google, P.microsoft, P.github, P.gitlab, P.vercel, P.netlify,
    P.cloudflare, P.shopify, P.adobe, P.stripe, P.paypal, P.atlassian,
  ],
  "full-stack-development": [
    P.google, P.microsoft, P.amazon, P.github, P.gitlab, P.cloudflare,
    P.vercel, P.netlify, P.stripe, P.salesforce, P.oracle, P.adobe,
  ],
  "app-development": [
    P.google, P.apple, P.samsung, P.phonepe, P.paytm, P.flipkart,
    P.swiggy, P.zomato, P.uber, P.netflix, P.spotify, P.airbnb,
  ],
  "cloud-computing": [
    P.aws, P.azure, P.gcp, P.oracle, P.ibm, P.vmware, P.redhat,
    P.cisco, P.dell, P.hpe, P.cloudflare, P.digitalocean,
  ],
  devops: [
    P.docker, P.kubernetes, P.github, P.gitlab, P.redhat, P.aws,
    P.azure, P.gcp, P.hashicorp, P.atlassian, P.cloudflare,
  ],
  vlsi: [
    P.intel, P.amd, P.nvidia, P.qualcomm, P.broadcom, P.ti,
    P.samsung, P.tsmc, P.micron, P.mediatek,
  ],
  "embedded-systems": [
    P.bosch, P.siemens, P.honeywell, P.abb, P.intel, P.nxp,
    P.stm, P.ti, P.qualcomm, P.schneider,
  ],
  robotics: [
    P.tesla, P.bostondynamics, P.abb, P.fanuc, P.siemens, P.bosch,
    P.kuka, P.nvidia, P.amazonrobotics, P.hyundairobotics,
  ],
  iot: [
    P.cisco, P.bosch, P.intel, P.qualcomm, P.aws, P.azure,
    P.gcp, P.siemens, P.honeywell, P.ibm,
  ],
  autocad: [
    P.autodesk, P.lnt, P.tataprojects, P.aecom, P.jacobs, P.bosch,
    P.siemens, P.fluor, P.bechtel,
  ],
  "digital-marketing": [
    P.google, P.meta, P.adobe, P.hubspot, P.salesforce, P.linkedin,
    P.amazon, P.flipkart, P.swiggy, P.zomato, P.phonepe, P.meesho,
  ],
  hr: [
    P.linkedin, P.workday, P.sap, P.oracle, P.zoho, P.freshworks,
    P.deloitte, P.ey, P.pwc, P.kpmg,
  ],
  finance: [
    P.goldman, P.jpmc, P.ms, P.deloitte, P.ey, P.pwc, P.kpmg,
    P.amex, P.visa, P.mastercard, P.paypal, P.stripe,
  ],
  "investment-banking": [
    P.goldman, P.jpmc, P.ms, P.bofa, P.citi, P.barclays,
    P.hsbc, P.ubs, P.nomura, P.db,
  ],
  "product-management": [
    P.google, P.microsoft, P.amazon, P.meta, P.adobe, P.salesforce,
    P.atlassian, P.freshworks, P.zoho, P.flipkart, P.phonepe, P.swiggy,
  ],
  "ui-ux": [
    P.google, P.adobe, P.figma, P.microsoft, P.apple, P.meta,
    P.netflix, P.airbnb, P.spotify, P.atlassian,
  ],
};

// Aliases (older slugs → canonical).
const CATEGORY_ALIASES: Record<string, string> = {
  ai: "artificial-intelligence",
  ml: "machine-learning",
  cybersecurity: "cyber-security",
  security: "cyber-security",
  web: "web-development",
  fullstack: "full-stack-development",
  "full-stack": "full-stack-development",
  mobile: "app-development",
  app: "app-development",
  cloud: "cloud-computing",
  "internet-of-things": "iot",
  marketing: "digital-marketing",
  banking: "investment-banking",
  finance: "finance",
  product: "product-management",
  ux: "ui-ux",
  uiux: "ui-ux",
  design: "ui-ux",
};

/**
 * Resolve hiring partners for one or more category slugs.
 * Deduplicates by name and falls back to a curated default.
 */
export function getHiringPartnersForCategory(
  categorySlug?: string | null,
  extraSlugs: string[] = [],
): HiringPartner[] {
  const slugs = [categorySlug, ...extraSlugs]
    .filter((s): s is string => !!s)
    .map((s) => s.toLowerCase().trim())
    .map((s) => CATEGORY_ALIASES[s] ?? s);

  const merged: HiringPartner[] = [];
  const seen = new Set<string>();
  for (const slug of slugs) {
    const list = CATEGORY_PARTNERS[slug];
    if (!list) continue;
    for (const p of list) {
      const key = p.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(p);
    }
  }
  if (merged.length === 0) return DEFAULT_PARTNERS;
  return merged;
}

/** SimpleIcons CDN URL for a brand slug. */
export function simpleIconUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}

/** DuckDuckGo favicon fallback by domain. */
export function faviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}
