-- =====================================================================
-- Template Marketplace
-- =====================================================================
DO $$ BEGIN
  CREATE TYPE public.tpl_status AS ENUM ('draft','pending_review','approved','rejected','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tpl_difficulty AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Categories
CREATE TABLE IF NOT EXISTS public.tpl_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  kind text NOT NULL DEFAULT 'industry', -- 'industry' | 'goal' | 'channel' | 'format'
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.tpl_categories TO anon, authenticated;
GRANT ALL ON public.tpl_categories TO service_role;
ALTER TABLE public.tpl_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_cat public read" ON public.tpl_categories FOR SELECT USING (is_active = true);
CREATE POLICY "tpl_cat admin all" ON public.tpl_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Templates
CREATE TABLE IF NOT EXISTS public.tpl_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  tagline text,
  description text,
  cover_image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  status tpl_status NOT NULL DEFAULT 'draft',
  visibility text NOT NULL DEFAULT 'public',  -- 'public' | 'workspace' | 'private'
  workspace_id uuid,                          -- null for public/global templates
  author_id uuid,                             -- null for platform-authored
  author_display_name text,
  is_official boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  is_trending boolean NOT NULL DEFAULT false,
  is_editors_choice boolean NOT NULL DEFAULT false,
  is_enterprise_ready boolean NOT NULL DEFAULT false,
  is_agency_pick boolean NOT NULL DEFAULT false,
  industry text[] NOT NULL DEFAULT '{}',
  goals text[] NOT NULL DEFAULT '{}',
  channels text[] NOT NULL DEFAULT '{}',
  ai_agents text[] NOT NULL DEFAULT '{}',
  languages text[] NOT NULL DEFAULT '{english}',
  campaign_length_days int,
  difficulty tpl_difficulty NOT NULL DEFAULT 'beginner',
  estimated_time_minutes int NOT NULL DEFAULT 5,
  estimated_credits int NOT NULL DEFAULT 500,
  included_assets text[] NOT NULL DEFAULT '{}',  -- 'strategy','posts','images','videos','emails','landing','forms','automation','calendar','analytics'
  prompts jsonb NOT NULL DEFAULT '{}'::jsonb,    -- {strategy,content,image,video,email,landing,workflow,analytics}
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{key,label,type,required,default,help}]
  tags text[] NOT NULL DEFAULT '{}',
  price_inr numeric(10,2) NOT NULL DEFAULT 0,
  license text NOT NULL DEFAULT 'standard',
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count int NOT NULL DEFAULT 0,
  downloads_count int NOT NULL DEFAULT 0,
  usage_count int NOT NULL DEFAULT 0,
  favorites_count int NOT NULL DEFAULT 0,
  version int NOT NULL DEFAULT 1,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tpl_templates_status_idx ON public.tpl_templates(status);
CREATE INDEX IF NOT EXISTS tpl_templates_industry_idx ON public.tpl_templates USING gin(industry);
CREATE INDEX IF NOT EXISTS tpl_templates_goals_idx ON public.tpl_templates USING gin(goals);
CREATE INDEX IF NOT EXISTS tpl_templates_channels_idx ON public.tpl_templates USING gin(channels);
CREATE INDEX IF NOT EXISTS tpl_templates_tags_idx ON public.tpl_templates USING gin(tags);
CREATE INDEX IF NOT EXISTS tpl_templates_author_idx ON public.tpl_templates(author_id);
CREATE INDEX IF NOT EXISTS tpl_templates_workspace_idx ON public.tpl_templates(workspace_id);
GRANT SELECT, INSERT, UPDATE ON public.tpl_templates TO authenticated;
GRANT SELECT ON public.tpl_templates TO anon;
GRANT ALL ON public.tpl_templates TO service_role;
ALTER TABLE public.tpl_templates ENABLE ROW LEVEL SECURITY;
-- Public: approved public templates browsable by all
CREATE POLICY "tpl public read" ON public.tpl_templates FOR SELECT
  USING (status = 'approved' AND visibility = 'public');
-- Author: read/write own
CREATE POLICY "tpl author read" ON public.tpl_templates FOR SELECT TO authenticated
  USING (author_id = auth.uid());
CREATE POLICY "tpl author insert" ON public.tpl_templates FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND is_official = false);
CREATE POLICY "tpl author update draft" ON public.tpl_templates FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND status IN ('draft','pending_review','rejected'))
  WITH CHECK (author_id = auth.uid());
-- Workspace scope
CREATE POLICY "tpl workspace read" ON public.tpl_templates FOR SELECT TO authenticated
  USING (visibility = 'workspace' AND workspace_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.mc_workspace_members m
                WHERE m.workspace_id = tpl_templates.workspace_id AND m.user_id = auth.uid()));
-- Admin
CREATE POLICY "tpl admin all" ON public.tpl_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Versions
CREATE TABLE IF NOT EXISTS public.tpl_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.tpl_templates(id) ON DELETE CASCADE,
  version int NOT NULL,
  snapshot jsonb NOT NULL,
  changelog text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, version)
);
GRANT SELECT, INSERT ON public.tpl_versions TO authenticated;
GRANT ALL ON public.tpl_versions TO service_role;
ALTER TABLE public.tpl_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_v read" ON public.tpl_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tpl_templates t WHERE t.id = tpl_versions.template_id
                AND (t.author_id = auth.uid() OR (t.status='approved' AND t.visibility='public')
                     OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))));

-- Variables (separate table so admins can also curate a shared variable dictionary)
CREATE TABLE IF NOT EXISTS public.tpl_variables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  input_type text NOT NULL DEFAULT 'text',  -- text | textarea | select | color | number | url | email
  help text,
  options jsonb,
  is_system boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.tpl_variables TO anon, authenticated;
GRANT ALL ON public.tpl_variables TO service_role;
ALTER TABLE public.tpl_variables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_var public read" ON public.tpl_variables FOR SELECT USING (true);

-- Reviews
CREATE TABLE IF NOT EXISTS public.tpl_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.tpl_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  is_verified boolean NOT NULL DEFAULT false,
  helpful_votes int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_id, user_id)
);
CREATE INDEX IF NOT EXISTS tpl_reviews_tpl_idx ON public.tpl_reviews(template_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tpl_reviews TO authenticated;
GRANT SELECT ON public.tpl_reviews TO anon;
GRANT ALL ON public.tpl_reviews TO service_role;
ALTER TABLE public.tpl_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_rev public read" ON public.tpl_reviews FOR SELECT USING (true);
CREATE POLICY "tpl_rev insert own" ON public.tpl_reviews FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "tpl_rev update own" ON public.tpl_reviews FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "tpl_rev delete own or admin" ON public.tpl_reviews FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- Downloads / usage
CREATE TABLE IF NOT EXISTS public.tpl_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.tpl_templates(id) ON DELETE CASCADE,
  user_id uuid,
  workspace_id uuid,
  action text NOT NULL DEFAULT 'download',   -- 'view' | 'download' | 'use'
  project_id uuid,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tpl_dl_tpl_idx ON public.tpl_downloads(template_id, created_at DESC);
GRANT SELECT, INSERT ON public.tpl_downloads TO authenticated;
GRANT ALL ON public.tpl_downloads TO service_role;
ALTER TABLE public.tpl_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_dl own read" ON public.tpl_downloads FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "tpl_dl insert" ON public.tpl_downloads FOR INSERT TO authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Favorites
CREATE TABLE IF NOT EXISTS public.tpl_favorites (
  user_id uuid NOT NULL,
  template_id uuid NOT NULL REFERENCES public.tpl_templates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, template_id)
);
GRANT SELECT, INSERT, DELETE ON public.tpl_favorites TO authenticated;
GRANT ALL ON public.tpl_favorites TO service_role;
ALTER TABLE public.tpl_favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_fav own" ON public.tpl_favorites FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Collections
CREATE TABLE IF NOT EXISTS public.tpl_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  cover_image_url text,
  owner_id uuid,
  is_public boolean NOT NULL DEFAULT true,
  template_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tpl_collections TO authenticated;
GRANT SELECT ON public.tpl_collections TO anon;
GRANT ALL ON public.tpl_collections TO service_role;
ALTER TABLE public.tpl_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_col public read" ON public.tpl_collections FOR SELECT USING (is_public OR owner_id = auth.uid());
CREATE POLICY "tpl_col own write" ON public.tpl_collections FOR ALL TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Usage (per-generation record)
CREATE TABLE IF NOT EXISTS public.tpl_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.tpl_templates(id) ON DELETE CASCADE,
  user_id uuid,
  workspace_id uuid,
  project_id uuid,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tpl_usage_tpl_idx ON public.tpl_usage(template_id, created_at DESC);
GRANT SELECT, INSERT ON public.tpl_usage TO authenticated;
GRANT ALL ON public.tpl_usage TO service_role;
ALTER TABLE public.tpl_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tpl_use own read" ON public.tpl_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE POLICY "tpl_use insert" ON public.tpl_usage FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Rating aggregation trigger
CREATE OR REPLACE FUNCTION public.tpl_recalc_rating() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _tid uuid;
BEGIN
  _tid := COALESCE(NEW.template_id, OLD.template_id);
  UPDATE public.tpl_templates t
     SET rating_avg = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.tpl_reviews r WHERE r.template_id = _tid), 0),
         rating_count = (SELECT COUNT(*) FROM public.tpl_reviews r WHERE r.template_id = _tid),
         updated_at = now()
   WHERE t.id = _tid;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS tpl_rev_after ON public.tpl_reviews;
CREATE TRIGGER tpl_rev_after AFTER INSERT OR UPDATE OR DELETE ON public.tpl_reviews
  FOR EACH ROW EXECUTE FUNCTION public.tpl_recalc_rating();

-- Updated-at
CREATE OR REPLACE FUNCTION public.tpl_touch() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS tpl_templates_touch ON public.tpl_templates;
CREATE TRIGGER tpl_templates_touch BEFORE UPDATE ON public.tpl_templates
  FOR EACH ROW EXECUTE FUNCTION public.tpl_touch();

-- =====================================================================
-- Seed categories
-- =====================================================================
INSERT INTO public.tpl_categories (slug,name,kind,sort_order) VALUES
  -- Goals
  ('social-media','Social Media','goal',10),
  ('product-launch','Product Launch','goal',20),
  ('lead-generation','Lead Generation','goal',30),
  ('email-marketing','Email Marketing','goal',40),
  ('seo','SEO','goal',50),
  ('content-marketing','Content Marketing','goal',60),
  -- Channels
  ('youtube','YouTube','channel',110),
  ('instagram','Instagram','channel',120),
  ('linkedin','LinkedIn','channel',130),
  ('facebook','Facebook','channel',140),
  ('google-ads','Google Ads','channel',150),
  ('meta-ads','Meta Ads','channel',160),
  -- Industries
  ('course-launch','Course Launch','industry',210),
  ('startup','Startup','industry',220),
  ('agency','Agency','industry',230),
  ('real-estate','Real Estate','industry',240),
  ('healthcare','Healthcare','industry',250),
  ('education','Education','industry',260),
  ('restaurant','Restaurant','industry',270),
  ('gym','Gym & Fitness','industry',280),
  ('law-firm','Law Firm','industry',290),
  ('finance','Finance','industry',300),
  ('saas','SaaS','industry',310),
  ('ecommerce','E-commerce','industry',320),
  ('recruitment','Recruitment','industry',330),
  ('hr','HR','industry',340),
  -- Formats
  ('events','Events','format',410),
  ('webinars','Webinars','format',420),
  ('festivals','Festivals','format',430),
  ('seasonal','Seasonal Campaigns','format',440)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================================
-- Seed variable dictionary
-- =====================================================================
INSERT INTO public.tpl_variables(key,label,input_type,help,sort_order) VALUES
 ('business_name','Business Name','text','The name of your business',10),
 ('website','Website','url','Primary website URL',20),
 ('industry','Industry','text','Your primary industry',30),
 ('target_audience','Target Audience','textarea','Who are you selling to?',40),
 ('brand_colors','Brand Colors','text','Comma-separated hex colors',50),
 ('primary_cta','Primary CTA','text','e.g., Book a demo',60),
 ('phone','Phone','text',null,70),
 ('email','Contact Email','email',null,80),
 ('location','Location','text','City / country',90),
 ('budget','Campaign Budget','text','e.g., ₹50,000 / month',100),
 ('campaign_duration','Campaign Duration','text','e.g., 30 days',110),
 ('language','Language','text','Default: English',120),
 ('brand_voice','Brand Voice','select','Professional / Friendly / Luxury / Corporate / Playful',130)
ON CONFLICT (key) DO NOTHING;

-- =====================================================================
-- Seed 12 launch templates
-- =====================================================================
INSERT INTO public.tpl_templates
  (slug,title,tagline,description,status,visibility,is_official,is_verified,is_featured,is_editors_choice,
   industry,goals,channels,ai_agents,included_assets,difficulty,estimated_time_minutes,estimated_credits,
   campaign_length_days,tags,prompts,variables,author_display_name,approved_at)
VALUES
('saas-launch-30day','SaaS Launch — 30-Day Blitz','Full 30-day launch campaign for a new SaaS product','A complete product-launch campaign with strategy, positioning, 30 social posts, launch email sequence, landing page, and analytics tracking.','approved','public',true,true,true,true,
 ARRAY['saas','startup'],ARRAY['product-launch','lead-generation'],ARRAY['linkedin','twitter','email','landing'],
 ARRAY['strategist','copywriter','designer','email','seo'],
 ARRAY['strategy','posts','images','emails','landing','forms','calendar','analytics'],
 'intermediate',6,1200,30,
 ARRAY['saas','launch','b2b','feature'],
 '{"strategy":"Design a 30-day launch strategy for {{business_name}} — a {{industry}} product targeting {{target_audience}}. Highlight positioning, ICP, differentiation, and week-by-week milestones.",
   "content":"Write 30 daily LinkedIn + Twitter posts introducing {{business_name}}. Voice: {{brand_voice}}. CTA: {{primary_cta}}.",
   "image":"Create hero visuals for {{business_name}} using brand colors {{brand_colors}} — modern SaaS aesthetic.",
   "email":"Write a 5-part launch email sequence for {{business_name}} to warm up subscribers and drive {{primary_cta}}.",
   "landing":"Design a conversion-focused launch landing page for {{business_name}}. Include hero, features, social proof, pricing teaser, and CTA to {{primary_cta}}.",
   "workflow":"Automate: new signup → welcome email → day-3 education → day-7 case study → day-14 sales call CTA."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true},{"key":"brand_voice","required":false,"default":"Professional"},{"key":"brand_colors","required":false},{"key":"primary_cta","required":true,"default":"Book a demo"}]'::jsonb,
 'Glintr Team',now()),

('course-launch-webinar','Course Launch — Webinar Funnel','High-converting webinar funnel for course creators','Complete webinar-based course launch: strategy, promo posts, ads, registration landing page, reminder emails, and post-webinar nurture.','approved','public',true,true,true,false,
 ARRAY['education','course-launch'],ARRAY['lead-generation','product-launch'],ARRAY['instagram','facebook','email','landing','meta-ads'],
 ARRAY['strategist','copywriter','designer','email'],
 ARRAY['strategy','posts','images','emails','landing','forms','calendar'],
 'beginner',5,900,14,
 ARRAY['course','webinar','coach','creator'],
 '{"strategy":"Design a 14-day webinar funnel to sell {{business_name}} course to {{target_audience}}.",
   "content":"Write 14 Instagram + Facebook posts promoting the free webinar. Voice: {{brand_voice}}.",
   "email":"Write a 6-part sequence: 3 pre-webinar reminders, 1 replay, 2 pitch emails leading to {{primary_cta}}.",
   "landing":"Build a webinar registration page with countdown, host bio, and value bullets.",
   "workflow":"Register → confirmation email → 3 reminders → replay → 48h close cart."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true},{"key":"primary_cta","required":true,"default":"Enroll now"}]'::jsonb,
 'Glintr Team',now()),

('agency-lead-gen','Agency — B2B Lead Gen Machine','LinkedIn + cold email lead-gen system for agencies','A repeatable B2B lead engine: ICP research, LinkedIn content plan, cold email sequences, and appointment-setting workflow.','approved','public',true,true,true,false,
 ARRAY['agency','saas'],ARRAY['lead-generation'],ARRAY['linkedin','email'],
 ARRAY['strategist','copywriter','sales'],
 ARRAY['strategy','posts','emails','forms','workflow','analytics'],
 'intermediate',5,800,30,
 ARRAY['agency','b2b','outbound','sales'],
 '{"strategy":"Design an outbound lead-gen playbook for {{business_name}} targeting {{target_audience}} in {{industry}}.",
   "content":"Write 20 LinkedIn thought-leadership posts for {{business_name}} founders. Voice: {{brand_voice}}.",
   "email":"Write a 4-step cold email sequence with reply-triggering hooks and a soft CTA to {{primary_cta}}.",
   "workflow":"Reply detected → send calendar link → book meeting → CRM record."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true},{"key":"primary_cta","required":true,"default":"Book a strategy call"}]'::jsonb,
 'Glintr Team',now()),

('real-estate-listing','Real Estate — New Listing Blitz','Multi-channel push for a new property listing','Blast a new listing across Instagram, Facebook, and Google. Includes reels script, carousel posts, ad copy, and inquiry landing page.','approved','public',true,true,false,false,
 ARRAY['real-estate'],ARRAY['lead-generation','social-media'],ARRAY['instagram','facebook','google-ads','meta-ads','landing'],
 ARRAY['designer','copywriter','video'],
 ARRAY['posts','images','videos','emails','landing','forms'],
 'beginner',4,700,10,
 ARRAY['real-estate','listing','property'],
 '{"content":"Write 10 Instagram + Facebook posts for the new {{business_name}} listing at {{location}}.",
   "image":"Property showcase visuals — bright, luxurious, {{brand_colors}}.",
   "video":"Reels script highlighting property USPs — 30 seconds, hook-first.",
   "landing":"Property inquiry page with gallery, features, map, and lead form.",
   "email":"3-email nurture sequence for warm inquiries."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"location","required":true},{"key":"primary_cta","required":true,"default":"Schedule a viewing"}]'::jsonb,
 'Glintr Team',now()),

('restaurant-grand-opening','Restaurant — Grand Opening','7-day launch campaign for a new restaurant','From teaser posts to opening night — 15 social posts, launch reel, geo-targeted ads, and reservation landing page.','approved','public',true,true,false,false,
 ARRAY['restaurant'],ARRAY['social-media','product-launch'],ARRAY['instagram','facebook','meta-ads'],
 ARRAY['designer','copywriter'],
 ARRAY['posts','images','videos','landing','calendar'],
 'beginner',4,600,7,
 ARRAY['restaurant','launch','local'],
 '{"content":"Write 15 mouthwatering posts for {{business_name}} grand opening at {{location}}.",
   "image":"Food photography prompts + branded overlays with {{brand_colors}}.",
   "video":"15-second reel: kitchen tease → chef → dish reveal → CTA {{primary_cta}}."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"location","required":true},{"key":"primary_cta","required":true,"default":"Book a table"}]'::jsonb,
 'Glintr Team',now()),

('gym-newyear','Gym & Fitness — New Year Membership','January membership drive for gyms and studios','Convert New Year resolutions into memberships: 21-day social plan, transformation stories, referral incentive, and signup landing page.','approved','public',true,true,false,false,
 ARRAY['gym'],ARRAY['lead-generation','social-media'],ARRAY['instagram','facebook','landing'],
 ARRAY['copywriter','designer'],
 ARRAY['posts','images','emails','landing','forms','calendar'],
 'beginner',5,700,21,
 ARRAY['fitness','gym','new-year','seasonal'],
 '{"strategy":"Build a January membership-drive plan for {{business_name}} at {{location}}.",
   "content":"21 daily motivational posts alternating tips, testimonials, and offers.",
   "email":"3-email drip: welcome → first-workout tips → referral bonus."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"location","required":true},{"key":"primary_cta","required":true,"default":"Start free trial"}]'::jsonb,
 'Glintr Team',now()),

('ecommerce-blackfriday','E-commerce — Black Friday Blitz','48-hour Black Friday sales sprint','Multi-touch BF campaign: teaser, launch, mid-sale, last-call. Includes 12 posts, 4 emails, ads, and a countdown landing page.','approved','public',true,true,true,false,
 ARRAY['ecommerce'],ARRAY['product-launch','email-marketing'],ARRAY['instagram','facebook','email','meta-ads','landing'],
 ARRAY['copywriter','designer','email'],
 ARRAY['posts','images','emails','landing','automation'],
 'intermediate',6,1100,7,
 ARRAY['ecommerce','black-friday','sale','seasonal'],
 '{"content":"Write 12 urgency-driven posts leading up to and during Black Friday for {{business_name}}.",
   "email":"4-email sale sequence: teaser → launch → mid-sale → last chance.",
   "landing":"BF landing page with countdown, product grid, and testimonials."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true},{"key":"primary_cta","required":true,"default":"Shop the sale"}]'::jsonb,
 'Glintr Team',now()),

('healthcare-clinic','Healthcare — Clinic Awareness','Trust-first patient acquisition for clinics','Build local trust with educational posts, doctor bios, patient stories, and an appointment landing page.','approved','public',true,true,false,false,
 ARRAY['healthcare'],ARRAY['lead-generation','content-marketing'],ARRAY['instagram','facebook','google-ads','landing'],
 ARRAY['copywriter','seo','designer'],
 ARRAY['posts','images','emails','landing','forms'],
 'beginner',5,700,30,
 ARRAY['healthcare','clinic','local','patient'],
 '{"content":"Write 20 educational health posts for {{business_name}} — myth-busters, tips, doctor Q&A.",
   "landing":"Trust-building appointment page with doctor credentials and reviews."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"location","required":true},{"key":"primary_cta","required":true,"default":"Book an appointment"}]'::jsonb,
 'Glintr Team',now()),

('linkedin-thought-leader','LinkedIn — Thought Leadership','30 days of high-signal LinkedIn posts','Position a founder or exec as a thought leader with 30 story-driven posts, connection strategy, and inbound funnel.','approved','public',true,true,true,true,
 ARRAY['startup','agency','saas'],ARRAY['content-marketing','lead-generation'],ARRAY['linkedin'],
 ARRAY['copywriter','strategist'],
 ARRAY['strategy','posts','calendar','analytics'],
 'intermediate',4,600,30,
 ARRAY['linkedin','personal-brand','founder','b2b'],
 '{"strategy":"Design a 30-day LinkedIn plan positioning {{business_name}} founder as an expert in {{industry}}.",
   "content":"Write 30 LinkedIn posts alternating hooks: story, contrarian, framework, case study, question. Voice: {{brand_voice}}."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"industry","required":true},{"key":"brand_voice","required":false,"default":"Professional"}]'::jsonb,
 'Glintr Team',now()),

('newsletter-launch','Content — Newsletter Launch','Launch a newsletter from zero','Full newsletter launch kit: positioning, signup landing page, welcome sequence, and 4 issue templates.','approved','public',true,true,false,false,
 ARRAY['startup','agency','saas','education'],ARRAY['content-marketing','email-marketing'],ARRAY['email','landing','linkedin'],
 ARRAY['copywriter','email'],
 ARRAY['strategy','emails','landing','forms'],
 'beginner',4,600,14,
 ARRAY['newsletter','content','substack'],
 '{"strategy":"Define positioning + niche + reader avatar for a newsletter by {{business_name}}.",
   "email":"Write a 4-part welcome sequence + 4 issue templates for the newsletter.",
   "landing":"High-converting newsletter signup page with sample content."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true}]'::jsonb,
 'Glintr Team',now()),

('law-firm-authority','Law Firm — Authority Content','Build authority and inbound cases for a law firm','SEO-first law-firm playbook: pillar articles, LinkedIn thought leadership, case studies, and consult landing page.','approved','public',true,true,false,false,
 ARRAY['law-firm'],ARRAY['seo','content-marketing','lead-generation'],ARRAY['linkedin','landing'],
 ARRAY['seo','copywriter'],
 ARRAY['strategy','posts','landing','analytics'],
 'advanced',6,1000,60,
 ARRAY['law','legal','authority','seo'],
 '{"strategy":"Design an SEO + LinkedIn authority plan for {{business_name}} covering {{industry}} law.",
   "content":"5 pillar SEO articles + 20 LinkedIn posts translating each pillar into stories."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"target_audience","required":true},{"key":"location","required":false}]'::jsonb,
 'Glintr Team',now()),

('holiday-diwali','Seasonal — Diwali Campaign','Culturally-tuned Diwali festive campaign','Celebrate + convert: 10 festive social posts, greeting reel, Diwali email offer, and landing page.','approved','public',true,true,true,false,
 ARRAY['ecommerce','restaurant','gym','saas'],ARRAY['social-media','product-launch'],ARRAY['instagram','facebook','email'],
 ARRAY['designer','copywriter'],
 ARRAY['posts','images','videos','emails','landing'],
 'beginner',3,500,7,
 ARRAY['diwali','festive','seasonal','india'],
 '{"content":"10 warm, culturally-respectful Diwali posts for {{business_name}}.",
   "image":"Festive visuals with diyas, marigold, {{brand_colors}}.",
   "email":"Diwali greeting + special offer email leading to {{primary_cta}}."}'::jsonb,
 '[{"key":"business_name","required":true},{"key":"primary_cta","required":true,"default":"Shop the collection"}]'::jsonb,
 'Glintr Team',now())
ON CONFLICT (slug) DO NOTHING;