-- ============================================================
-- IMMUTABLE AUDIT LOG
-- ============================================================
CREATE TABLE public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('allowed','denied','error','info')),
  ip TEXT,
  user_agent TEXT,
  request_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.security_audit_log TO authenticated;
GRANT INSERT, SELECT ON public.security_audit_log TO service_role;
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view audit log" ON public.security_audit_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Service role appends audit log" ON public.security_audit_log FOR INSERT TO service_role
  WITH CHECK (true);

-- Enforce immutability: block UPDATE and DELETE for every role incl. service_role.
CREATE OR REPLACE FUNCTION public.security_audit_log_block_mutation()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'security_audit_log is append-only';
END;
$$;

CREATE TRIGGER security_audit_log_no_update
  BEFORE UPDATE ON public.security_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.security_audit_log_block_mutation();

CREATE TRIGGER security_audit_log_no_delete
  BEFORE DELETE ON public.security_audit_log
  FOR EACH ROW EXECUTE FUNCTION public.security_audit_log_block_mutation();

CREATE INDEX idx_audit_actor_time ON public.security_audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_action_time ON public.security_audit_log(action, created_at DESC);
CREATE INDEX idx_audit_risk_time ON public.security_audit_log(risk_level, created_at DESC);

-- ============================================================
-- AI POLICY ENGINE
-- ============================================================
CREATE TABLE public.ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  scope TEXT NOT NULL DEFAULT 'global',       -- global | role:<role> | agent:<id>
  rule_type TEXT NOT NULL,                    -- blocklist | regex | prompt_injection | pii | model_restriction | max_tokens
  patterns JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of strings/regex
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  action TEXT NOT NULL DEFAULT 'block',       -- block | redact | warn | log
  severity TEXT NOT NULL DEFAULT 'medium',    -- low | medium | high | critical
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_policies TO authenticated;
GRANT ALL ON public.ai_policies TO service_role;
ALTER TABLE public.ai_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view policies" ON public.ai_policies FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Super admins manage policies" ON public.ai_policies FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_ai_policies_updated_at
  BEFORE UPDATE ON public.ai_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ai_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  policy_id UUID REFERENCES public.ai_policies(id) ON DELETE SET NULL,
  policy_name TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  severity TEXT NOT NULL,
  request_id TEXT,
  matched_text_hash TEXT,     -- SHA-256; NEVER the raw text
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ai_policy_violations TO authenticated;
GRANT INSERT, SELECT ON public.ai_policy_violations TO service_role;
ALTER TABLE public.ai_policy_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view policy violations" ON public.ai_policy_violations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_policy_violations_user_time ON public.ai_policy_violations(user_id, created_at DESC);
CREATE INDEX idx_policy_violations_severity ON public.ai_policy_violations(severity, created_at DESC);

-- ============================================================
-- RATE LIMITER (ad-hoc; no standard primitive on the backend)
-- ============================================================
CREATE TABLE public.rate_limit_buckets (
  bucket_key TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket_key, window_start)
);
GRANT ALL ON public.rate_limit_buckets TO service_role;
ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_rate_limit_updated ON public.rate_limit_buckets(updated_at);

-- Atomic increment (RETURNING new count)
CREATE OR REPLACE FUNCTION public.rate_limit_incr(
  _bucket_key TEXT,
  _window_start TIMESTAMPTZ,
  _delta INTEGER DEFAULT 1
) RETURNS INTEGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE new_count INTEGER;
BEGIN
  INSERT INTO public.rate_limit_buckets(bucket_key, window_start, count, updated_at)
  VALUES (_bucket_key, _window_start, _delta, now())
  ON CONFLICT (bucket_key, window_start)
  DO UPDATE SET count = public.rate_limit_buckets.count + _delta, updated_at = now()
  RETURNING count INTO new_count;
  RETURN new_count;
END;
$$;

-- ============================================================
-- USAGE QUOTAS
-- ============================================================
CREATE TABLE public.usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope TEXT NOT NULL,                   -- role | user | organization
  subject_role TEXT,                     -- when scope=role
  subject_id UUID,                       -- when scope=user or organization
  quota_key TEXT NOT NULL,               -- e.g. ai_chat_requests, ai_image_generations, ai_tokens
  period TEXT NOT NULL,                  -- day | week | month
  limit_value BIGINT NOT NULL,
  hard_stop BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (scope, subject_role, subject_id, quota_key, period)
);
GRANT SELECT ON public.usage_quotas TO authenticated;
GRANT ALL ON public.usage_quotas TO service_role;
ALTER TABLE public.usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view quotas" ON public.usage_quotas FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "Super admins manage quotas" ON public.usage_quotas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_usage_quotas_updated_at
  BEFORE UPDATE ON public.usage_quotas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  quota_key TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  used BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, quota_key, period_start)
);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage" ON public.usage_counters FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_usage_counters_user_key ON public.usage_counters(user_id, quota_key, period_start DESC);

-- ============================================================
-- BUDGETS (cost governance in Lovable credits)
-- ============================================================
CREATE TABLE public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user','role','organization','global')),
  subject_id UUID,
  subject_role TEXT,
  period TEXT NOT NULL CHECK (period IN ('day','week','month')),
  limit_credits NUMERIC(12,4) NOT NULL,
  hard_stop BOOLEAN NOT NULL DEFAULT true,
  alert_threshold NUMERIC(3,2) NOT NULL DEFAULT 0.80,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.budgets TO authenticated;
GRANT ALL ON public.budgets TO service_role;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own or admin budgets" ON public.budgets FOR SELECT TO authenticated
  USING (
    (subject_type='user' AND subject_id = auth.uid())
    OR public.has_role(auth.uid(),'super_admin')
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "Super admins manage budgets" ON public.budgets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.budget_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID REFERENCES public.budgets(id) ON DELETE CASCADE,
  user_id UUID,
  credits NUMERIC(12,4) NOT NULL,
  source TEXT NOT NULL,       -- ai_chat | ai_embed | ai_image | tool_execution
  request_id TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.budget_events TO authenticated;
GRANT INSERT, SELECT ON public.budget_events TO service_role;
ALTER TABLE public.budget_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view budget events" ON public.budget_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin') OR auth.uid() = user_id);

CREATE INDEX idx_budget_events_budget_period ON public.budget_events(budget_id, period_start DESC);

-- ============================================================
-- SECRET ROTATION HISTORY
-- ============================================================
CREATE TABLE public.secret_rotation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_name TEXT NOT NULL,
  rotated_by UUID,
  reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.secret_rotation_history TO authenticated;
GRANT INSERT, SELECT ON public.secret_rotation_history TO service_role;
ALTER TABLE public.secret_rotation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view rotation history" ON public.secret_rotation_history FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'super_admin') OR public.has_role(auth.uid(),'admin'));

-- Rotation history is also append-only.
CREATE TRIGGER secret_rotation_no_update
  BEFORE UPDATE ON public.secret_rotation_history
  FOR EACH ROW EXECUTE FUNCTION public.security_audit_log_block_mutation();

CREATE TRIGGER secret_rotation_no_delete
  BEFORE DELETE ON public.secret_rotation_history
  FOR EACH ROW EXECUTE FUNCTION public.security_audit_log_block_mutation();

-- ============================================================
-- PERMISSION REGISTRY
-- ============================================================
CREATE TABLE public.permission_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission TEXT NOT NULL,
  allowed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);
GRANT SELECT ON public.permission_registry TO authenticated;
GRANT ALL ON public.permission_registry TO service_role;
ALTER TABLE public.permission_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed-in can read permissions" ON public.permission_registry FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admins manage permissions" ON public.permission_registry FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TRIGGER update_permission_registry_updated_at
  BEFORE UPDATE ON public.permission_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed baseline AI permissions per role. Adjust in Super Admin UI later.
INSERT INTO public.permission_registry(role, permission, allowed) VALUES
  ('super_admin','ai.chat',true),
  ('super_admin','ai.embed',true),
  ('super_admin','ai.image',true),
  ('super_admin','ai.tools',true),
  ('super_admin','ai.admin.view',true),
  ('admin','ai.chat',true),
  ('admin','ai.embed',true),
  ('admin','ai.image',true),
  ('admin','ai.tools',true),
  ('admin','ai.admin.view',true),
  ('instructor','ai.chat',true),
  ('instructor','ai.embed',true),
  ('instructor','ai.image',true),
  ('instructor','ai.tools',false),
  ('mentor','ai.chat',true),
  ('mentor','ai.embed',true),
  ('mentor','ai.image',false),
  ('mentor','ai.tools',false),
  ('partner','ai.chat',true),
  ('partner','ai.embed',true),
  ('partner','ai.image',true),
  ('partner','ai.tools',false),
  ('student','ai.chat',true),
  ('student','ai.embed',false),
  ('student','ai.image',false),
  ('student','ai.tools',false)
ON CONFLICT (role, permission) DO NOTHING;

-- Seed baseline global policies
INSERT INTO public.ai_policies (name, description, scope, rule_type, patterns, action, severity) VALUES
  (
    'prompt_injection_baseline',
    'Detect common jailbreak / prompt-injection phrases',
    'global',
    'prompt_injection',
    '["ignore previous instructions","disregard the above","you are now","system prompt","jailbreak","developer mode","DAN mode","reveal your instructions","forget everything"]'::jsonb,
    'block', 'high'
  ),
  (
    'pii_email_phone_ssn',
    'Redact obvious PII in prompts and outputs (email, phone, SSN, credit card)',
    'global',
    'pii',
    '[]'::jsonb,
    'redact', 'medium'
  ),
  (
    'blocked_secret_leakage',
    'Block outputs that appear to contain secrets (private keys, JWT-like tokens, sk_/pk_ keys)',
    'global',
    'regex',
    '["-----BEGIN [A-Z ]*PRIVATE KEY-----","eyJ[A-Za-z0-9_-]{20,}\\\\.[A-Za-z0-9_-]{20,}\\\\.[A-Za-z0-9_-]{20,}","sk_(live|test)_[A-Za-z0-9]{20,}"]'::jsonb,
    'block', 'critical'
  )
ON CONFLICT (name) DO NOTHING;

-- Seed baseline daily quotas
INSERT INTO public.usage_quotas(scope, subject_role, quota_key, period, limit_value, hard_stop) VALUES
  ('role','student','ai_chat_requests','day',200,true),
  ('role','student','ai_image_generations','day',0,true),
  ('role','mentor','ai_chat_requests','day',500,true),
  ('role','partner','ai_chat_requests','day',1000,true),
  ('role','partner','ai_image_generations','day',50,true),
  ('role','instructor','ai_chat_requests','day',1000,true),
  ('role','admin','ai_chat_requests','day',5000,true),
  ('role','super_admin','ai_chat_requests','day',100000,false)
ON CONFLICT (scope, subject_role, subject_id, quota_key, period) DO NOTHING;