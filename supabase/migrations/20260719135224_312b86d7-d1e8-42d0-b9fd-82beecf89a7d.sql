
-- Programs listing: WHERE is_published AND status ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_courses_published_order
  ON public.courses (is_published, status, display_order)
  WHERE is_published = true;

-- Admin applications table: default sort by created_at, filter by status
CREATE INDEX IF NOT EXISTS idx_course_applications_status_created
  ON public.course_applications (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_applications_created
  ON public.course_applications (created_at DESC);

-- Lead Intelligence: hot list ordered by score within a status bucket
CREATE INDEX IF NOT EXISTS idx_platform_leads_status_score
  ON public.platform_leads (status, score DESC);

-- Behavior recall / automation decision engine: user timeline
CREATE INDEX IF NOT EXISTS idx_automation_events_user_created
  ON public.automation_events (user_id, created_at DESC);

-- Student dashboard: recent enrollments per student
CREATE INDEX IF NOT EXISTS idx_enrollments_student_created
  ON public.enrollments (student_user_id, created_at DESC);
