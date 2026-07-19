-- =============================================================================
-- GLINTR ENGAGE — Marketing Automation & Notification Center (Phase 1)
-- Fix: partner_brand_profiles uses column `user_id`, not `owner_id`.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.engage_touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 1. Providers ---------------------------------------------------------------

CREATE TABLE public.engage_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  display_name TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  secret_ref TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verified_at TIMESTAMPTZ,
  last_test_at TIMESTAMPTZ,
  last_test_status TEXT,
  last_test_error TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_providers_tenant_idx ON public.engage_providers(tenant_scope, channel);
CREATE INDEX engage_providers_brand_idx ON public.engage_providers(brand_id);
CREATE UNIQUE INDEX engage_providers_default_uniq
  ON public.engage_providers(tenant_scope, channel) WHERE is_default;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_providers TO authenticated;
GRANT ALL ON public.engage_providers TO service_role;
ALTER TABLE public.engage_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_providers_admin_all" ON public.engage_providers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_providers_brand_owner" ON public.engage_providers
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_providers.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_providers.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_providers_touch BEFORE UPDATE ON public.engage_providers
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 2. Senders -----------------------------------------------------------------

CREATE TABLE public.engage_senders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  from_name TEXT NOT NULL,
  from_email TEXT NOT NULL,
  reply_to TEXT,
  domain TEXT,
  dkim_status TEXT DEFAULT 'unknown',
  spf_status TEXT DEFAULT 'unknown',
  dmarc_status TEXT DEFAULT 'unknown',
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_senders_tenant_idx ON public.engage_senders(tenant_scope);
CREATE INDEX engage_senders_brand_idx ON public.engage_senders(brand_id);
CREATE UNIQUE INDEX engage_senders_default_uniq
  ON public.engage_senders(tenant_scope) WHERE is_default;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_senders TO authenticated;
GRANT ALL ON public.engage_senders TO service_role;
ALTER TABLE public.engage_senders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_senders_admin_all" ON public.engage_senders
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_senders_brand_owner" ON public.engage_senders
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_senders.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_senders.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_senders_touch BEFORE UPDATE ON public.engage_senders
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 3. Templates ---------------------------------------------------------------

CREATE TABLE public.engage_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  category TEXT,
  name TEXT NOT NULL,
  subject TEXT,
  preview_text TEXT,
  body_json JSONB,
  body_html TEXT,
  body_mjml TEXT,
  body_text TEXT,
  locale TEXT NOT NULL DEFAULT 'en',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_templates_key_idx ON public.engage_templates(template_key);
CREATE INDEX engage_templates_tenant_idx ON public.engage_templates(tenant_scope, channel);
CREATE INDEX engage_templates_brand_idx ON public.engage_templates(brand_id);
CREATE UNIQUE INDEX engage_templates_unique
  ON public.engage_templates(COALESCE(brand_id::text, tenant_scope), template_key, channel, locale, version);
GRANT SELECT ON public.engage_templates TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_templates TO authenticated;
GRANT ALL ON public.engage_templates TO service_role;
ALTER TABLE public.engage_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_templates_read_all" ON public.engage_templates
  FOR SELECT TO authenticated, anon
  USING (is_active AND (tenant_scope = 'platform' OR brand_id IS NOT NULL));
CREATE POLICY "engage_templates_admin_write" ON public.engage_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_templates_brand_write" ON public.engage_templates
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_templates.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_templates.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_templates_touch BEFORE UPDATE ON public.engage_templates
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 4. Segments ----------------------------------------------------------------

CREATE TABLE public.engage_segments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  audience TEXT NOT NULL DEFAULT 'students',
  rules JSONB NOT NULL DEFAULT '{"all":[]}'::jsonb,
  estimated_size INTEGER,
  last_evaluated_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_segments_tenant_idx ON public.engage_segments(tenant_scope);
CREATE INDEX engage_segments_brand_idx ON public.engage_segments(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_segments TO authenticated;
GRANT ALL ON public.engage_segments TO service_role;
ALTER TABLE public.engage_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_segments_admin_all" ON public.engage_segments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_segments_brand_owner" ON public.engage_segments
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_segments.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_segments.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_segments_touch BEFORE UPDATE ON public.engage_segments
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 5. Sequences ---------------------------------------------------------------

CREATE TABLE public.engage_sequences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'students',
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_sequences_trigger_idx ON public.engage_sequences(trigger_event) WHERE is_active;
CREATE INDEX engage_sequences_tenant_idx ON public.engage_sequences(tenant_scope);
CREATE INDEX engage_sequences_brand_idx ON public.engage_sequences(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_sequences TO authenticated;
GRANT ALL ON public.engage_sequences TO service_role;
ALTER TABLE public.engage_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_sequences_admin_all" ON public.engage_sequences
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_sequences_brand_owner" ON public.engage_sequences
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_sequences.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_sequences.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_sequences_touch BEFORE UPDATE ON public.engage_sequences
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 6. Sequence enrollments ----------------------------------------------------

CREATE TABLE public.engage_sequence_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sequence_id UUID NOT NULL REFERENCES public.engage_sequences(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  next_run_at TIMESTAMPTZ,
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_error TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_seq_enroll_next_idx
  ON public.engage_sequence_enrollments(next_run_at) WHERE status = 'active';
CREATE INDEX engage_seq_enroll_user_idx ON public.engage_sequence_enrollments(user_id);
CREATE UNIQUE INDEX engage_seq_enroll_uniq
  ON public.engage_sequence_enrollments(sequence_id, user_id)
  WHERE status IN ('active', 'paused');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_sequence_enrollments TO authenticated;
GRANT ALL ON public.engage_sequence_enrollments TO service_role;
ALTER TABLE public.engage_sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_seq_enroll_admin" ON public.engage_sequence_enrollments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_seq_enroll_own" ON public.engage_sequence_enrollments
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER engage_seq_enroll_touch BEFORE UPDATE ON public.engage_sequence_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 7. Campaigns ---------------------------------------------------------------

CREATE TABLE public.engage_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES public.engage_templates(id) ON DELETE SET NULL,
  template_key TEXT,
  segment_id UUID REFERENCES public.engage_segments(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES public.engage_providers(id) ON DELETE SET NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  schedule_type TEXT NOT NULL DEFAULT 'immediate',
  scheduled_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  recurring_cron TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  ab_test JSONB,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  bounced_count INTEGER NOT NULL DEFAULT 0,
  unsubscribed_count INTEGER NOT NULL DEFAULT 0,
  revenue_amount NUMERIC(14, 2) DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
CREATE INDEX engage_campaigns_status_idx ON public.engage_campaigns(status, scheduled_at);
CREATE INDEX engage_campaigns_tenant_idx ON public.engage_campaigns(tenant_scope);
CREATE INDEX engage_campaigns_brand_idx ON public.engage_campaigns(brand_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_campaigns TO authenticated;
GRANT ALL ON public.engage_campaigns TO service_role;
ALTER TABLE public.engage_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_campaigns_admin_all" ON public.engage_campaigns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_campaigns_brand_owner" ON public.engage_campaigns
  FOR ALL TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_campaigns.brand_id AND pbp.user_id = auth.uid()))
  WITH CHECK (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_campaigns.brand_id AND pbp.user_id = auth.uid()));
CREATE TRIGGER engage_campaigns_touch BEFORE UPDATE ON public.engage_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 8. Messages ----------------------------------------------------------------

CREATE TABLE public.engage_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  provider TEXT,
  provider_message_id TEXT,
  template_key TEXT,
  template_id UUID REFERENCES public.engage_templates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.engage_campaigns(id) ON DELETE SET NULL,
  sequence_enrollment_id UUID REFERENCES public.engage_sequence_enrollments(id) ON DELETE SET NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'queued',
  variant TEXT,
  idempotency_key TEXT,
  error_code TEXT,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  queued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ
);
CREATE INDEX engage_messages_recipient_idx ON public.engage_messages(recipient);
CREATE INDEX engage_messages_user_idx ON public.engage_messages(user_id);
CREATE INDEX engage_messages_campaign_idx ON public.engage_messages(campaign_id);
CREATE INDEX engage_messages_status_idx ON public.engage_messages(status, queued_at DESC);
CREATE INDEX engage_messages_brand_idx ON public.engage_messages(brand_id);
CREATE UNIQUE INDEX engage_messages_idempotency
  ON public.engage_messages(idempotency_key) WHERE idempotency_key IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_messages TO authenticated;
GRANT ALL ON public.engage_messages TO service_role;
ALTER TABLE public.engage_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_messages_admin_all" ON public.engage_messages
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_messages_brand_owner" ON public.engage_messages
  FOR SELECT TO authenticated
  USING (brand_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.partner_brand_profiles pbp
    WHERE pbp.id = engage_messages.brand_id AND pbp.user_id = auth.uid()));
CREATE POLICY "engage_messages_own_read" ON public.engage_messages
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- 9. Events ------------------------------------------------------------------

CREATE TABLE public.engage_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_scope TEXT NOT NULL DEFAULT 'platform',
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_events_unprocessed_idx
  ON public.engage_events(created_at) WHERE processed_at IS NULL;
CREATE INDEX engage_events_user_idx ON public.engage_events(user_id, event);
CREATE INDEX engage_events_event_idx ON public.engage_events(event, created_at DESC);
GRANT SELECT, INSERT ON public.engage_events TO authenticated;
GRANT ALL ON public.engage_events TO service_role;
ALTER TABLE public.engage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_events_admin_read" ON public.engage_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_events_own_insert" ON public.engage_events
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 10. Subscriptions ---------------------------------------------------------

CREATE TABLE public.engage_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  is_subscribed BOOLEAN NOT NULL DEFAULT TRUE,
  unsubscribe_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX engage_subs_user_category
  ON public.engage_subscriptions(COALESCE(user_id::text, email), COALESCE(brand_id::text, 'platform'), category, channel);
CREATE INDEX engage_subs_email_idx ON public.engage_subscriptions(email);
GRANT SELECT, INSERT, UPDATE ON public.engage_subscriptions TO authenticated;
GRANT SELECT, UPDATE ON public.engage_subscriptions TO anon;
GRANT ALL ON public.engage_subscriptions TO service_role;
ALTER TABLE public.engage_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_subs_own" ON public.engage_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "engage_subs_token_read" ON public.engage_subscriptions
  FOR SELECT TO anon USING (unsubscribe_token IS NOT NULL);
CREATE TRIGGER engage_subs_touch BEFORE UPDATE ON public.engage_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 11. Push subscriptions ----------------------------------------------------

CREATE TABLE public.engage_push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  keys JSONB NOT NULL,
  device_label TEXT,
  user_agent TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX engage_push_endpoint_uniq ON public.engage_push_subscriptions(endpoint);
CREATE INDEX engage_push_user_idx ON public.engage_push_subscriptions(user_id) WHERE is_active;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_push_subscriptions TO authenticated;
GRANT ALL ON public.engage_push_subscriptions TO service_role;
ALTER TABLE public.engage_push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_push_own" ON public.engage_push_subscriptions
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER engage_push_touch BEFORE UPDATE ON public.engage_push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.engage_touch_updated_at();

-- 12. In-app notifications --------------------------------------------------

CREATE TABLE public.engage_inapp_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'normal',
  title TEXT NOT NULL,
  body TEXT,
  icon TEXT,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_inapp_user_idx
  ON public.engage_inapp_notifications(user_id, created_at DESC) WHERE archived_at IS NULL;
CREATE INDEX engage_inapp_unread_idx
  ON public.engage_inapp_notifications(user_id) WHERE read_at IS NULL AND archived_at IS NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.engage_inapp_notifications TO authenticated;
GRANT ALL ON public.engage_inapp_notifications TO service_role;
ALTER TABLE public.engage_inapp_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_inapp_own" ON public.engage_inapp_notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "engage_inapp_admin" ON public.engage_inapp_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 13. AI generations --------------------------------------------------------

CREATE TABLE public.engage_ai_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  brand_id UUID REFERENCES public.partner_brand_profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  prompt TEXT,
  model TEXT,
  input JSONB,
  output JSONB,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX engage_ai_user_idx ON public.engage_ai_generations(user_id, created_at DESC);
GRANT SELECT, INSERT ON public.engage_ai_generations TO authenticated;
GRANT ALL ON public.engage_ai_generations TO service_role;
ALTER TABLE public.engage_ai_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engage_ai_own" ON public.engage_ai_generations
  FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

-- 14. Seed defaults ---------------------------------------------------------

INSERT INTO public.engage_providers (tenant_scope, kind, channel, display_name, is_default, is_active, config)
VALUES ('platform', 'lovable', 'email', 'Lovable Emails (Managed)', TRUE, TRUE, '{"managed": true}'::jsonb)
ON CONFLICT DO NOTHING;
