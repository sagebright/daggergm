-- Atomic increment functions for regeneration counters
-- These ensure no race conditions in concurrent regeneration requests

-- Atomic increment function for scaffold regenerations
CREATE OR REPLACE FUNCTION increment_scaffold_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE adventures
  SET scaffold_regenerations_used = scaffold_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomic increment function for expansion regenerations
CREATE OR REPLACE FUNCTION increment_expansion_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE adventures
  SET expansion_regenerations_used = expansion_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION increment_scaffold_regenerations IS 'Atomically increments scaffold regeneration counter to prevent race conditions';
COMMENT ON FUNCTION increment_expansion_regenerations IS 'Atomically increments expansion regeneration counter to prevent race conditions';
