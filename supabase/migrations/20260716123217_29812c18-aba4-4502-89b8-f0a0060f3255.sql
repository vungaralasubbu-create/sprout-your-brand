
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'super_admin'::app_role FROM auth.users
WHERE email IN ('vungaralasubbu@gmail.com','vungaralasubbu123@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.admin_users (user_id, email, full_name, admin_role, account_status)
SELECT u.id, u.email, split_part(u.email, '@', 1), 'super_admin', 'active'
FROM auth.users u
WHERE u.email IN ('vungaralasubbu@gmail.com','vungaralasubbu123@gmail.com')
ON CONFLICT (user_id) DO UPDATE
  SET admin_role = 'super_admin', account_status = 'active', email = EXCLUDED.email;
