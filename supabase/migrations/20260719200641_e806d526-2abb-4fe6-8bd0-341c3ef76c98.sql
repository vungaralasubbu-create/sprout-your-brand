DROP POLICY IF EXISTS "engage_subs_token_read" ON public.engage_subscriptions;
DROP POLICY IF EXISTS "Anon can lookup by token" ON public.review_requests;
REVOKE SELECT ON public.review_requests FROM anon;