
-- Helper: insert a notification for an ambassador with dedupe
CREATE OR REPLACE FUNCTION public.tg_amb_notify_insert(
  p_ambassador_id uuid,
  p_category text,
  p_notif_type text,
  p_title text,
  p_message text,
  p_related_entity_type text,
  p_related_entity_id uuid,
  p_action_route text,
  p_dedupe_key text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_ambassador_id IS NULL THEN RETURN; END IF;
  SELECT user_id INTO v_user_id FROM public.campus_ambassador_profiles WHERE id = p_ambassador_id;
  IF v_user_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.ambassador_notifications (
    user_id, ambassador_id, category, notif_type, title, message,
    related_entity_type, related_entity_id, action_type, action_route, dedupe_key
  ) VALUES (
    v_user_id, p_ambassador_id, p_category, p_notif_type, p_title, p_message,
    p_related_entity_type, p_related_entity_id, 'view', p_action_route, p_dedupe_key
  )
  ON CONFLICT (user_id, dedupe_key) DO NOTHING;
END;
$$;

-- ============= Referral Lead: created =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_referral_lead_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Only for valid attribution
  IF NEW.attribution_status IS DISTINCT FROM 'valid'::ambassador_attribution_status THEN
    RETURN NEW;
  END IF;
  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id,
    'referral', 'information',
    'New Referral Lead',
    'A new learner lead has been attributed to your referral.',
    'referral_lead', NEW.id,
    '/ambassador/referrals',
    'referral_lead_created:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_referral_lead_created ON public.ambassador_referral_leads;
CREATE TRIGGER trg_amb_notify_referral_lead_created
AFTER INSERT ON public.ambassador_referral_leads
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_referral_lead_created();

-- ============= Referral Lead: status change =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_referral_lead_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
  -- Only whitelisted ambassador-visible statuses
  IF NEW.status NOT IN ('contacted','interested','follow_up','payment_submitted','enrolled','closed') THEN
    RETURN NEW;
  END IF;
  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id,
    'referral', 'update',
    'Referral Lead Updated',
    'A referral lead has moved to ' || replace(initcap(replace(NEW.status,'_',' ')),'  ',' ') || '.',
    'referral_lead', NEW.id,
    '/ambassador/referrals',
    'referral_lead_status:' || NEW.id::text || ':' || NEW.status
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_referral_lead_status ON public.ambassador_referral_leads;
CREATE TRIGGER trg_amb_notify_referral_lead_status
AFTER UPDATE OF status ON public.ambassador_referral_leads
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_referral_lead_status();

-- ============= Enrollment: created + payment submitted =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_enrollment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ambassador_id IS NULL THEN RETURN NEW; END IF;

  -- Enrollment Created
  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id,
    'enrollment', 'information',
    'Enrollment Created',
    'An enrollment has been created for one of your referral leads.',
    'enrollment', NEW.id,
    '/ambassador/enrollments',
    'enrollment_created:' || NEW.id::text
  );

  -- Payment Submitted (received / under_verification implies payment submission recorded)
  IF NEW.status IN ('received','under_verification') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id,
      'payment_verification', 'information',
      'Payment Submitted',
      'Payment details were submitted for one of your referral leads and are awaiting verification.',
      'enrollment', NEW.id,
      '/ambassador/enrollments',
      'payment_submitted:' || NEW.id::text
    );
  END IF;

  -- If already verified at creation (edge case), fire verified notifications too
  IF NEW.status = 'verified' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payment_verification', 'success',
      'Payment Verified',
      'Payment verification has been completed for one of your referral leads.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'payment_verified:' || NEW.id::text
    );
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'enrollment', 'success',
      'Enrollment Verified',
      'A referral enrollment has been verified successfully.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'enrollment_verified:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_enrollment_created ON public.enrollments;
CREATE TRIGGER trg_amb_notify_enrollment_created
AFTER INSERT ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_enrollment_created();

-- ============= Enrollment: status transitions =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_enrollment_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.ambassador_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  -- Payment submission recorded (moved into under_verification from received)
  IF NEW.status = 'under_verification' AND OLD.status = 'received' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payment_verification', 'information',
      'Payment Submitted',
      'Payment details were submitted for one of your referral leads and are awaiting verification.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'payment_submitted:' || NEW.id::text
    );
  END IF;

  -- Payment + Enrollment Verified
  IF NEW.status = 'verified' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payment_verification', 'success',
      'Payment Verified',
      'Payment verification has been completed for one of your referral leads.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'payment_verified:' || NEW.id::text
    );
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'enrollment', 'success',
      'Enrollment Verified',
      'A referral enrollment has been verified successfully.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'enrollment_verified:' || NEW.id::text
    );
  END IF;

  -- Cancelled
  IF NEW.status = 'cancelled' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'enrollment', 'attention',
      'Enrollment Cancelled',
      'An enrollment linked to your referral has been cancelled.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'enrollment_cancelled:' || NEW.id::text
    );
  END IF;

  -- Refunded
  IF NEW.status IN ('refund_full','refund_partial') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'enrollment', 'attention',
      'Enrollment Refunded',
      'An enrollment linked to your referral has been updated after a confirmed refund.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'enrollment_refunded:' || NEW.id::text
    );
  END IF;

  -- Payment verification failed / Enrollment reversed
  IF NEW.status = 'fraud_review' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payment_verification', 'attention',
      'Payment Verification Update',
      'Payment verification could not be completed. Review the payment status for more information.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'payment_verification_failed:' || NEW.id::text
    );
  END IF;

  IF NEW.status = 'duplicate' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'enrollment', 'attention',
      'Enrollment Status Updated',
      'An enrollment linked to your referral has been reversed.',
      'enrollment', NEW.id, '/ambassador/enrollments',
      'enrollment_reversed:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_enrollment_status ON public.enrollments;
CREATE TRIGGER trg_amb_notify_enrollment_status
AFTER UPDATE OF status ON public.enrollments
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_enrollment_status();

-- ============= Payment Submission: needs more info =============
-- When an ambassador-attributed enrollment's linked payment submission requests more info,
-- surface a "Payment Information Required" notification. Match submission → enrollment by
-- ambassador_id via partner_leads.mobile? Not directly linked. Instead attach via
-- explicit enrollment lookup on partner_lead → enrollments won't map cleanly. Skip cross-linking
-- for now; the primary enrollment-status triggers above cover ambassador-visible states.
