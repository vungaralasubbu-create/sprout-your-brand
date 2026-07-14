
-- ==== Risk Review System ====

CREATE TYPE public.risk_flag_type AS ENUM (
  'duplicate_utr',
  'possible_duplicate_proof',
  'unexpected_payment_amount',
  'lead_multi_partner',
  'lead_ownership_conflict',
  'repeated_payment_submission',
  'unusual_sales_activity',
  'suspicious_referral_pattern',
  'repeated_duplicate_lead_uploads',
  'other'
);

CREATE TYPE public.risk_flag_status AS ENUM (
  'open','under_review','needs_information','resolved','dismissed'
);

CREATE TYPE public.risk_flag_severity AS ENUM ('low','medium','high');

-- 1. Payment proof hash column for duplicate detection
ALTER TABLE public.partner_payment_submissions
  ADD COLUMN IF NOT EXISTS proof_hash text;
CREATE INDEX IF NOT EXISTS idx_pps_proof_hash
  ON public.partner_payment_submissions(proof_hash)
  WHERE proof_hash IS NOT NULL;

-- 2. Risk flags table
CREATE TABLE public.risk_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_type public.risk_flag_type NOT NULL,
  severity public.risk_flag_severity NOT NULL DEFAULT 'medium',
  status public.risk_flag_status NOT NULL DEFAULT 'open',
  reason text NOT NULL,
  -- connected records (all optional; flag types populate what applies)
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.partner_leads(id) ON DELETE SET NULL,
  submission_id uuid REFERENCES public.partner_payment_submissions(id) ON DELETE SET NULL,
  referral_id uuid REFERENCES public.partner_referrals(id) ON DELETE SET NULL,
  payment_link_id uuid REFERENCES public.payment_links(id) ON DELETE SET NULL,
  utr_normalized text,
  -- dedupe hint so triggers do not create duplicate flags per detection event
  dedupe_key text,
  amount_expected numeric(12,2),
  amount_submitted numeric(12,2),
  amount_delta numeric(12,2),
  connected_records jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  detected_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (flag_type, dedupe_key)
);

CREATE INDEX idx_risk_flags_status ON public.risk_flags(status);
CREATE INDEX idx_risk_flags_type ON public.risk_flags(flag_type);
CREATE INDEX idx_risk_flags_partner ON public.risk_flags(partner_id);
CREATE INDEX idx_risk_flags_created ON public.risk_flags(created_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.risk_flags TO authenticated;
GRANT ALL ON public.risk_flags TO service_role;
ALTER TABLE public.risk_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "risk_flags_admin_select" ON public.risk_flags FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'risk_review.view'));
CREATE POLICY "risk_flags_admin_write" ON public.risk_flags FOR UPDATE TO authenticated
  USING (public.has_admin_permission(auth.uid(),'risk_review.review'))
  WITH CHECK (public.has_admin_permission(auth.uid(),'risk_review.review'));
-- inserts happen from SECURITY DEFINER triggers/functions; block direct client inserts
CREATE POLICY "risk_flags_no_direct_insert" ON public.risk_flags FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE TRIGGER trg_risk_flags_updated
  BEFORE UPDATE ON public.risk_flags
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. Internal notes (admin-only)
CREATE TABLE public.risk_flag_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.risk_flags(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_flag_notes_flag ON public.risk_flag_notes(flag_id, created_at DESC);
GRANT SELECT, INSERT ON public.risk_flag_notes TO authenticated;
GRANT ALL ON public.risk_flag_notes TO service_role;
ALTER TABLE public.risk_flag_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_notes_admin_select" ON public.risk_flag_notes FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'risk_review.view'));
CREATE POLICY "risk_notes_admin_insert" ON public.risk_flag_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_permission(auth.uid(),'risk_review.review')
    AND author_user_id = auth.uid());

-- 4. Audit trail
CREATE TABLE public.risk_flag_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id uuid NOT NULL REFERENCES public.risk_flags(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status public.risk_flag_status,
  to_status public.risk_flag_status,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_flag_activity_flag ON public.risk_flag_activity(flag_id, created_at DESC);
GRANT SELECT, INSERT ON public.risk_flag_activity TO authenticated;
GRANT ALL ON public.risk_flag_activity TO service_role;
ALTER TABLE public.risk_flag_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_activity_admin_select" ON public.risk_flag_activity FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'risk_review.view'));
CREATE POLICY "risk_activity_admin_insert" ON public.risk_flag_activity FOR INSERT TO authenticated
  WITH CHECK (public.has_admin_permission(auth.uid(),'risk_review.review'));

-- 5. Configurable review thresholds
CREATE TABLE public.risk_review_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  submissions_per_hour_threshold int NOT NULL DEFAULT 10,
  verified_sales_per_day_threshold int NOT NULL DEFAULT 15,
  duplicate_utr_threshold int NOT NULL DEFAULT 2,
  duplicate_lead_upload_threshold int NOT NULL DEFAULT 5,
  amount_delta_min numeric(12,2) NOT NULL DEFAULT 1.00,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
INSERT INTO public.risk_review_settings (id) VALUES (true);
GRANT SELECT, UPDATE ON public.risk_review_settings TO authenticated;
GRANT ALL ON public.risk_review_settings TO service_role;
ALTER TABLE public.risk_review_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk_settings_admin_select" ON public.risk_review_settings FOR SELECT TO authenticated
  USING (public.has_admin_permission(auth.uid(),'risk_review.view'));
CREATE POLICY "risk_settings_admin_update" ON public.risk_review_settings FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 6. Admin permissions catalog rows (risk_review group)
INSERT INTO public.admin_role_permissions (admin_role, permission_key) VALUES
  ('super_admin','risk_review.view'),
  ('super_admin','risk_review.review'),
  ('super_admin','risk_review.resolve'),
  ('super_admin','risk_review.dismiss')
ON CONFLICT DO NOTHING;

-- 7. Detection helpers
CREATE OR REPLACE FUNCTION public.tg_pps_risk_detection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  settings public.risk_review_settings%ROWTYPE;
  link_amount numeric(12,2);
  dup_utr_count int;
  dup_proof_count int;
  repeat_count int;
  hour_count int;
  lead_owner uuid;
  lead_assigned uuid;
  lead_mobile text;
  partner_conflict_count int;
BEGIN
  SELECT * INTO settings FROM public.risk_review_settings WHERE id = true;

  -- (a) Duplicate UTR flag
  IF NEW.utr_normalized IS NOT NULL AND NEW.utr_normalized <> '' THEN
    SELECT COUNT(*) INTO dup_utr_count
      FROM public.partner_payment_submissions
      WHERE utr_normalized = NEW.utr_normalized AND id <> NEW.id;
    IF dup_utr_count >= 1 THEN
      INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id, submission_id,
        utr_normalized, dedupe_key, metadata)
      VALUES ('duplicate_utr',
        'The same UTR / transaction reference was used on multiple payment submissions.',
        NEW.partner_id, NEW.lead_id, NEW.id, NEW.utr_normalized,
        'utr:'||NEW.utr_normalized,
        jsonb_build_object('duplicate_count', dup_utr_count+1, 'amount', NEW.amount))
      ON CONFLICT (flag_type, dedupe_key) DO UPDATE
        SET metadata = EXCLUDED.metadata, updated_at = now();
    END IF;
  END IF;

  -- (b) Duplicate proof hash flag
  IF NEW.proof_hash IS NOT NULL AND NEW.proof_hash <> '' THEN
    SELECT COUNT(*) INTO dup_proof_count
      FROM public.partner_payment_submissions
      WHERE proof_hash = NEW.proof_hash AND id <> NEW.id;
    IF dup_proof_count >= 1 THEN
      INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id, submission_id,
        dedupe_key, metadata)
      VALUES ('possible_duplicate_proof',
        'The uploaded payment proof matches another submitted proof file.',
        NEW.partner_id, NEW.lead_id, NEW.id,
        'proof:'||NEW.proof_hash,
        jsonb_build_object('duplicate_count', dup_proof_count+1))
      ON CONFLICT (flag_type, dedupe_key) DO UPDATE
        SET metadata = EXCLUDED.metadata, updated_at = now();
    END IF;
  END IF;

  -- (c) Unexpected payment amount vs assigned payment link
  IF NEW.payment_link_id IS NOT NULL THEN
    SELECT amount INTO link_amount FROM public.payment_links WHERE id = NEW.payment_link_id;
    IF link_amount IS NOT NULL AND ABS(link_amount - NEW.amount) >= COALESCE(settings.amount_delta_min, 1.00) THEN
      INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id, submission_id,
        payment_link_id, amount_expected, amount_submitted, amount_delta,
        dedupe_key, metadata)
      VALUES ('unexpected_payment_amount',
        'Submitted payment amount does not match the assigned payment link amount.',
        NEW.partner_id, NEW.lead_id, NEW.id, NEW.payment_link_id,
        link_amount, NEW.amount, NEW.amount - link_amount,
        'amount:'||NEW.id::text,
        jsonb_build_object('plan', NEW.plan))
      ON CONFLICT (flag_type, dedupe_key) DO NOTHING;
    END IF;
  END IF;

  -- (d) Repeated payment submission for same partner+lead+plan
  SELECT COUNT(*) INTO repeat_count
    FROM public.partner_payment_submissions
    WHERE partner_id = NEW.partner_id
      AND lead_id = NEW.lead_id
      AND plan = NEW.plan
      AND id <> NEW.id;
  IF repeat_count >= 2 THEN
    INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id, submission_id,
      dedupe_key, metadata)
    VALUES ('repeated_payment_submission',
      'This partner submitted repeated payment records for the same lead and plan.',
      NEW.partner_id, NEW.lead_id, NEW.id,
      'repeat:'||NEW.partner_id::text||':'||NEW.lead_id::text||':'||NEW.plan::text,
      jsonb_build_object('submission_count', repeat_count+1))
    ON CONFLICT (flag_type, dedupe_key) DO UPDATE
      SET metadata = EXCLUDED.metadata, updated_at = now();
  END IF;

  -- (e) High submission count in the last hour
  SELECT COUNT(*) INTO hour_count
    FROM public.partner_payment_submissions
    WHERE partner_id = NEW.partner_id
      AND submitted_at >= now() - interval '1 hour';
  IF hour_count >= COALESCE(settings.submissions_per_hour_threshold, 10) THEN
    INSERT INTO public.risk_flags (flag_type, reason, partner_id, submission_id,
      dedupe_key, metadata)
    VALUES ('unusual_sales_activity',
      'Partner submitted an unusually high number of payment records within the last hour.',
      NEW.partner_id, NEW.id,
      'activity_hour:'||NEW.partner_id::text||':'||to_char(now(),'YYYYMMDDHH24'),
      jsonb_build_object('hour_count', hour_count,
        'threshold', settings.submissions_per_hour_threshold))
    ON CONFLICT (flag_type, dedupe_key) DO NOTHING;
  END IF;

  -- (f) Lead linked to multiple partners
  SELECT owner_partner_id, assigned_partner_id, mobile_normalized
    INTO lead_owner, lead_assigned, lead_mobile
    FROM public.partner_leads WHERE id = NEW.lead_id;
  IF lead_mobile IS NOT NULL THEN
    SELECT COUNT(DISTINCT p) INTO partner_conflict_count FROM (
      SELECT owner_partner_id AS p FROM public.partner_leads
        WHERE mobile_normalized = lead_mobile AND owner_partner_id IS NOT NULL
      UNION
      SELECT assigned_partner_id FROM public.partner_leads
        WHERE mobile_normalized = lead_mobile AND assigned_partner_id IS NOT NULL
    ) t;
    IF partner_conflict_count >= 2 THEN
      INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id, submission_id,
        dedupe_key, metadata)
      VALUES ('lead_multi_partner',
        'This lead mobile number is linked to multiple sales partners.',
        NEW.partner_id, NEW.lead_id, NEW.id,
        'multi_partner:'||lead_mobile,
        jsonb_build_object('partner_count', partner_conflict_count))
      ON CONFLICT (flag_type, dedupe_key) DO UPDATE
        SET metadata = EXCLUDED.metadata, updated_at = now();
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_pps_risk_detection
  AFTER INSERT ON public.partner_payment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.tg_pps_risk_detection();

-- (g) Lead ownership review conflict → mirror as risk flag for the risk queue
CREATE OR REPLACE FUNCTION public.tg_lor_risk_flag()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.risk_flags (flag_type, reason, partner_id, lead_id,
    dedupe_key, metadata)
  VALUES ('lead_ownership_conflict',
    'A lead ownership review was raised because of a duplicate lead upload.',
    NEW.submitting_partner_id, NEW.existing_lead_id,
    'ownership_review:'||NEW.id::text,
    jsonb_build_object('review_id', NEW.id))
  ON CONFLICT (flag_type, dedupe_key) DO NOTHING;
  RETURN NEW;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='lead_ownership_reviews'
      AND column_name='submitting_partner_id')
  AND EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='lead_ownership_reviews'
      AND column_name='existing_lead_id') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_lor_risk_flag ON public.lead_ownership_reviews';
    EXECUTE 'CREATE TRIGGER trg_lor_risk_flag AFTER INSERT ON public.lead_ownership_reviews FOR EACH ROW EXECUTE FUNCTION public.tg_lor_risk_flag()';
  END IF;
END $$;

-- 8. On-demand referral pattern scan (invoked from admin UI)
CREATE OR REPLACE FUNCTION public.scan_referral_patterns()
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r RECORD;
  n int := 0;
BEGIN
  IF NOT public.has_admin_permission(auth.uid(),'risk_review.review') THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  -- Referrer with multiple referrals sharing the same referred mobile
  FOR r IN
    SELECT pr.referrer_partner_id AS partner_id,
           pa.mobile_normalized AS mob,
           COUNT(*) AS c,
           array_agg(pr.id) AS ids
    FROM public.partner_referrals pr
    JOIN public.partner_applications pa ON pa.id = pr.referred_application_id
    WHERE pa.mobile_normalized IS NOT NULL
    GROUP BY pr.referrer_partner_id, pa.mobile_normalized
    HAVING COUNT(*) > 1
  LOOP
    INSERT INTO public.risk_flags (flag_type, reason, partner_id,
      dedupe_key, metadata)
    VALUES ('suspicious_referral_pattern',
      'Referrer has multiple referral records sharing the same referred mobile.',
      r.partner_id,
      'ref_dupe_mobile:'||r.partner_id::text||':'||r.mob,
      jsonb_build_object('count', r.c, 'referral_ids', r.ids))
    ON CONFLICT (flag_type, dedupe_key) DO UPDATE
      SET metadata = EXCLUDED.metadata, updated_at = now();
    n := n + 1;
  END LOOP;

  RETURN n;
END $$;
GRANT EXECUTE ON FUNCTION public.scan_referral_patterns() TO authenticated;
