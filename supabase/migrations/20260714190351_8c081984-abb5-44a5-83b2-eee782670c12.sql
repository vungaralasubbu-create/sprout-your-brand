
ALTER TABLE public.student_activity
  DROP CONSTRAINT IF EXISTS student_activity_activity_type_check;

ALTER TABLE public.student_activity
  ADD CONSTRAINT student_activity_activity_type_check
  CHECK (activity_type = ANY (ARRAY[
    'lesson_completed','assignment_submitted','assessment_completed',
    'course_completed','certificate_issued',
    'program_started','program_opened','module_opened','lesson_opened',
    'module_unlocked','program_content_completed',
    'session_details_opened','session_join_attempt',
    'session_recording_opened','session_resource_opened'
  ]));
