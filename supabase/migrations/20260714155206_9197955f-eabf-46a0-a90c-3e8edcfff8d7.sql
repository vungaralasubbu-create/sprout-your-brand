
-- ============================================================================
-- FULL-TIME SALES PROFESSIONAL EMPLOYEE SYSTEM
-- ============================================================================

-- 1. employee_profiles ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL UNIQUE REFERENCES public.partners(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  employee_code TEXT NOT NULL UNIQUE,
  joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employment_status TEXT NOT NULL DEFAULT 'active'
    CHECK (employment_status IN ('active','suspended','on_leave','exited')),
  work_model TEXT NOT NULL DEFAULT 'full_time',
  salary_cycle TEXT NOT NULL DEFAULT 'monthly',
  payroll_entity_name TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  exited_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.employee_profiles TO authenticated;
GRANT ALL ON public.employee_profiles TO service_role;
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own profile" ON public.employee_profiles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can view all employee profiles" ON public.employee_profiles
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER employee_profiles_updated_at BEFORE UPDATE ON public.employee_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 2. attendance_settings ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  work_start_time TIME NOT NULL DEFAULT '10:00',
  late_mark_time TIME NOT NULL DEFAULT '10:30',
  min_hours_full_day NUMERIC(4,2) NOT NULL DEFAULT 8.0,
  min_hours_half_day NUMERIC(4,2) NOT NULL DEFAULT 4.0,
  working_days INT[] NOT NULL DEFAULT ARRAY[1,2,3,4,5,6], -- 0=Sun..6=Sat
  weekly_off_days INT[] NOT NULL DEFAULT ARRAY[0],
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.attendance_settings TO authenticated;
GRANT ALL ON public.attendance_settings TO service_role;
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees and admins can read attendance settings" ON public.attendance_settings
  FOR SELECT TO authenticated USING (
    public.is_admin(auth.uid())
    OR EXISTS (SELECT 1 FROM public.employee_profiles WHERE user_id = auth.uid())
  );
CREATE TRIGGER attendance_settings_updated_at BEFORE UPDATE ON public.attendance_settings
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.attendance_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 3. employee_attendance ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  first_login_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  logout_at TIMESTAMPTZ,
  working_minutes INT,
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','late','half_day','absent','leave','weekly_off','holiday')),
  is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
  is_weekly_off BOOLEAN NOT NULL DEFAULT FALSE,
  admin_override BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, attendance_date)
);
CREATE INDEX IF NOT EXISTS employee_attendance_emp_date_idx
  ON public.employee_attendance (employee_id, attendance_date DESC);
GRANT SELECT ON public.employee_attendance TO authenticated;
GRANT ALL ON public.employee_attendance TO service_role;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own attendance" ON public.employee_attendance
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
  );
CREATE POLICY "Admins can view all attendance" ON public.employee_attendance
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER employee_attendance_updated_at BEFORE UPDATE ON public.employee_attendance
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. salary_structures ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  monthly_gross NUMERIC(12,2) NOT NULL DEFAULT 0,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  performance_incentive NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  pf_applicable BOOLEAN NOT NULL DEFAULT FALSE,
  employee_pf_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  employer_pf_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  tds NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.salary_structures TO authenticated;
GRANT ALL ON public.salary_structures TO service_role;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own salary structure" ON public.salary_structures
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
  );
CREATE POLICY "Admins can view all salary structures" ON public.salary_structures
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE TRIGGER salary_structures_updated_at BEFORE UPDATE ON public.salary_structures
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. pf_preferences ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pf_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('interested','not_interested')),
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','approved','rejected','not_applicable')),
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.pf_preferences TO authenticated;
GRANT ALL ON public.pf_preferences TO service_role;
ALTER TABLE public.pf_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own PF preference" ON public.pf_preferences
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
  );
CREATE POLICY "Employees can submit own PF preference" ON public.pf_preferences
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
    AND status = 'submitted'
  );
CREATE POLICY "Employees can update own PF preference before review" ON public.pf_preferences
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
    AND status IN ('submitted','under_review')
  ) WITH CHECK (
    status IN ('submitted','under_review')
  );
CREATE POLICY "Admins manage PF preferences" ON public.pf_preferences
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER pf_preferences_updated_at BEFORE UPDATE ON public.pf_preferences
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6. benefit_types ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.benefit_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.benefit_types TO authenticated;
GRANT ALL ON public.benefit_types TO service_role;
ALTER TABLE public.benefit_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read active benefit types" ON public.benefit_types
  FOR SELECT TO authenticated USING (is_active = TRUE OR public.is_admin(auth.uid()));
CREATE POLICY "Admins manage benefit types" ON public.benefit_types
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER benefit_types_updated_at BEFORE UPDATE ON public.benefit_types
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.benefit_types (code, label, description, sort_order) VALUES
  ('provident_fund','Provident Fund','Provident Fund benefit subject to eligibility.',10),
  ('performance_incentive','Performance Incentives','Sales performance-based incentive payout.',20),
  ('paid_leave','Paid Leave','Company-approved paid leave allowance.',30),
  ('learning_benefits','Learning Benefits','Access to Glintr programs and learning credits.',40),
  ('recognition_program','Employee Recognition','Awards and recognition programs.',50)
ON CONFLICT (code) DO NOTHING;

-- 7. employee_benefits ------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  benefit_type_id UUID NOT NULL REFERENCES public.benefit_types(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available','requested','under_review','active','not_eligible')),
  admin_notes TEXT,
  requested_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, benefit_type_id)
);
GRANT SELECT ON public.employee_benefits TO authenticated;
GRANT ALL ON public.employee_benefits TO service_role;
ALTER TABLE public.employee_benefits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own benefits" ON public.employee_benefits
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
  );
CREATE POLICY "Admins manage employee benefits" ON public.employee_benefits
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER employee_benefits_updated_at BEFORE UPDATE ON public.employee_benefits
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 8. payroll_runs -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  payroll_year INT NOT NULL,
  payroll_month INT NOT NULL CHECK (payroll_month BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','prepared','approved','slip_generated','paid','cancelled')),

  -- Attendance summary snapshot
  present_days INT NOT NULL DEFAULT 0,
  late_days INT NOT NULL DEFAULT 0,
  half_days INT NOT NULL DEFAULT 0,
  absent_days INT NOT NULL DEFAULT 0,
  leave_days INT NOT NULL DEFAULT 0,
  weekly_off_days INT NOT NULL DEFAULT 0,
  holiday_days INT NOT NULL DEFAULT 0,
  payable_days NUMERIC(6,2) NOT NULL DEFAULT 0,

  -- Earnings snapshot
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  hra NUMERIC(12,2) NOT NULL DEFAULT 0,
  special_allowance NUMERIC(12,2) NOT NULL DEFAULT 0,
  performance_incentive NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,
  gross_earnings NUMERIC(12,2) NOT NULL DEFAULT 0,

  -- Deductions snapshot
  employee_pf NUMERIC(12,2) NOT NULL DEFAULT 0,
  employer_pf NUMERIC(12,2) NOT NULL DEFAULT 0,
  professional_tax NUMERIC(12,2) NOT NULL DEFAULT 0,
  tds NUMERIC(12,2) NOT NULL DEFAULT 0,
  other_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,

  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',

  approved_by UUID,
  approved_at TIMESTAMPTZ,
  slip_generated_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  payment_date DATE,
  admin_notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, payroll_year, payroll_month)
);
CREATE INDEX IF NOT EXISTS payroll_runs_month_idx
  ON public.payroll_runs (payroll_year DESC, payroll_month DESC);
GRANT SELECT ON public.payroll_runs TO authenticated;
GRANT ALL ON public.payroll_runs TO service_role;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Employees can view own payroll (slip generated or paid)" ON public.payroll_runs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.employee_profiles ep
            WHERE ep.id = employee_id AND ep.user_id = auth.uid())
    AND status IN ('slip_generated','paid')
  );
CREATE POLICY "Admins manage payroll" ON public.payroll_runs
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));
CREATE TRIGGER payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 9. Employee code generator -------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_employee_code()
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  yr TEXT := to_char(now(), 'YYYY');
  seq INT;
  candidate TEXT;
BEGIN
  SELECT COALESCE(MAX((regexp_match(employee_code, '^GL-EMP-[0-9]{4}-([0-9]+)$'))[1]::int), 0) + 1
    INTO seq
    FROM public.employee_profiles
    WHERE employee_code LIKE 'GL-EMP-' || yr || '-%';
  candidate := 'GL-EMP-' || yr || '-' || lpad(seq::text, 4, '0');
  RETURN candidate;
END $$;
