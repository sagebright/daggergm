-- Scene Expansion Search Functions
-- Provides vector search for adversaries and environments
-- Used during scene expansion to find relevant Daggerheart content

-- =============================================
-- Search adversaries by semantic relevance and tier
-- =============================================
CREATE OR REPLACE FUNCTION search_adversaries(
  search_query TEXT,
  party_level INT,
  limit_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  tier INT,
  type TEXT,
  description TEXT,
  difficulty INT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
DECLARE
  search_embedding VECTOR(1536);
  tier_threshold INT;
BEGIN
  -- Get embedding for search query using pgml extension
  -- Note: This requires pgml.embed() function from PostgresML
  -- For now, we'll use a placeholder approach that searches by text
  -- In production, this should use proper vector embeddings

  -- Calculate tier threshold based on party level
  -- Level 1-3 → Tier 1, Level 4-6 → Tier 2, Level 7-10 → Tier 3
  tier_threshold := LEAST(CEIL(party_level / 3.0), 3);

  -- For MVP: Use full-text search instead of vector search
  -- This will be replaced with proper vector search once embeddings are generated
  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.tier,
    a.type,
    a.description,
    a.difficulty,
    ts_rank(to_tsvector('english', a.searchable_text), plainto_tsquery('english', search_query)) AS similarity
  FROM daggerheart_adversaries a
  WHERE
    a.tier <= tier_threshold
    AND to_tsvector('english', a.searchable_text) @@ plainto_tsquery('english', search_query)
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION search_adversaries IS 'Find relevant adversaries using semantic search, filtered by party level tier';

-- =============================================
-- Search environments by semantic relevance
-- =============================================
CREATE OR REPLACE FUNCTION search_environments(
  search_query TEXT,
  limit_count INT DEFAULT 3
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- For MVP: Use full-text search instead of vector search
  -- This will be replaced with proper vector search once embeddings are generated
  RETURN QUERY
  SELECT
    e.id,
    e.name,
    e.description,
    ts_rank(to_tsvector('english', e.searchable_text), plainto_tsquery('english', search_query)) AS similarity
  FROM daggerheart_environments e
  WHERE to_tsvector('english', e.searchable_text) @@ plainto_tsquery('english', search_query)
  ORDER BY similarity DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION search_environments IS 'Find relevant environments using semantic search';

-- =============================================
-- Helper: Get tier-appropriate loot
-- =============================================
CREATE OR REPLACE FUNCTION get_tier_appropriate_loot(
  party_level INT,
  item_type TEXT DEFAULT 'all', -- 'weapons', 'armor', 'items', 'consumables', 'all'
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  item_table TEXT,
  tier INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  tier_threshold INT;
BEGIN
  -- Calculate tier threshold
  tier_threshold := LEAST(CEIL(party_level / 3.0), 3);

  -- Return items based on type filter
  IF item_type = 'weapons' THEN
    RETURN QUERY
    SELECT w.id, w.name, 'daggerheart_weapons'::TEXT, w.tier
    FROM daggerheart_weapons w
    WHERE w.tier <= tier_threshold
    ORDER BY RANDOM()
    LIMIT limit_count;
  ELSIF item_type = 'armor' THEN
    RETURN QUERY
    SELECT a.id, a.name, 'daggerheart_armor'::TEXT, a.tier
    FROM daggerheart_armor a
    WHERE a.tier <= tier_threshold
    ORDER BY RANDOM()
    LIMIT limit_count;
  ELSE
    -- Return mix of all types
    RETURN QUERY
    (SELECT w.id, w.name, 'daggerheart_weapons'::TEXT, w.tier
     FROM daggerheart_weapons w
     WHERE w.tier <= tier_threshold
     ORDER BY RANDOM()
     LIMIT limit_count / 2)
    UNION ALL
    (SELECT a.id, a.name, 'daggerheart_armor'::TEXT, a.tier
     FROM daggerheart_armor a
     WHERE a.tier <= tier_threshold
     ORDER BY RANDOM()
     LIMIT limit_count / 2);
  END IF;
END;
$$;

COMMENT ON FUNCTION get_tier_appropriate_loot IS 'Get random tier-appropriate loot for party level';
