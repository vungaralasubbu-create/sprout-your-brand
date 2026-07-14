
-- 1. Admin role enum
DO $$ BEGIN
  CREATE TYPE public.admin_role_type AS ENUM (
    'super_admin','sales_admin','lead_manager','payment_verifier','payout_manager',
    'referral_manager','brand_manager','support_agent','employment_admin','payroll_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.admin_account_status AS ENUM ('active','suspended','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Sequence for admin codes
CREATE SEQUENCE IF NOT EXISTS public.admin_user_code_seq START 1;

-- 3. admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_code text UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  mobile text,
  admin_role public.admin_role_type NOT NULL,
  account_status public.admin_account_status NOT NULL DEFAULT 'active',
  last_login_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 4. admin_role_permissions (default permissions per role)
CREATE TABLE IF NOT EXISTS public.admin_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_role public.admin_role_type NOT NULL,
  permission_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (admin_role, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_role_permissions TO authenticated;
GRANT ALL ON public.admin_role_permissions TO service_role;
ALTER TABLE public.admin_role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. admin_permission_overrides (user-specific grants/denies)
CREATE TABLE IF NOT EXISTS public.admin_permission_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  allowed boolean NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_permission_overrides TO authenticated;
GRANT ALL ON public.admin_permission_overrides TO service_role;
ALTER TABLE public.admin_permission_overrides ENABLE ROW LEVEL SECURITY;

-- 6. Security definer functions
CREATE OR REPLACE FUNCTION public.is_active_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id AND account_status = 'active'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('super_admin','admin','partner_manager')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = _user_id
      AND account_status = 'active'
      AND admin_role = 'super_admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
RETURNS public.admin_role_type LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT admin_role FROM public.admin_users
  WHERE user_id = _user_id AND account_status = 'active'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _override boolean;
  _role public.admin_role_type;
  _legacy boolean;
BEGIN
  -- Legacy super admin bypass
  IF public.is_super_admin(_user_id) THEN RETURN TRUE; END IF;

  -- Legacy admin roles (user_roles) get full access for backwards compatibility
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin','partner_manager')
  ) INTO _legacy;
  IF _legacy AND NOT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = _user_id) THEN
    RETURN TRUE;
  END IF;

  -- Check per-user override first
  SELECT allowed INTO _override
  FROM public.admin_permission_overrides
  WHERE user_id = _user_id AND permission_key = _permission
  LIMIT 1;
  IF _override IS NOT NULL THEN RETURN _override; END IF;

  -- Fall back to role default
  SELECT admin_role INTO _role FROM public.admin_users
  WHERE user_id = _user_id AND account_status = 'active' LIMIT 1;
  IF _role IS NULL THEN RETURN FALSE; END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.admin_role_permissions
    WHERE admin_role = _role AND permission_key = _permission
  );
END $$;

-- Update is_admin to include admin_users
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_active_admin(_user_id);
$$;

-- 7. Trigger to auto-generate admin_code + updated_at
CREATE OR REPLACE FUNCTION public.tg_admin_users_defaults()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.admin_code IS NULL OR NEW.admin_code = '' THEN
    NEW.admin_code := 'GL-ADM-' || to_char(now(),'YYYY') || '-' ||
      lpad(nextval('public.admin_user_code_seq')::text, 4, '0');
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS admin_users_defaults ON public.admin_users;
CREATE TRIGGER admin_users_defaults
BEFORE INSERT OR UPDATE ON public.admin_users
FOR EACH ROW EXECUTE FUNCTION public.tg_admin_users_defaults();

-- 8. RLS policies
DROP POLICY IF EXISTS "Active admins can view admin users" ON public.admin_users;
CREATE POLICY "Active admins can view admin users" ON public.admin_users
  FOR SELECT TO authenticated USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage admin users" ON public.admin_users;
CREATE POLICY "Super admins manage admin users" ON public.admin_users
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Active admins view role permissions" ON public.admin_role_permissions;
CREATE POLICY "Active admins view role permissions" ON public.admin_role_permissions
  FOR SELECT TO authenticated USING (public.is_active_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage role permissions" ON public.admin_role_permissions;
CREATE POLICY "Super admins manage role permissions" ON public.admin_role_permissions
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins view own overrides, super admin view all" ON public.admin_permission_overrides;
CREATE POLICY "Admins view own overrides, super admin view all" ON public.admin_permission_overrides
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Super admins manage overrides" ON public.admin_permission_overrides;
CREATE POLICY "Super admins manage overrides" ON public.admin_permission_overrides
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 9. Seed default permission matrix
INSERT INTO public.admin_role_permissions (admin_role, permission_key) VALUES
-- Super Admin gets everything via has_admin_permission bypass, but seed a marker
('super_admin','*'),

-- Sales Admin
('sales_admin','sales_partners.view'),
('sales_admin','sales_partners.manage'),
('sales_admin','analytics.view'),
('sales_admin','sales_command.view'),
('sales_admin','programs.view'),
('sales_admin','programs.manage'),
('sales_admin','leads.view'),
('sales_admin','payments.view'),
('sales_admin','earnings.view'),

-- Lead Manager
('lead_manager','leads.view'),
('lead_manager','leads.create'),
('lead_manager','leads.upload'),
('lead_manager','leads.assign'),
('lead_manager','leads.reassign'),
('lead_manager','lead_ownership.view'),
('lead_manager','lead_ownership.decide'),

-- Payment Verifier
('payment_verifier','payments.view'),
('payment_verifier','payments.review'),
('payment_verifier','payments.verify'),
('payment_verifier','payments.reject'),
('payment_verifier','payments.request_info'),

-- Payout Manager
('payout_manager','earnings.view'),
('payout_manager','payouts.view'),
('payout_manager','payouts.process'),
('payout_manager','payouts.approve'),
('payout_manager','payouts.hold'),

-- Referral Manager
('referral_manager','referrals.view'),
('referral_manager','referrals.approve'),
('referral_manager','referrals.reject'),

-- Brand Manager
('brand_manager','brands.view'),
('brand_manager','brands.verify'),
('brand_manager','brands.request_info'),
('brand_manager','brands.reject'),

-- Support Agent
('support_agent','support.view'),
('support_agent','support.reply'),
('support_agent','support.request_info'),
('support_agent','support.resolve'),

-- Employment Admin
('employment_admin','employment.view'),
('employment_admin','employment.approve'),
('employment_admin','employment.manage'),
('employment_admin','attendance.view'),
('employment_admin','attendance.manage'),

-- Payroll Admin
('payroll_admin','payroll.view'),
('payroll_admin','payroll.prepare'),
('payroll_admin','payroll.edit'),
('payroll_admin','payroll.approve'),
('payroll_admin','payroll.generate_slips'),
('payroll_admin','payroll.pay')
ON CONFLICT (admin_role, permission_key) DO NOTHING;
