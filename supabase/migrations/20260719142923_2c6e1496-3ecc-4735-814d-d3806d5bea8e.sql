
-- Review Management System
CREATE TABLE IF NOT EXISTS public.student_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  reviewer_avatar_url TEXT,
  reviewer_linkedin_url TEXT,
  trigger_event TEXT NOT NULL CHECK (trigger_event IN ('course_completion','internship_completion','certificate_completion','placement','manual')),
  target_type TEXT NOT NULL CHECK (target_type IN ('course','internship','certificate','placement','platform')),
  target_id UUID,
  target_slug TEXT,
  target_label TEXT,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  review_text TEXT NOT NULL,
  video_url TEXT,
  video_thumbnail_url TEXT,
  before_snapshot JSONB DEFAULT '{}'::jsonb,
  after_snapshot JSONB DEFAULT '{}'::jsonb,
  salary_before_lpa NUMERIC,
  salary_after_lpa NUMERIC,
  salary_growth_pct NUMERIC GENERATED ALWAYS AS (
    CASE WHEN COALESCE(salary_before_lpa,0)>0 THEN ROUND(((salary_after_lpa - salary_before_lpa)/salary_before_lpa*100)::numeric,1) ELSE NULL END
  ) STORED,
  career_growth_notes TEXT,
  company_name TEXT,
  company_logo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','spam','archived')),
  spam_score NUMERIC DEFAULT 0,
  moderation_notes TEXT,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  display_locations TEXT[] DEFAULT ARRAY['course_pages']::text[],
  featured BOOLEAN DEFAULT false,
  seo_slug TEXT UNIQUE,
  success_story_id UUID REFERENCES public.success_stories(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'form',
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_reviews_status_pub ON public.student_reviews(status, published_at DESC) WHERE status='approved';
CREATE INDEX IF NOT EXISTS idx_student_reviews_target ON public.student_reviews(target_type, target_id) WHERE status='approved';
CREATE INDEX IF NOT EXISTS idx_student_reviews_display ON public.student_reviews USING GIN(display_locations) WHERE status='approved';
CREATE INDEX IF NOT EXISTS idx_student_reviews_user ON public.student_reviews(user_id);

GRANT SELECT ON public.student_reviews TO anon, authenticated;
GRANT INSERT, UPDATE ON public.student_reviews TO authenticated;
GRANT ALL ON public.student_reviews TO service_role;
ALTER TABLE public.student_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved reviews are public" ON public.student_reviews FOR SELECT USING (status='approved');
CREATE POLICY "Users can view their own reviews" ON public.student_reviews FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Users can submit reviews" ON public.student_reviews FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Users can update pending own reviews" ON public.student_reviews FOR UPDATE TO authenticated
  USING (auth.uid()=user_id AND status='pending') WITH CHECK (auth.uid()=user_id AND status='pending');
CREATE POLICY "Admins manage all reviews" ON public.student_reviews FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Review requests (auto-trigger)
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  trigger_event TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  target_slug TEXT,
  target_label TEXT,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','opened','submitted','expired','cancelled')),
  channel TEXT DEFAULT 'email',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  review_id UUID REFERENCES public.student_reviews(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '60 days'),
  reminders_sent INTEGER DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_review_requests_user ON public.review_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_review_requests_status ON public.review_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_requests_token ON public.review_requests(token);

GRANT SELECT, INSERT, UPDATE ON public.review_requests TO authenticated;
GRANT SELECT ON public.review_requests TO anon;
GRANT ALL ON public.review_requests TO service_role;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own review requests" ON public.review_requests FOR SELECT TO authenticated USING (auth.uid()=user_id);
CREATE POLICY "Anon can lookup by token" ON public.review_requests FOR SELECT TO anon USING (true);
CREATE POLICY "Users update own request" ON public.review_requests FOR UPDATE TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE POLICY "Admins manage review requests" ON public.review_requests FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

-- Auto-trigger review request on enrollment completion
CREATE OR REPLACE FUNCTION public.trigger_review_request_on_enrollment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    INSERT INTO public.review_requests (user_id, trigger_event, target_type, target_id)
    VALUES (NEW.user_id, 'course_completion', 'course', NEW.course_id)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='enrollments' AND column_name='status') THEN
    DROP TRIGGER IF EXISTS trg_review_request_enrollment ON public.enrollments;
    CREATE TRIGGER trg_review_request_enrollment
      AFTER INSERT OR UPDATE OF status ON public.enrollments
      FOR EACH ROW EXECUTE FUNCTION public.trigger_review_request_on_enrollment();
  END IF;
END $$;

-- Certificate trigger
CREATE OR REPLACE FUNCTION public.trigger_review_request_on_certificate()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.review_requests (user_id, trigger_event, target_type, target_id)
  VALUES (NEW.user_id, 'certificate_completion', 'certificate', NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='certificates') THEN
    DROP TRIGGER IF EXISTS trg_review_request_certificate ON public.certificates;
    CREATE TRIGGER trg_review_request_certificate
      AFTER INSERT ON public.certificates
      FOR EACH ROW EXECUTE FUNCTION public.trigger_review_request_on_certificate();
  END IF;
END $$;

-- updated_at trigger for reviews
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_touch_reviews ON public.student_reviews;
CREATE TRIGGER trg_touch_reviews BEFORE UPDATE ON public.student_reviews FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
DROP TRIGGER IF EXISTS trg_touch_review_requests ON public.review_requests;
CREATE TRIGGER trg_touch_review_requests BEFORE UPDATE ON public.review_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
