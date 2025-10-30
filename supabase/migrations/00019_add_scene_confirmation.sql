-- Migration: Add per-scene confirmation support
-- Description: Adds schema version tracking and helper function to check if all movements are confirmed
-- Version: 00019
-- Created: 2025-10-30
-- Related Issue: #9

-- Add schema version column to track movements JSONB structure evolution
ALTER TABLE daggerheart_adventures
ADD COLUMN IF NOT EXISTS movements_jsonb_schema_version INT DEFAULT 1;

COMMENT ON COLUMN daggerheart_adventures.movements_jsonb_schema_version IS
  'Schema version for movements JSON structure. Version 1 = baseline, Version 2 = adds confirmed field for per-scene confirmation.';

-- Helper function to check if all movements in an adventure are confirmed
-- This is used to enforce the requirement that all scenes must be confirmed before marking ready
CREATE OR REPLACE FUNCTION all_movements_confirmed(adventure_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  movements_json JSONB;
  movement JSONB;
  all_confirmed BOOLEAN := TRUE;
BEGIN
  -- Get movements for the adventure
  SELECT movements INTO movements_json
  FROM daggerheart_adventures
  WHERE id = adventure_id;

  -- If no movements or empty array, return false
  IF movements_json IS NULL OR jsonb_array_length(movements_json) = 0 THEN
    RETURN FALSE;
  END IF;

  -- Check each movement for confirmed = true
  FOR movement IN SELECT * FROM jsonb_array_elements(movements_json)
  LOOP
    -- If any movement is not confirmed (or field missing), return false
    IF NOT COALESCE((movement->>'confirmed')::BOOLEAN, FALSE) THEN
      all_confirmed := FALSE;
      EXIT;
    END IF;
  END LOOP;

  RETURN all_confirmed;
END;
$$;

COMMENT ON FUNCTION all_movements_confirmed IS
  'Returns true if all movements in an adventure have confirmed=true. Used to validate state transitions to ready.';
