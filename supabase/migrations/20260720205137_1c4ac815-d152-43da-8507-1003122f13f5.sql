-- =====================================================================
-- Billing Platform — provider-agnostic SaaS billing
-- All tables namespaced bill_* to coexist with existing schema.
-- =====================================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.bill_plan_tier AS ENUM ('free','starter','professional','agency','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_sub_status AS ENUM ('trialing','active','past_due','canceled','expired','paused','incomplete');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_pay_status AS ENUM ('pending','processing','succeeded','failed','refunded','partially_refunded','canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_invoice_status AS ENUM ('draft','open','paid','uncollectible','void');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_coupon_kind AS ENUM ('percentage','flat_amount','free_trial_extension');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.bill_cycle AS ENUM ('monthly','yearly','one_time');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================================
-- PLANS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  tier bill_plan_tier NOT NULL,
  tagline text,
  description text,
  monthly_price_inr numeric(12,2) NOT NULL DEFAULT 0,
  yearly_price_inr numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  trial_days int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT true,
  is_recommended boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bill_plans TO anon, authenticated;
GRANT ALL ON public.bill_plans TO service_role;
ALTER TABLE public.bill_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.bill_plans FOR SELECT USING (is_public = true AND is_active = true);
CREATE POLICY "plans admin all" ON public.bill_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- =====================================================================
-- SUBSCRIPTIONS  (one active per workspace)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.bill_plans(id),
  status bill_sub_status NOT NULL DEFAULT 'trialing',
  billing_cycle bill_cycle NOT NULL DEFAULT 'monthly',
  quantity int NOT NULL DEFAULT 1,
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz,
  trial_start timestamptz,
  trial_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  canceled_at timestamptz,
  provider text,
  provider_subscription_id text,
  provider_customer_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, status) DEFERRABLE INITIALLY DEFERRED
);
CREATE INDEX IF NOT EXISTS bill_subscriptions_workspace_idx ON public.bill_subscriptions(workspace_id);
CREATE INDEX IF NOT EXISTS bill_subscriptions_status_idx ON public.bill_subscriptions(status);
GRANT SELECT, INSERT, UPDATE ON public.bill_subscriptions TO authenticated;
GRANT ALL ON public.bill_subscriptions TO service_role;
ALTER TABLE public.bill_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub member read" ON public.bill_subscriptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_subscriptions.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "sub owner write" ON public.bill_subscriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_subscriptions.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));
CREATE POLICY "sub admin all" ON public.bill_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- =====================================================================
-- SUBSCRIPTION ITEMS (seats, add-ons)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_subscription_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES public.bill_subscriptions(id) ON DELETE CASCADE,
  item_type text NOT NULL, -- 'seat' | 'credits_topup' | 'addon'
  description text,
  quantity int NOT NULL DEFAULT 1,
  unit_price_inr numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_sub_items_sub_idx ON public.bill_subscription_items(subscription_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_subscription_items TO authenticated;
GRANT ALL ON public.bill_subscription_items TO service_role;
ALTER TABLE public.bill_subscription_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_items member read" ON public.bill_subscription_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bill_subscriptions s JOIN public.mc_workspace_members m ON m.workspace_id = s.workspace_id
                 WHERE s.id = bill_subscription_items.subscription_id AND m.user_id = auth.uid()));

-- =====================================================================
-- WORKSPACE USAGE (rolling counters)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_workspace_usage (
  workspace_id uuid PRIMARY KEY REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  credits_balance bigint NOT NULL DEFAULT 0,
  credits_consumed_period bigint NOT NULL DEFAULT 0,
  storage_bytes_used bigint NOT NULL DEFAULT 0,
  projects_created int NOT NULL DEFAULT 0,
  seats_used int NOT NULL DEFAULT 1,
  images_generated int NOT NULL DEFAULT 0,
  videos_generated int NOT NULL DEFAULT 0,
  api_calls int NOT NULL DEFAULT 0,
  downloads int NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT now(),
  period_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bill_workspace_usage TO authenticated;
GRANT ALL ON public.bill_workspace_usage TO service_role;
ALTER TABLE public.bill_workspace_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage member read" ON public.bill_workspace_usage FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_workspace_usage.workspace_id AND m.user_id = auth.uid()));

-- =====================================================================
-- CREDIT TRANSACTIONS (immutable ledger)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  user_id uuid,
  delta bigint NOT NULL,   -- +grant / -consume
  balance_after bigint NOT NULL,
  reason text NOT NULL,    -- 'strategy'|'post'|'poster'|'video'|'landing'|'email'|'workflow'|'seo_audit'|'analytics'|'grant'|'topup'|'refund'|'adjustment'
  ref_type text,
  ref_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_credit_tx_workspace_idx ON public.bill_credit_transactions(workspace_id, created_at DESC);
GRANT SELECT, INSERT ON public.bill_credit_transactions TO authenticated;
GRANT ALL ON public.bill_credit_transactions TO service_role;
ALTER TABLE public.bill_credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit tx member read" ON public.bill_credit_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_credit_transactions.workspace_id AND m.user_id = auth.uid()));

-- =====================================================================
-- PAYMENT METHODS (tokenized references only — never store raw card data)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  provider text NOT NULL,             -- 'cashfree'|'stripe'|'paddle'|'razorpay'|'lemonsqueezy'
  provider_method_id text NOT NULL,
  method_type text NOT NULL,          -- 'card'|'upi'|'netbanking'|'wallet'
  brand text,
  last4 text,
  exp_month int,
  exp_year int,
  upi_handle text,
  is_default boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_method_id)
);
CREATE INDEX IF NOT EXISTS bill_pm_workspace_idx ON public.bill_payment_methods(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payment_methods TO authenticated;
GRANT ALL ON public.bill_payment_methods TO service_role;
ALTER TABLE public.bill_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pm member read" ON public.bill_payment_methods FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_payment_methods.workspace_id AND m.user_id = auth.uid()));
CREATE POLICY "pm owner write" ON public.bill_payment_methods FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_payment_methods.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_payment_methods.workspace_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')));

-- =====================================================================
-- PAYMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.bill_subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid,
  provider text NOT NULL,
  provider_payment_id text,
  provider_order_id text,
  amount_inr numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  tax_inr numeric(12,2) NOT NULL DEFAULT 0,
  discount_inr numeric(12,2) NOT NULL DEFAULT 0,
  status bill_pay_status NOT NULL DEFAULT 'pending',
  method_type text,
  failure_reason text,
  idempotency_key text UNIQUE,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  paid_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_payments_workspace_idx ON public.bill_payments(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bill_payments_provider_idx ON public.bill_payments(provider, provider_payment_id);
GRANT SELECT, INSERT, UPDATE ON public.bill_payments TO authenticated;
GRANT ALL ON public.bill_payments TO service_role;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pay member read" ON public.bill_payments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_payments.workspace_id AND m.user_id = auth.uid()));

-- =====================================================================
-- INVOICES
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.bill_subscriptions(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.bill_payments(id) ON DELETE SET NULL,
  status bill_invoice_status NOT NULL DEFAULT 'draft',
  subtotal_inr numeric(12,2) NOT NULL DEFAULT 0,
  discount_inr numeric(12,2) NOT NULL DEFAULT 0,
  tax_inr numeric(12,2) NOT NULL DEFAULT 0,
  total_inr numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  period_start timestamptz,
  period_end timestamptz,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  gst_number text,
  billing_address jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_invoices_workspace_idx ON public.bill_invoices(workspace_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE ON public.bill_invoices TO authenticated;
GRANT ALL ON public.bill_invoices TO service_role;
ALTER TABLE public.bill_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv member read" ON public.bill_invoices FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_invoices.workspace_id AND m.user_id = auth.uid()));

-- =====================================================================
-- INVOICE ITEMS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.bill_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  unit_price_inr numeric(12,2) NOT NULL DEFAULT 0,
  amount_inr numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS bill_invoice_items_inv_idx ON public.bill_invoice_items(invoice_id);
GRANT SELECT, INSERT ON public.bill_invoice_items TO authenticated;
GRANT ALL ON public.bill_invoice_items TO service_role;
ALTER TABLE public.bill_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inv items member read" ON public.bill_invoice_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bill_invoices i JOIN public.mc_workspace_members m ON m.workspace_id = i.workspace_id
                 WHERE i.id = bill_invoice_items.invoice_id AND m.user_id = auth.uid()));

-- =====================================================================
-- COUPONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind bill_coupon_kind NOT NULL,
  percent_off numeric(5,2),
  amount_off_inr numeric(12,2),
  free_trial_days int,
  currency text NOT NULL DEFAULT 'INR',
  applies_to_plans uuid[],           -- null = all
  workspace_id uuid REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,  -- null = global
  max_redemptions int,
  redemptions_used int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bill_coupons TO authenticated;
GRANT ALL ON public.bill_coupons TO service_role;
ALTER TABLE public.bill_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons read" ON public.bill_coupons FOR SELECT TO authenticated
  USING (is_active = true AND (workspace_id IS NULL
    OR EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_coupons.workspace_id AND m.user_id = auth.uid())));
CREATE POLICY "coupons admin" ON public.bill_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- =====================================================================
-- COUPON REDEMPTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.bill_coupons(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.bill_subscriptions(id) ON DELETE SET NULL,
  redeemed_at timestamptz NOT NULL DEFAULT now(),
  amount_discounted_inr numeric(12,2)
);
CREATE INDEX IF NOT EXISTS bill_coupon_redeem_ws_idx ON public.bill_coupon_redemptions(workspace_id);
GRANT SELECT, INSERT ON public.bill_coupon_redemptions TO authenticated;
GRANT ALL ON public.bill_coupon_redemptions TO service_role;
ALTER TABLE public.bill_coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "redeem member read" ON public.bill_coupon_redemptions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mc_workspace_members m WHERE m.workspace_id = bill_coupon_redemptions.workspace_id AND m.user_id = auth.uid()));

-- =====================================================================
-- BILLING EVENTS (audit log for webhooks + state transitions)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.mc_workspaces(id) ON DELETE CASCADE,
  provider text,
  event_type text NOT NULL,
  provider_event_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);
CREATE INDEX IF NOT EXISTS bill_events_ws_idx ON public.bill_events(workspace_id, created_at DESC);
GRANT SELECT ON public.bill_events TO authenticated;
GRANT ALL ON public.bill_events TO service_role;
ALTER TABLE public.bill_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events admin read" ON public.bill_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- =====================================================================
-- FEATURE LIMITS (denormalized per-plan cache — power feature gating)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.bill_feature_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.bill_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  limit_value bigint,          -- null = unlimited
  is_boolean boolean NOT NULL DEFAULT false,
  boolean_value boolean,
  UNIQUE (plan_id, feature_key)
);
GRANT SELECT ON public.bill_feature_limits TO anon, authenticated;
GRANT ALL ON public.bill_feature_limits TO service_role;
ALTER TABLE public.bill_feature_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "limits public read" ON public.bill_feature_limits FOR SELECT USING (true);

-- =====================================================================
-- Seed the 5 plans
-- =====================================================================
INSERT INTO public.bill_plans (code,name,tier,tagline,monthly_price_inr,yearly_price_inr,trial_days,is_recommended,sort_order,features,limits)
VALUES
('free','Free','free','Explore the platform',0,0,0,false,10,
  '["3 projects","500 AI credits","1 GB storage","1 team member","Limited templates","Basic AI agents","Community support"]'::jsonb,
  '{"projects":3,"ai_credits":500,"storage_gb":1,"team_members":1,"workspaces":1}'::jsonb),
('starter','Starter','starter','For solo founders',1499,14990,14,false,20,
  '["Unlimited projects","10,000 AI credits","25 GB storage","3 team members","Email support","Standard templates","Brand kit"]'::jsonb,
  '{"projects":-1,"ai_credits":10000,"storage_gb":25,"team_members":3,"workspaces":1}'::jsonb),
('professional','Professional','professional','For growing teams',4999,49990,14,true,30,
  '["Unlimited projects","100,000 AI credits","100 GB storage","10 team members","Premium templates","AI agents","Priority queue","Advanced analytics","API access"]'::jsonb,
  '{"projects":-1,"ai_credits":100000,"storage_gb":100,"team_members":10,"workspaces":1,"api_access":true,"priority_queue":true}'::jsonb),
('agency','Agency','agency','For agencies & studios',14999,149990,14,false,40,
  '["Unlimited everything","500,000 AI credits","500 GB storage","Unlimited team members","Unlimited workspaces","White label","Client management","Priority rendering","Custom branding"]'::jsonb,
  '{"projects":-1,"ai_credits":500000,"storage_gb":500,"team_members":-1,"workspaces":-1,"white_label":true,"client_management":true}'::jsonb),
('enterprise','Enterprise','enterprise','Custom for your org',0,0,0,false,50,
  '["Unlimited usage","Dedicated infrastructure","SSO","Audit logs","Custom SLA","Private AI models","Dedicated account manager"]'::jsonb,
  '{"projects":-1,"ai_credits":-1,"storage_gb":-1,"team_members":-1,"workspaces":-1,"sso":true,"audit_logs":true,"dedicated_infra":true}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- =====================================================================
-- Helper functions: consume credits atomically + feature gate check
-- =====================================================================
CREATE OR REPLACE FUNCTION public.bill_consume_credits(
  _workspace_id uuid,
  _user_id uuid,
  _amount bigint,
  _reason text,
  _ref_type text DEFAULT NULL,
  _ref_id text DEFAULT NULL
) RETURNS TABLE(ok boolean, balance_after bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bal bigint;
BEGIN
  INSERT INTO public.bill_workspace_usage(workspace_id) VALUES (_workspace_id)
  ON CONFLICT (workspace_id) DO NOTHING;

  UPDATE public.bill_workspace_usage
     SET credits_balance = credits_balance - _amount,
         credits_consumed_period = credits_consumed_period + _amount,
         updated_at = now()
   WHERE workspace_id = _workspace_id AND credits_balance >= _amount
  RETURNING credits_balance INTO _bal;

  IF _bal IS NULL THEN
    RETURN QUERY SELECT false, (SELECT credits_balance FROM public.bill_workspace_usage WHERE workspace_id = _workspace_id);
    RETURN;
  END IF;

  INSERT INTO public.bill_credit_transactions(workspace_id,user_id,delta,balance_after,reason,ref_type,ref_id)
  VALUES (_workspace_id,_user_id,-_amount,_bal,_reason,_ref_type,_ref_id);

  RETURN QUERY SELECT true, _bal;
END $$;

GRANT EXECUTE ON FUNCTION public.bill_consume_credits(uuid,uuid,bigint,text,text,text) TO authenticated, service_role;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.bill_touch_updated_at() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS bill_plans_touch ON public.bill_plans;
CREATE TRIGGER bill_plans_touch BEFORE UPDATE ON public.bill_plans FOR EACH ROW EXECUTE FUNCTION public.bill_touch_updated_at();
DROP TRIGGER IF EXISTS bill_subs_touch ON public.bill_subscriptions;
CREATE TRIGGER bill_subs_touch BEFORE UPDATE ON public.bill_subscriptions FOR EACH ROW EXECUTE FUNCTION public.bill_touch_updated_at();
DROP TRIGGER IF EXISTS bill_pay_touch ON public.bill_payments;
CREATE TRIGGER bill_pay_touch BEFORE UPDATE ON public.bill_payments FOR EACH ROW EXECUTE FUNCTION public.bill_touch_updated_at();