
-- Notification bell: unread first, then recent
CREATE INDEX IF NOT EXISTS idx_engage_inapp_user_unread_created
  ON public.engage_inapp_notifications (user_id, created_at DESC)
  WHERE read_at IS NULL AND archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_engage_inapp_user_created
  ON public.engage_inapp_notifications (user_id, created_at DESC)
  WHERE archived_at IS NULL;

-- Partner notification bell
CREATE INDEX IF NOT EXISTS idx_partner_notifications_partner_created
  ON public.partner_notifications (partner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_notifications_unread
  ON public.partner_notifications (partner_id, created_at DESC)
  WHERE is_read = false;

-- Automation tick worker: resume runs whose wait window has elapsed
CREATE INDEX IF NOT EXISTS idx_workflow_runs_ready
  ON public.automation_workflow_runs (wait_until)
  WHERE status = 'waiting';

-- Channel message queue: outbound worker scan
CREATE INDEX IF NOT EXISTS idx_channel_msg_pending
  ON public.automation_channel_messages (channel, created_at)
  WHERE status = 'pending';
