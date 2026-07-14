
INSERT INTO public.platform_settings(key, value) VALUES ('partner_signup_require_approval','false')
ON CONFLICT (key) DO NOTHING;
