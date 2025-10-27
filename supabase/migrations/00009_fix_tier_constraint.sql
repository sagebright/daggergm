-- Fix tier constraint to allow Tier 4 items
-- Issue: Original schema limited tiers to 1-3, but SRD contains Tier 4 weapons and armor

-- Drop existing constraints
ALTER TABLE daggerheart_weapons
DROP CONSTRAINT IF EXISTS daggerheart_weapons_tier_check;

ALTER TABLE daggerheart_armor
DROP CONSTRAINT IF EXISTS daggerheart_armor_tier_check;

-- Add new constraints allowing tiers 1-4
ALTER TABLE daggerheart_weapons
ADD CONSTRAINT daggerheart_weapons_tier_check CHECK (tier BETWEEN 1 AND 4);

ALTER TABLE daggerheart_armor
ADD CONSTRAINT daggerheart_armor_tier_check CHECK (tier BETWEEN 1 AND 4);

-- Note: Existing data will need to be reseeded after this migration
-- - Weapons: 53 Tier 4 weapons were previously blocked
-- - Armor: All 34 armor pieces were incorrectly defaulted to Tier 1
