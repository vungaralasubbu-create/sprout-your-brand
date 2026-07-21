
ALTER TABLE public.payment_links
  ADD COLUMN IF NOT EXISTS merchant_name text,
  ADD COLUMN IF NOT EXISTS upi_id text,
  ADD COLUMN IF NOT EXISTS account_holder text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS qr_image_url text,
  ADD COLUMN IF NOT EXISTS is_default_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.payment_links ALTER COLUMN url DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS payment_links_single_default_active_idx
  ON public.payment_links ((is_default_active))
  WHERE is_default_active = true;
