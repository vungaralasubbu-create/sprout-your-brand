-- Prevent students from selecting the assessment answer key.
-- Column-level GRANTs override row-level policies for column visibility.
-- Admin/service scoring reads correct_answers via the admin (service_role) client.
REVOKE SELECT ON public.assessment_questions FROM authenticated;
GRANT SELECT (id, assessment_id, question_type, question_text, options, points, display_order, created_at, updated_at)
  ON public.assessment_questions TO authenticated;
-- Keep admin write paths working through authenticated role for INSERT/UPDATE/DELETE (RLS still gates by is_admin)
GRANT INSERT, UPDATE, DELETE ON public.assessment_questions TO authenticated;
GRANT ALL ON public.assessment_questions TO service_role;