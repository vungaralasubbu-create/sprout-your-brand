
-- ============================================================
-- Campaign ending reminder configuration
-- ============================================================
ALTER TABLE public.ambassador_bonus_campaigns
  ADD COLUMN IF NOT EXISTS ending_reminder_days integer NOT NULL DEFAULT 3;

-- ============================================================
-- Helper: is ambassador eligible for a campaign (campus_scope match)
-- ============================================================
CREATE OR REPLACE FUNCTION public.amb_campaign_matches_scope(
  _campus_scope text, _college_name text
) RETURNS boolean
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    _campus_scope IS NULL
    OR btrim(_campus_scope) = ''
    OR lower(_campus_scope) IN ('all','any','national','nationwide','open')
    OR (
      _college_name IS NOT NULL
      AND lower(btrim(_college_name)) = lower(btrim(_campus_scope))
    );
$$;

-- ============================================================
-- Helper: notify all eligible ambassadors about a campaign event
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_campaign_broadcast(
  _campaign_id uuid,
  _title text,
  _message text,
  _dedupe_prefix text,
  _notif_type text,
  _participants_only boolean
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c public.ambassador_bonus_campaigns%ROWTYPE;
  a RECORD;
BEGIN
  SELECT * INTO c FROM public.ambassador_bonus_campaigns WHERE id = _campaign_id;
  IF NOT FOUND THEN RETURN; END IF;
  -- Only for public / non-draft published campaigns
  IF COALESCE(c.visibility,'public') NOT IN ('public','published','live') THEN RETURN; END IF;
  IF c.status = 'draft' THEN RETURN; END IF;

  FOR a IN
    SELECT p.id, p.college_name
    FROM public.campus_ambassador_profiles p
    WHERE p.status = 'active'
      AND public.amb_campaign_matches_scope(c.campus_scope, p.college_name)
      AND (
        NOT _participants_only
        OR EXISTS (
          SELECT 1 FROM public.ambassador_campaign_milestone_achievements m
          WHERE m.ambassador_id = p.id AND m.campaign_id = c.id
        )
        OR EXISTS (
          SELECT 1 FROM public.ambassador_commissions ac
          WHERE ac.ambassador_id = p.id
            AND ac.transaction_type = 'bonus_commission'
            AND ac.campaign_id = c.id
        )
      )
  LOOP
    PERFORM public.tg_amb_notify_insert(
      a.id, 'campaign', _notif_type,
      _title, _message,
      'campaign', c.id,
      '/ambassador/leaderboard?tab=campaigns&campaign=' || c.id::text,
      _dedupe_prefix || ':' || c.id::text || ':' || a.id::text
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Campaign lifecycle trigger (INSERT + UPDATE of status)
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_campaign_lifecycle()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Campaign Available: on INSERT non-draft OR on transition out of draft
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'draft' AND COALESCE(NEW.visibility,'public') IN ('public','published','live') THEN
      PERFORM public.tg_amb_notify_campaign_broadcast(
        NEW.id, 'New Campaign Available',
        'A new Campus Ambassador campaign is available for you.',
        'campaign_available', 'information', false
      );
    END IF;
    IF NEW.status = 'active' THEN
      PERFORM public.tg_amb_notify_campaign_broadcast(
        NEW.id, 'Campaign Started',
        'An eligible Campus Ambassador campaign is now active.',
        'campaign_started', 'information', false
      );
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE: transitions
  IF NEW.status <> OLD.status OR COALESCE(NEW.visibility,'') <> COALESCE(OLD.visibility,'') THEN
    -- Just became available (draft -> non-draft, or private -> public)
    IF (OLD.status = 'draft' AND NEW.status <> 'draft'
        AND COALESCE(NEW.visibility,'public') IN ('public','published','live'))
       OR (COALESCE(OLD.visibility,'') NOT IN ('public','published','live')
           AND COALESCE(NEW.visibility,'') IN ('public','published','live')
           AND NEW.status <> 'draft') THEN
      PERFORM public.tg_amb_notify_campaign_broadcast(
        NEW.id, 'New Campaign Available',
        'A new Campus Ambassador campaign is available for you.',
        'campaign_available', 'information', false
      );
    END IF;

    -- Campaign Started: transitioned into 'active'
    IF NEW.status = 'active' AND OLD.status <> 'active' THEN
      PERFORM public.tg_amb_notify_campaign_broadcast(
        NEW.id, 'Campaign Started',
        'An eligible Campus Ambassador campaign is now active.',
        'campaign_started', 'information', false
      );
    END IF;

    -- Campaign Completed
    IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
      PERFORM public.tg_amb_notify_campaign_broadcast(
        NEW.id, 'Campaign Completed',
        'A Campus Ambassador campaign you participated in has been completed.',
        'campaign_completed', 'update', true
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_campaign_lifecycle_ins ON public.ambassador_bonus_campaigns;
CREATE TRIGGER trg_amb_notify_campaign_lifecycle_ins
AFTER INSERT ON public.ambassador_bonus_campaigns
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_campaign_lifecycle();

DROP TRIGGER IF EXISTS trg_amb_notify_campaign_lifecycle_upd ON public.ambassador_bonus_campaigns;
CREATE TRIGGER trg_amb_notify_campaign_lifecycle_upd
AFTER UPDATE OF status, visibility ON public.ambassador_bonus_campaigns
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_campaign_lifecycle();

-- ============================================================
-- Campaign Ending Soon: callable by scheduler (idempotent per campaign)
-- ============================================================
CREATE OR REPLACE FUNCTION public.notify_campaigns_ending_soon()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  c RECORD; n int := 0;
BEGIN
  FOR c IN
    SELECT * FROM public.ambassador_bonus_campaigns
    WHERE status = 'active'
      AND ends_at IS NOT NULL
      AND ends_at > now()
      AND ends_at <= now() + make_interval(days => COALESCE(ending_reminder_days, 3))
  LOOP
    PERFORM public.tg_amb_notify_campaign_broadcast(
      c.id, 'Campaign Ending Soon',
      'An active Campus Ambassador campaign is ending soon.',
      'campaign_ending_soon:' || to_char(c.ends_at,'YYYYMMDD'),
      'reminder', true
    );
    n := n + 1;
  END LOOP;
  RETURN n;
END;
$$;

GRANT EXECUTE ON FUNCTION public.notify_campaigns_ending_soon() TO service_role;

-- ============================================================
-- Milestone Achievement notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_milestone_achieved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_is_final boolean := false;
  v_max_order int;
  v_this_order int;
BEGIN
  SELECT display_order INTO v_this_order
    FROM public.ambassador_campaign_milestones WHERE id = NEW.milestone_id;
  SELECT MAX(display_order) INTO v_max_order
    FROM public.ambassador_campaign_milestones
    WHERE campaign_id = NEW.campaign_id AND is_active = true;
  v_is_final := v_this_order IS NOT NULL
                AND v_max_order IS NOT NULL
                AND v_this_order = v_max_order;

  IF v_is_final THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'milestone', 'success',
      'Campaign Goal Achieved',
      'You''ve completed the final milestone for a Campus Ambassador campaign.',
      'milestone_achievement', NEW.id,
      '/ambassador/leaderboard?tab=campaigns&campaign=' || NEW.campaign_id::text,
      'campaign_goal_achieved:' || NEW.id::text
    );
  ELSE
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'milestone', 'success',
      'Campaign Milestone Achieved',
      'You''ve reached a Campus Ambassador campaign milestone.',
      'milestone_achievement', NEW.id,
      '/ambassador/leaderboard?tab=campaigns&campaign=' || NEW.campaign_id::text,
      'campaign_milestone_achieved:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_milestone_achieved ON public.ambassador_campaign_milestone_achievements;
CREATE TRIGGER trg_amb_notify_milestone_achieved
AFTER INSERT ON public.ambassador_campaign_milestone_achievements
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_milestone_achieved();

-- ============================================================
-- Badge Achievement notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_badge_earned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_name text;
  v_msg text;
BEGIN
  SELECT name INTO v_name FROM public.ambassador_badges
   WHERE id = NEW.badge_id AND is_published = true;
  IF v_name IS NOT NULL AND btrim(v_name) <> '' THEN
    v_msg := 'You''ve earned the ' || v_name || ' badge.';
  ELSE
    v_msg := 'You''ve earned a new Campus Ambassador badge.';
  END IF;

  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id, 'badge', 'success',
    'New Badge Earned',
    v_msg,
    'badge_achievement', NEW.id,
    '/ambassador/profile#badges',
    'badge_earned:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_badge_earned ON public.ambassador_badge_achievements;
CREATE TRIGGER trg_amb_notify_badge_earned
AFTER INSERT ON public.ambassador_badge_achievements
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_badge_earned();

-- ============================================================
-- Level Assignment notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_level_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_new_order int; v_prev_order int;
  v_new_name text;
  v_msg text;
  v_upgrade boolean;
BEGIN
  SELECT level_order, name INTO v_new_order, v_new_name
    FROM public.ambassador_levels WHERE id = NEW.level_id;
  IF NEW.previous_level_id IS NOT NULL THEN
    SELECT level_order INTO v_prev_order
      FROM public.ambassador_levels WHERE id = NEW.previous_level_id;
  END IF;
  v_upgrade := (v_prev_order IS NULL OR (v_new_order IS NOT NULL AND v_new_order > v_prev_order));

  IF v_upgrade THEN
    IF v_new_name IS NOT NULL AND btrim(v_new_name) <> '' THEN
      v_msg := 'You''ve reached ' || v_new_name || '.';
    ELSE
      v_msg := 'You''ve reached a new level in the Glintr Campus Ambassador Program.';
    END IF;
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'level', 'success',
      'New Ambassador Level Achieved',
      v_msg,
      'level_assignment', NEW.id,
      '/ambassador/profile#level',
      'level_achieved:' || NEW.id::text
    );
  ELSE
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'level', 'update',
      'Ambassador Level Updated',
      'Your Campus Ambassador level has been updated. Review your level details for more information.',
      'level_assignment', NEW.id,
      '/ambassador/profile#level',
      'level_updated:' || NEW.id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_level_change ON public.ambassador_level_assignments;
CREATE TRIGGER trg_amb_notify_level_change
AFTER INSERT ON public.ambassador_level_assignments
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_level_change();

-- ============================================================
-- Leaderboard threshold notifications (rank movements)
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_rank_thresholds()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_ctx text;
  v_period text := COALESCE(NEW.period_key, 'current');
  v_route text;
  v_lb_type text := NEW.leaderboard_type::text;
BEGIN
  -- Build context / route
  IF v_lb_type = 'program' AND NEW.program_id IS NOT NULL THEN
    v_route := '/ambassador/leaderboard?tab=programs&program=' || NEW.program_id::text;
    v_ctx := 'program:' || NEW.program_id::text;
  ELSIF v_lb_type = 'campaign' AND NEW.campaign_id IS NOT NULL THEN
    v_route := '/ambassador/leaderboard?tab=campaigns&campaign=' || NEW.campaign_id::text;
    v_ctx := 'campaign:' || NEW.campaign_id::text;
  ELSIF v_lb_type = 'monthly' THEN
    v_route := '/ambassador/leaderboard?tab=monthly&period=' || v_period;
    v_ctx := 'monthly:' || v_period;
  ELSIF v_lb_type = 'college' THEN
    v_route := '/ambassador/leaderboard?tab=college';
    v_ctx := 'college:' || v_period;
  ELSE
    v_route := '/ambassador/leaderboard';
    v_ctx := 'overall:' || v_period;
  END IF;

  -- Rank #1 (newly)
  IF NEW.current_rank = 1
     AND (NEW.previous_rank IS NULL OR NEW.previous_rank <> 1) THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'leaderboard', 'success',
      'You''ve Reached Rank #1',
      'You''re currently ranked #1 in an eligible Campus Ambassador leaderboard.',
      'leaderboard_rank', NEW.id,
      v_route,
      'lb_rank1:' || v_ctx
    );
  END IF;

  -- Top 3 (newly entered, from outside)
  IF NEW.current_rank BETWEEN 1 AND 3
     AND (NEW.previous_rank IS NULL OR NEW.previous_rank > 3) THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'leaderboard', 'success',
      'You''ve Entered The Top 3',
      'Your verified Campus Ambassador performance has moved you into the Top 3.',
      'leaderboard_rank', NEW.id,
      v_route,
      'lb_top3:' || v_ctx
    );
  END IF;

  -- Top 10 (newly entered, from outside)
  IF NEW.current_rank BETWEEN 1 AND 10
     AND (NEW.previous_rank IS NULL OR NEW.previous_rank > 10) THEN
    PERFORM public.tg_amb_notify_insert(
      NEW.ambassador_id, 'leaderboard', 'success',
      'You''ve Entered The Top 10',
      'Your verified Campus Ambassador performance has moved you into the Top 10.',
      'leaderboard_rank', NEW.id,
      v_route,
      'lb_top10:' || v_ctx
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_rank_thresholds ON public.ambassador_rank_movements;
CREATE TRIGGER trg_amb_notify_rank_thresholds
AFTER INSERT ON public.ambassador_rank_movements
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_rank_thresholds();

-- ============================================================
-- Final Monthly Rank Snapshot notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_final_rank()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.leaderboard_type <> 'monthly' THEN RETURN NEW; END IF;
  IF NEW.finalised_at IS NULL THEN RETURN NEW; END IF;
  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id, 'leaderboard', 'update',
    'Your Monthly Rank Is Final',
    'Your final Campus Ambassador rank for the latest monthly ranking period is available. Final Rank #'
      || NEW.rank_position::text || '.',
    'leaderboard_snapshot', NEW.id,
    '/ambassador/rank-history?period=' || COALESCE(NEW.period_key,''),
    'final_monthly_rank:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_final_rank ON public.ambassador_leaderboard_snapshots;
CREATE TRIGGER trg_amb_notify_final_rank
AFTER INSERT ON public.ambassador_leaderboard_snapshots
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_final_rank();

-- ============================================================
-- Recognition Achievement notifications
-- ============================================================
CREATE OR REPLACE FUNCTION public.tg_amb_notify_recognition()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_msg text;
  v_route text := '/ambassador/recognition';
BEGIN
  IF NEW.recognition_title IS NOT NULL AND btrim(NEW.recognition_title) <> '' THEN
    v_msg := 'You''ve been recognised as ' || NEW.recognition_title || '.';
  ELSE
    v_msg := 'You''ve received a new Glintr Campus Ambassador recognition.';
  END IF;

  IF NEW.campaign_id IS NOT NULL THEN
    v_route := '/ambassador/recognition?campaign=' || NEW.campaign_id::text;
  ELSIF NEW.program_id IS NOT NULL THEN
    v_route := '/ambassador/recognition?program=' || NEW.program_id::text;
  END IF;

  PERFORM public.tg_amb_notify_insert(
    NEW.ambassador_id, 'recognition', 'success',
    'New Ambassador Recognition',
    v_msg,
    'recognition_achievement', NEW.id,
    v_route,
    'recognition_awarded:' || NEW.id::text
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_amb_notify_recognition ON public.ambassador_recognition_achievements;
CREATE TRIGGER trg_amb_notify_recognition
AFTER INSERT ON public.ambassador_recognition_achievements
FOR EACH ROW EXECUTE FUNCTION public.tg_amb_notify_recognition();
