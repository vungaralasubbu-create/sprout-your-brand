
-- =========================================================
-- Glintr Social Media Automation (soc_*)
-- =========================================================

CREATE TABLE public.soc_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  brand_id uuid,
  platform text NOT NULL CHECK (platform IN (
    'linkedin','facebook','instagram','threads','x','telegram',
    'whatsapp_channel','youtube_community','pinterest','blog','email'
  )),
  account_name text NOT NULL,
  account_external_id text,
  organization text,
  access_token_ciphertext text,
  refresh_token_ciphertext text,
  token_expires_at timestamptz,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  can_post boolean NOT NULL DEFAULT true,
  can_read_analytics boolean NOT NULL DEFAULT true,
  connection_status text NOT NULL DEFAULT 'connected'
    CHECK (connection_status IN ('connected','disconnected','error','token_expired','revoked')),
  webhook_status text NOT NULL DEFAULT 'inactive'
    CHECK (webhook_status IN ('active','inactive','error')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_accounts_owner ON public.soc_accounts(owner_id);
CREATE INDEX idx_soc_accounts_platform ON public.soc_accounts(platform);
CREATE INDEX idx_soc_accounts_brand ON public.soc_accounts(brand_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_accounts TO authenticated;
GRANT ALL ON public.soc_accounts TO service_role;
ALTER TABLE public.soc_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_accounts owner rw" ON public.soc_accounts
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  brand_id uuid,
  name text NOT NULL,
  objective text,
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  platforms text[] NOT NULL DEFAULT '{}',
  start_date timestamptz,
  end_date timestamptz,
  frequency text CHECK (frequency IN ('once','daily','weekly','monthly','quarterly','custom')),
  frequency_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  timezone text NOT NULL DEFAULT 'UTC',
  brand_kit_id uuid,
  language text NOT NULL DEFAULT 'en',
  tone text,
  approval_mode text NOT NULL DEFAULT 'manual' CHECK (approval_mode IN ('auto','manual','team_review')),
  approval_status text NOT NULL DEFAULT 'draft'
    CHECK (approval_status IN ('draft','pending_review','approved','rejected','active','paused','completed','archived')),
  reviewers uuid[] NOT NULL DEFAULT '{}',
  holiday_awareness boolean NOT NULL DEFAULT true,
  festival_awareness boolean NOT NULL DEFAULT true,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_campaigns_owner ON public.soc_campaigns(owner_id);
CREATE INDEX idx_soc_campaigns_status ON public.soc_campaigns(approval_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_campaigns TO authenticated;
GRANT ALL ON public.soc_campaigns TO service_role;
ALTER TABLE public.soc_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_campaigns owner rw" ON public.soc_campaigns
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.soc_campaigns(id) ON DELETE SET NULL,
  post_type text NOT NULL CHECK (post_type IN (
    'single_image','carousel','video','reel','story','pdf_carousel','poll',
    'text_only','link_post','event','course_launch','hiring','student_success',
    'blog_promotion','ai_news','tech_news'
  )),
  topic text,
  source_entity_type text,
  source_entity_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft','ai_generated','pending_review','approved','rejected',
    'scheduled','publishing','published','failed','archived'
  )),
  scheduled_at timestamptz,
  published_at timestamptz,
  timezone text NOT NULL DEFAULT 'UTC',
  brand_kit_id uuid,
  language text NOT NULL DEFAULT 'en',
  tone text,
  base_prompt text,
  base_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_platforms text[] NOT NULL DEFAULT '{}',
  approval_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  retry_count int NOT NULL DEFAULT 0,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_posts_owner ON public.soc_posts(owner_id);
CREATE INDEX idx_soc_posts_campaign ON public.soc_posts(campaign_id);
CREATE INDEX idx_soc_posts_status ON public.soc_posts(status);
CREATE INDEX idx_soc_posts_scheduled ON public.soc_posts(scheduled_at) WHERE status IN ('scheduled','approved');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_posts TO authenticated;
GRANT ALL ON public.soc_posts TO service_role;
ALTER TABLE public.soc_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_posts owner rw" ON public.soc_posts
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_post_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.soc_posts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  platform text NOT NULL,
  account_id uuid REFERENCES public.soc_accounts(id) ON DELETE SET NULL,
  caption text,
  hashtags text[] NOT NULL DEFAULT '{}',
  cta text,
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  best_time_at timestamptz,
  external_post_id text,
  external_url text,
  suggested_comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  suggested_replies jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, platform)
);
CREATE INDEX idx_soc_variants_post ON public.soc_post_variants(post_id);
CREATE INDEX idx_soc_variants_platform ON public.soc_post_variants(platform);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_post_variants TO authenticated;
GRANT ALL ON public.soc_post_variants TO service_role;
ALTER TABLE public.soc_post_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_variants owner rw" ON public.soc_post_variants
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_publish_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL REFERENCES public.soc_post_variants(id) ON DELETE CASCADE,
  post_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  attempt_number int NOT NULL DEFAULT 1,
  status text NOT NULL CHECK (status IN ('queued','running','success','failed','abandoned')),
  next_retry_at timestamptz,
  retry_tier text CHECK (retry_tier IN ('1m','5m','15m','1h','24h')),
  request_payload jsonb,
  response_payload jsonb,
  error_code text,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_attempts_variant ON public.soc_publish_attempts(variant_id);
CREATE INDEX idx_soc_attempts_next_retry ON public.soc_publish_attempts(next_retry_at) WHERE status = 'failed';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_publish_attempts TO authenticated;
GRANT ALL ON public.soc_publish_attempts TO service_role;
ALTER TABLE public.soc_publish_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_attempts owner r" ON public.soc_publish_attempts
  FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "soc_attempts owner w" ON public.soc_publish_attempts
  FOR INSERT WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.soc_posts(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approved','rejected','changes_requested')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_approvals_post ON public.soc_approvals(post_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_approvals TO authenticated;
GRANT ALL ON public.soc_approvals TO service_role;
ALTER TABLE public.soc_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_approvals owner or reviewer" ON public.soc_approvals
  FOR ALL USING (auth.uid() = owner_id OR auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = reviewer_id);


CREATE TABLE public.soc_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  variant_id uuid REFERENCES public.soc_post_variants(id) ON DELETE CASCADE,
  post_id uuid,
  platform text NOT NULL,
  external_comment_id text,
  author_name text,
  author_external_id text,
  content text NOT NULL,
  sentiment text CHECK (sentiment IN ('positive','neutral','negative','mixed')),
  is_spam boolean NOT NULL DEFAULT false,
  ai_suggested_reply text,
  reply_text text,
  reply_status text NOT NULL DEFAULT 'unread'
    CHECK (reply_status IN ('unread','read','replied','resolved','ignored')),
  assigned_to uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_comments_owner ON public.soc_comments(owner_id);
CREATE INDEX idx_soc_comments_variant ON public.soc_comments(variant_id);
CREATE INDEX idx_soc_comments_status ON public.soc_comments(reply_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_comments TO authenticated;
GRANT ALL ON public.soc_comments TO service_role;
ALTER TABLE public.soc_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_comments owner or assignee" ON public.soc_comments
  FOR ALL USING (auth.uid() = owner_id OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = owner_id OR auth.uid() = assigned_to);


CREATE TABLE public.soc_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  variant_id uuid REFERENCES public.soc_post_variants(id) ON DELETE CASCADE,
  post_id uuid,
  campaign_id uuid,
  platform text NOT NULL,
  measured_at timestamptz NOT NULL DEFAULT now(),
  reach bigint DEFAULT 0,
  impressions bigint DEFAULT 0,
  views bigint DEFAULT 0,
  likes bigint DEFAULT 0,
  comments_count bigint DEFAULT 0,
  shares bigint DEFAULT 0,
  saves bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  ctr numeric,
  follower_delta bigint DEFAULT 0,
  traffic bigint DEFAULT 0,
  conversions bigint DEFAULT 0,
  revenue numeric DEFAULT 0,
  publishing_success boolean,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_analytics_owner ON public.soc_analytics(owner_id);
CREATE INDEX idx_soc_analytics_variant ON public.soc_analytics(variant_id);
CREATE INDEX idx_soc_analytics_campaign ON public.soc_analytics(campaign_id);
CREATE INDEX idx_soc_analytics_measured ON public.soc_analytics(measured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_analytics TO authenticated;
GRANT ALL ON public.soc_analytics TO service_role;
ALTER TABLE public.soc_analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_analytics owner rw" ON public.soc_analytics
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_recycling_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  source_variant_id uuid REFERENCES public.soc_post_variants(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  reason text,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','recycled','skipped','archived')),
  scheduled_recycle_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_recycle_owner ON public.soc_recycling_candidates(owner_id);
CREATE INDEX idx_soc_recycle_status ON public.soc_recycling_candidates(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_recycling_candidates TO authenticated;
GRANT ALL ON public.soc_recycling_candidates TO service_role;
ALTER TABLE public.soc_recycling_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_recycle owner rw" ON public.soc_recycling_candidates
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  kind text NOT NULL CHECK (kind IN (
    'publishing_failed','approval_needed','campaign_completed',
    'high_performing_post','account_disconnected','token_expiring','api_error'
  )),
  title text NOT NULL,
  body text,
  ref_type text,
  ref_id uuid,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','error','success')),
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_notif_owner ON public.soc_notifications(owner_id);
CREATE INDEX idx_soc_notif_unread ON public.soc_notifications(owner_id) WHERE read_at IS NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_notifications TO authenticated;
GRANT ALL ON public.soc_notifications TO service_role;
ALTER TABLE public.soc_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_notif owner rw" ON public.soc_notifications
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


CREATE TABLE public.soc_optimization_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  account_id uuid REFERENCES public.soc_accounts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN (
    'best_hour','best_weekday','best_hashtag','best_cta',
    'best_image_style','best_caption_length','best_topic','improvement'
  )),
  key text,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  confidence numeric NOT NULL DEFAULT 0,
  sample_size int NOT NULL DEFAULT 0,
  computed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_soc_insights_owner ON public.soc_optimization_insights(owner_id);
CREATE INDEX idx_soc_insights_account ON public.soc_optimization_insights(account_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.soc_optimization_insights TO authenticated;
GRANT ALL ON public.soc_optimization_insights TO service_role;
ALTER TABLE public.soc_optimization_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "soc_insights owner rw" ON public.soc_optimization_insights
  FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);


-- updated_at triggers (reuse public.update_updated_at_column if it exists; create if not)
CREATE OR REPLACE FUNCTION public.soc_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_soc_accounts_updated BEFORE UPDATE ON public.soc_accounts
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
CREATE TRIGGER trg_soc_campaigns_updated BEFORE UPDATE ON public.soc_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
CREATE TRIGGER trg_soc_posts_updated BEFORE UPDATE ON public.soc_posts
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
CREATE TRIGGER trg_soc_variants_updated BEFORE UPDATE ON public.soc_post_variants
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
CREATE TRIGGER trg_soc_comments_updated BEFORE UPDATE ON public.soc_comments
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
CREATE TRIGGER trg_soc_recycle_updated BEFORE UPDATE ON public.soc_recycling_candidates
  FOR EACH ROW EXECUTE FUNCTION public.soc_touch_updated_at();
