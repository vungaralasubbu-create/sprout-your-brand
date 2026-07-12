
-- Extend commission_status
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'tracking';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'pending_verification';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'eligible';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'available_for_payout';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'reversed';
ALTER TYPE commission_status ADD VALUE IF NOT EXISTS 'rejected';

-- Extend payout_status
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'requested';
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'under_review';
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'approved';
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'rejected';
ALTER TYPE payout_status ADD VALUE IF NOT EXISTS 'reversed';
