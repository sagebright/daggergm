-- Change default value for credits column from 1 to 0
-- This only affects NEW users created after migration
-- Existing users keep their current credit balance

ALTER TABLE user_profiles
  ALTER COLUMN credits SET DEFAULT 0;

-- Add comment explaining the change
COMMENT ON COLUMN user_profiles.credits IS 'Credit balance (starts at 0, must purchase credits to generate adventures)';
