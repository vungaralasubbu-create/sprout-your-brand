CREATE UNIQUE INDEX IF NOT EXISTS soc_accounts_owner_platform_extid_uidx
  ON public.soc_accounts (owner_id, platform, account_external_id)
  WHERE account_external_id IS NOT NULL;