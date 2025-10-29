-- Remove Guest System from DaggerGM
-- Guest functionality was removed in favor of auth-only model
-- This migration cleans up guest-related database schema

-- =============================================
-- Step 1: Verify no guest data exists
-- =============================================

-- Safety check: Ensure no guest adventures exist before proceeding
DO $$
DECLARE
  guest_count INT;
BEGIN
  SELECT COUNT(*) INTO guest_count
  FROM daggerheart_adventures
  WHERE user_id IS NULL AND guest_email IS NOT NULL;

  IF guest_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: % guest adventures still exist. Delete them first.', guest_count;
  END IF;

  RAISE NOTICE 'Safety check passed: No guest adventures found';
END $$;

-- =============================================
-- Step 2: Drop RLS policies for guest access
-- =============================================

DROP POLICY IF EXISTS "Guests can view adventures with token" ON daggerheart_adventures;
DROP POLICY IF EXISTS "Guests can create adventures" ON daggerheart_adventures;

COMMENT ON TABLE daggerheart_adventures IS 'Adventures require authentication (guest system removed 2025-10-28)';

-- =============================================
-- Step 3: Drop guest-related constraint
-- =============================================

-- Drop the constraint that required either user_id OR guest_email
ALTER TABLE daggerheart_adventures
DROP CONSTRAINT IF EXISTS guest_adventure_email;

-- Add new constraint: user_id is now REQUIRED
ALTER TABLE daggerheart_adventures
ADD CONSTRAINT adventures_require_user_id
CHECK (user_id IS NOT NULL);

-- =============================================
-- Step 4: Drop guest columns
-- =============================================

ALTER TABLE daggerheart_adventures
DROP COLUMN IF EXISTS guest_email;

ALTER TABLE daggerheart_adventures
DROP COLUMN IF EXISTS guest_token;

-- =============================================
-- Step 5: Update column comments
-- =============================================

COMMENT ON COLUMN daggerheart_adventures.user_id IS
  'User ID (required - all adventures require authentication)';

-- =============================================
-- Step 6: Clean up guest_email from purchases table
-- =============================================

-- Safety check: Ensure no guest purchases exist
DO $$
DECLARE
  guest_purchase_count INT;
BEGIN
  SELECT COUNT(*) INTO guest_purchase_count
  FROM daggerheart_purchases
  WHERE user_id IS NULL AND guest_email IS NOT NULL;

  IF guest_purchase_count > 0 THEN
    RAISE EXCEPTION 'Cannot proceed: % guest purchases still exist.', guest_purchase_count;
  END IF;

  RAISE NOTICE 'Safety check passed: No guest purchases found';
END $$;

-- Make user_id required on purchases
ALTER TABLE daggerheart_purchases
ALTER COLUMN user_id SET NOT NULL;

-- Drop guest_email column from purchases
ALTER TABLE daggerheart_purchases
DROP COLUMN IF EXISTS guest_email;

COMMENT ON TABLE daggerheart_purchases IS 'Purchase history (auth required, guest system removed 2025-10-28)';

-- =============================================
-- Step 7: Verify final state
-- =============================================

-- Verify columns are dropped from both tables
DO $$
DECLARE
  col_count INT;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'daggerheart_adventures' AND column_name IN ('guest_email', 'guest_token'))
      OR (table_name = 'daggerheart_purchases' AND column_name = 'guest_email')
    );

  IF col_count > 0 THEN
    RAISE EXCEPTION 'Guest columns still exist after migration';
  END IF;

  RAISE NOTICE 'Verification passed: All guest columns successfully removed from adventures and purchases tables';
END $$;
