
-- Add columns
ALTER TABLE public.payment_links
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','disabled','archived')),
  ADD COLUMN IF NOT EXISTS disabled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;

-- Drop the (course_id, plan) uniqueness — admin can create multiple links per program/plan
ALTER TABLE public.payment_links DROP CONSTRAINT IF EXISTS payment_links_course_id_plan_key;

-- Sequence for the human-readable Payment Link code
CREATE SEQUENCE IF NOT EXISTS public.payment_link_code_seq;

-- Backfill existing rows
UPDATE public.payment_links
SET code = 'GL-PAY-' || to_char(COALESCE(created_at, now()), 'YYYY') || '-' || lpad(nextval('public.payment_link_code_seq')::text, 4, '0')
WHERE code IS NULL;

UPDATE public.payment_links
SET name = COALESCE(name, 'Payment Link ' || COALESCE(code, id::text))
WHERE name IS NULL;

UPDATE public.payment_links
SET status = CASE WHEN is_active THEN 'active' ELSE 'disabled' END
WHERE status IS NULL OR status = 'active' AND is_active = false;

ALTER TABLE public.payment_links
  ALTER COLUMN code SET NOT NULL,
  ALTER COLUMN name SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_links_code_key ON public.payment_links(code);

-- Trigger: auto-generate code + keep is_active in sync with status
CREATE OR REPLACE FUNCTION public.tg_payment_links_defaults()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := 'GL-PAY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.payment_link_code_seq')::text, 4, '0');
  END IF;
  IF NEW.name IS NULL OR NEW.name = '' THEN
    NEW.name := 'Payment Link ' || NEW.code;
  END IF;
  IF NEW.status = 'active' THEN
    NEW.is_active := true;
  ELSE
    NEW.is_active := false;
  END IF;
  IF (TG_OP = 'UPDATE') AND OLD.status <> 'disabled' AND NEW.status = 'disabled' THEN
    NEW.disabled_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_links_defaults ON public.payment_links;
CREATE TRIGGER trg_payment_links_defaults
BEFORE INSERT OR UPDATE ON public.payment_links
FOR EACH ROW EXECUTE FUNCTION public.tg_payment_links_defaults();

-- Refine partner-visible policy: only active links + published courses (unchanged behavior, but keyed off status)
DROP POLICY IF EXISTS payment_links_select_partners_active ON public.payment_links;
CREATE POLICY payment_links_select_partners_active ON public.payment_links
  FOR SELECT TO authenticated
  USING (
    is_admin(auth.uid()) OR (
      status = 'active'
      AND (is_partner(auth.uid()) OR is_admin(auth.uid()))
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = payment_links.course_id
          AND c.status = 'published'
          AND c.is_published = true
      )
    )
  );
