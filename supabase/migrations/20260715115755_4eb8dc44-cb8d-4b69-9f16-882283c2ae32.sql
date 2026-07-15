
-- ============= Commission status notifications =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_commission_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_is_bonus boolean := (NEW.transaction_type = 'bonus_commission');
  v_prev numeric := 0;
  v_new numeric := 0;
  b RECORD;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Eligible
  IF NEW.status = 'eligible' AND (TG_OP = 'INSERT' OR OLD.status <> 'eligible') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'commission', 'information',
      CASE WHEN v_is_bonus THEN 'Bonus Commission Eligible' ELSE 'Commission Eligible' END,
      CASE WHEN v_is_bonus
        THEN 'A bonus commission transaction is now eligible.'
        ELSE 'A commission transaction from one of your verified referral enrollments is now eligible.' END,
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_eligible:' || NEW.id::text
    );
  END IF;

  -- Approved
  IF NEW.status = 'approved' AND (TG_OP = 'INSERT' OR OLD.status <> 'approved') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'commission', 'success',
      CASE WHEN v_is_bonus THEN 'Bonus Commission Approved' ELSE 'Commission Approved' END,
      CASE WHEN v_is_bonus
        THEN 'Your bonus commission has been approved.'
        ELSE 'Your eligible commission has been approved.' END,
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_approved:' || NEW.id::text
    );
  END IF;

  -- Available (Earnings)
  IF NEW.status = 'available' AND (TG_OP = 'INSERT' OR OLD.status <> 'available') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'earnings', 'success',
      'Commission Available',
      'Approved commission is now available in your Campus Ambassador earnings.',
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_available:' || NEW.id::text
    );

    -- Earnings milestone check using published badge thresholds (rule_type='commission_earned')
    IF TG_OP = 'UPDATE' THEN
      SELECT COALESCE(SUM(calculated_commission),0) INTO v_prev
        FROM public.ambassador_commissions
        WHERE ambassador_id = NEW.ambassador_id
          AND status IN ('approved','paid','available')
          AND id <> NEW.id;
    ELSE
      v_prev := 0;
    END IF;
    v_new := v_prev + NEW.calculated_commission;

    FOR b IN
      SELECT id, rule_threshold FROM public.ambassador_badges
      WHERE is_published = true AND rule_type = 'commission_earned'
        AND rule_threshold > v_prev AND rule_threshold <= v_new
    LOOP
      PERFORM public.tg_amb_notify_insert(
        NEW.ambassador_id, 'earnings', 'success',
        'Earnings Milestone Reached',
        'You have reached a new Campus Ambassador earnings milestone.',
        'earnings_milestone', NEW.ambassador_id, '/ambassador/earnings',
        'earnings_milestone:' || NEW.ambassador_id::text || ':' || b.rule_threshold::text
      );
    END LOOP;
  END IF;

  -- On Hold
  IF NEW.status = 'on_hold' AND (TG_OP = 'INSERT' OR OLD.status <> 'on_hold') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'commission', 'attention',
      'Commission Status Updated',
      'A commission transaction has been placed on hold.',
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_on_hold:' || NEW.id::text
    );
  END IF;

  -- Ineligible
  IF NEW.status = 'ineligible' AND (TG_OP = 'INSERT' OR OLD.status <> 'ineligible') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'commission', 'attention',
      'Commission Eligibility Updated',
      'A commission transaction is not eligible for earnings.',
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_ineligible:' || NEW.id::text
    );
  END IF;

  -- Reversed
  IF NEW.status = 'reversed' AND (TG_OP = 'INSERT' OR OLD.status <> 'reversed') THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'commission', 'attention',
      'Commission Reversed',
      'A commission transaction has been reversed. Review the transaction for more information.',
      'commission_transaction', NEW.id, '/ambassador/earnings',
      'commission_reversed:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_commission_status ON public.ambassador_commissions;
CREATE TRIGGER trg_amb_notify_commission_status
AFTER INSERT OR UPDATE OF status ON public.ambassador_commissions
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_commission_status();

-- ============= Payout status notifications =============
CREATE OR REPLACE FUNCTION public.tg_amb_notify_payout_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Submitted (on INSERT)
  IF TG_OP = 'INSERT' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'information',
      'Payout Request Submitted',
      'Your payout request has been submitted for review.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_submitted:' || NEW.id::text
    );
    RETURN NEW;
  END IF;

  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  IF NEW.status = 'under_review' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'information',
      'Payout Under Review',
      'Your payout request is currently under review.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_under_review:' || NEW.id::text
    );
  ELSIF NEW.status = 'approved' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'success',
      'Payout Approved',
      'Your payout request has been approved and is being prepared for processing.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_approved:' || NEW.id::text
    );
  ELSIF NEW.status = 'processing' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'update',
      'Payout Processing',
      'Your approved payout is currently being processed.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_processing:' || NEW.id::text
    );
  ELSIF NEW.status = 'paid' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'success',
      'Payout Completed',
      'Your Campus Ambassador payout has been completed.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_completed:' || NEW.id::text
    );
  ELSIF NEW.status = 'failed' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'attention',
      'Payout Update Required',
      'Your payout could not be completed. Review the payout status for more information.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_failed:' || NEW.id::text
    );
  ELSIF NEW.status = 'on_hold' THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'payout', 'action_required',
      'Payout Information Required',
      'Additional information is required to continue processing your payout request.',
      'payout_request', NEW.id, '/ambassador/payouts',
      'payout_on_hold:' || NEW.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_payout_status ON public.ambassador_payouts;
CREATE TRIGGER trg_amb_notify_payout_status
AFTER INSERT OR UPDATE OF status ON public.ambassador_payouts
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_payout_status();
