
-- Backfill orphaned approved applications
DO $$
DECLARE
  a RECORD;
  u_id uuid;
BEGIN
  FOR a IN
    SELECT id, email, full_name, mobile, city, state
    FROM public.partner_applications
    WHERE status = 'approved' AND user_id IS NULL AND email IS NOT NULL
  LOOP
    SELECT id INTO u_id FROM auth.users WHERE lower(email) = lower(a.email) LIMIT 1;
    IF u_id IS NOT NULL THEN
      UPDATE public.partner_applications SET user_id = u_id WHERE id = a.id;
      INSERT INTO public.partners (user_id, application_id, display_name, email, mobile, city, state, status)
      VALUES (u_id, a.id, a.full_name, a.email, a.mobile, a.city, a.state, 'active')
      ON CONFLICT (user_id) DO NOTHING;
      INSERT INTO public.user_roles (user_id, role) VALUES (u_id, 'partner')
      ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
  END LOOP;
END$$;

-- OTP codes table (server-only, for future SMS OTP login)
CREATE TABLE IF NOT EXISTS public.auth_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  mobile text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'signin',
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_otp_email_created ON public.auth_otp_codes (email, created_at DESC);
GRANT ALL ON public.auth_otp_codes TO service_role;
ALTER TABLE public.auth_otp_codes ENABLE ROW LEVEL SECURITY;
