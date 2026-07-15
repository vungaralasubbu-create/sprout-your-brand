-- Enums
DO $$ BEGIN
  CREATE TYPE public.contact_enquiry_topic AS ENUM
    ('general','partnership','institution','business','media','careers','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_enquiry_source AS ENUM
    ('contact_page','ai_prepared','router','manual_topic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.contact_enquiry_status AS ENUM
    ('submitted','in_review','routed','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Reference generator: CON- + 7 chars from a crockford-ish alphabet
CREATE OR REPLACE FUNCTION public.generate_contact_reference()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  ref text;
  i int;
BEGIN
  LOOP
    ref := 'CON-';
    FOR i IN 1..7 LOOP
      ref := ref || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.contact_enquiries WHERE reference = ref);
  END LOOP;
  RETURN ref;
END $$;

-- Table
CREATE TABLE public.contact_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text UNIQUE,
  topic public.contact_enquiry_topic NOT NULL,
  routing_destination text,
  name text NOT NULL,
  email text NOT NULL,
  email_normalised text NOT NULL,
  organisation text,
  title text NOT NULL,
  summary text NOT NULL,
  title_normalised text NOT NULL,
  submission_source public.contact_enquiry_source NOT NULL DEFAULT 'contact_page',
  status public.contact_enquiry_status NOT NULL DEFAULT 'submitted',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  idempotency_key text,
  ip_hash text,
  is_spam boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX contact_enquiries_idem_unique
  ON public.contact_enquiries (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX contact_enquiries_email_topic_recent
  ON public.contact_enquiries (email_normalised, topic, created_at DESC);

CREATE INDEX contact_enquiries_created_at_idx
  ON public.contact_enquiries (created_at DESC);

-- Reference + normalisation trigger
CREATE OR REPLACE FUNCTION public.contact_enquiries_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.reference IS NULL OR NEW.reference = '' THEN
    NEW.reference := public.generate_contact_reference();
  END IF;
  NEW.email_normalised := lower(btrim(NEW.email));
  NEW.title_normalised := lower(btrim(regexp_replace(NEW.title, '\s+', ' ', 'g')));
  RETURN NEW;
END $$;

CREATE TRIGGER contact_enquiries_before_insert
BEFORE INSERT ON public.contact_enquiries
FOR EACH ROW EXECUTE FUNCTION public.contact_enquiries_before_insert();

CREATE OR REPLACE FUNCTION public.contact_enquiries_before_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

CREATE TRIGGER contact_enquiries_before_update
BEFORE UPDATE ON public.contact_enquiries
FOR EACH ROW EXECUTE FUNCTION public.contact_enquiries_before_update();

-- Grants: only server-role writes and admin reads. No anon/authenticated access.
GRANT ALL ON public.contact_enquiries TO service_role;

ALTER TABLE public.contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Admins may read enquiries via the Data API (uses existing has_role).
CREATE POLICY "Admins can read contact enquiries"
ON public.contact_enquiries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No INSERT/UPDATE/DELETE policies for anon or authenticated — writes go through
-- the server function using the service role client.
