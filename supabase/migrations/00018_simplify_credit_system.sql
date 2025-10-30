-- Simplify Credit System: Remove complex ledger functions
-- This migration removes functions that reference nonexistent tables:
-- - user_credits (individual credit tokens)
-- - credit_transactions (transaction ledger)
--
-- DaggerGM uses a simple balance approach:
-- - daggerheart_user_profiles.credits stores current balance
-- - daggerheart_purchases records Stripe purchase history
--
-- Related: FIX_003_e2e_credit_setup_issue.md

-- =============================================
-- Step 1: Drop orphaned complex credit functions
-- =============================================

-- These functions reference nonexistent user_credits and credit_transactions tables
DROP FUNCTION IF EXISTS public.consume_credit(UUID, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.refund_credit(UUID, TEXT, JSONB);

-- =============================================
-- Step 2: Keep only simple credit functions
-- =============================================

-- add_user_credits: Adds credits to user profile balance
-- (Already exists from migration 00016, no changes needed)

-- consume_adventure_credit: Consumes 1 credit from user profile
-- (Already exists from migration 00016, no changes needed)

-- =============================================
-- Step 3: Document the simple credit system design
-- =============================================

COMMENT ON COLUMN daggerheart_user_profiles.credits IS
  'Current credit balance. Decremented on adventure generation, incremented on purchase. Simple integer balance approach - no need for separate credit_transactions or user_credits tables.';

COMMENT ON COLUMN daggerheart_user_profiles.total_purchased IS
  'Lifetime total credits purchased. Used for analytics and user tier calculations.';

COMMENT ON TABLE daggerheart_purchases IS
  'Stripe purchase history. Records all credit purchases with payment_intent_id for reconciliation. Serves as audit trail for credit additions.';
