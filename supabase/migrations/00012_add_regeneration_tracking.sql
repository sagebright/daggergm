-- Add regeneration tracking columns to adventures table
-- This enables free regenerations with limits per business model:
-- - Scaffold regenerations: 10 max per adventure
-- - Expansion regenerations: 20 max per adventure

ALTER TABLE adventures
ADD COLUMN scaffold_regenerations_used INT DEFAULT 0 CHECK (scaffold_regenerations_used >= 0),
ADD COLUMN expansion_regenerations_used INT DEFAULT 0 CHECK (expansion_regenerations_used >= 0);

-- Add index for performance (frequently queried during regeneration checks)
CREATE INDEX idx_adventures_regenerations
ON adventures(scaffold_regenerations_used, expansion_regenerations_used);

-- Add comments for documentation
COMMENT ON COLUMN adventures.scaffold_regenerations_used IS 'Number of scaffold regenerations used (max 10 per business model)';
COMMENT ON COLUMN adventures.expansion_regenerations_used IS 'Number of expansion regenerations used (max 20 per business model)';
