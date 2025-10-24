-- Add regeneration tracking columns to adventures table
-- This enables enforcement of the 10 scaffold / 20 expansion regeneration limits

ALTER TABLE adventures
  ADD COLUMN IF NOT EXISTS scaffold_regenerations_used INT DEFAULT 0 CHECK (scaffold_regenerations_used >= 0),
  ADD COLUMN IF NOT EXISTS expansion_regenerations_used INT DEFAULT 0 CHECK (expansion_regenerations_used >= 0);

-- Add comments for documentation
COMMENT ON COLUMN adventures.scaffold_regenerations_used IS 'Count of regenerations used during Scaffold stage (max 10)';
COMMENT ON COLUMN adventures.expansion_regenerations_used IS 'Count of regenerations used during Expansion stage (max 20)';
