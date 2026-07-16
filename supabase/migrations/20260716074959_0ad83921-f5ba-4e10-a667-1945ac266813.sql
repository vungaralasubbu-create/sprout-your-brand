
-- Extend existing content_status enum
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'in_review';
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'scheduled';

-- New content_type enum
DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM (
    'learn_guide','glossary','comparison','faq','roadmap',
    'career_guide','interview_guide','cheat_sheet','learning_path','program_support'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
