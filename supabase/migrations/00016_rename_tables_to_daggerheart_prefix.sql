-- Rename DaggerGM tables to use daggerheart_ prefix
-- This groups all DaggerGM-specific tables visually in shared database instances
-- Tables being renamed:
--   user_profiles       → daggerheart_user_profiles
--   adventures          → daggerheart_adventures
--   game_content        → daggerheart_game_content
--   llm_cache           → daggerheart_llm_cache
--   purchases           → daggerheart_purchases

-- =============================================
-- Step 1: Rename tables (indexes, triggers, RLS policies follow automatically)
-- =============================================

ALTER TABLE user_profiles RENAME TO daggerheart_user_profiles;
ALTER TABLE adventures RENAME TO daggerheart_adventures;
ALTER TABLE game_content RENAME TO daggerheart_game_content;
ALTER TABLE llm_cache RENAME TO daggerheart_llm_cache;
ALTER TABLE purchases RENAME TO daggerheart_purchases;

-- =============================================
-- Step 2: Update functions that reference renamed tables
-- =============================================

-- Update handle_new_user trigger function (references user_profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.daggerheart_user_profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update consume_adventure_credit function (references user_profiles and adventures)
CREATE OR REPLACE FUNCTION consume_adventure_credit(
  p_user_id UUID,
  p_adventure_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INT;
BEGIN
  -- Lock the user profile row
  SELECT credits INTO v_credits
  FROM daggerheart_user_profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check sufficient credits
  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0001';
  END IF;

  -- Consume credit
  UPDATE daggerheart_user_profiles
  SET credits = credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Mark adventure as credit consumed
  UPDATE daggerheart_adventures
  SET metadata = metadata || jsonb_build_object('credit_consumed', true)
  WHERE id = p_adventure_id;

  RETURN TRUE;
END;
$$;

-- Update add_user_credits function (references user_profiles)
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INT,
  p_source TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE daggerheart_user_profiles
  SET credits = credits + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the credit addition in metadata (could be expanded to separate table)
  UPDATE daggerheart_user_profiles
  SET metadata = metadata || jsonb_build_object(
    'credit_history',
    COALESCE(metadata->'credit_history', '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'amount', p_amount,
        'source', p_source,
        'timestamp', NOW()
      )
    )
  )
  WHERE id = p_user_id;
END;
$$;

-- Update consume_credit function (references user_profiles and credit_transactions)
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id UUID,
  p_credit_type TEXT DEFAULT 'adventure',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit_id UUID;
  v_is_guest BOOLEAN;
  v_remaining_credits INTEGER;
BEGIN
  -- Check if this is a guest user (check is_guest in user_profiles)
  SELECT COALESCE(is_guest, false) INTO v_is_guest
  FROM public.daggerheart_user_profiles
  WHERE user_id = p_user_id;

  -- If no profile exists, assume guest
  IF NOT FOUND THEN
    v_is_guest := true;
  END IF;

  -- For guest users, check if they've used their free credit
  IF v_is_guest THEN
    -- Check if guest has already used a credit
    IF EXISTS (
      SELECT 1 FROM public.credit_transactions
      WHERE user_id = p_user_id
      AND type = 'consume'
      LIMIT 1
    ) THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Guest users get one free adventure'
      );
    END IF;

    -- Guest gets one free use, record it
    INSERT INTO public.credit_transactions (
      user_id,
      type,
      amount,
      balance_after,
      metadata
    ) VALUES (
      p_user_id,
      'consume',
      -1,
      0,
      p_metadata || jsonb_build_object('credit_type', p_credit_type, 'is_guest', true)
    );

    RETURN jsonb_build_object(
      'success', true,
      'remaining_credits', 0,
      'transaction_id', gen_random_uuid()
    );
  END IF;

  -- For regular users, check available credits
  -- Try to find an available credit
  SELECT id INTO v_credit_id
  FROM public.user_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND consumed_at IS NULL
  ORDER BY expires_at ASC NULLS LAST, created_at ASC
  LIMIT 1
  FOR UPDATE;

  -- No available credits
  IF v_credit_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No available credits'
    );
  END IF;

  -- Consume the credit
  UPDATE public.user_credits
  SET consumed_at = NOW()
  WHERE id = v_credit_id;

  -- Record the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    'consume',
    -1,
    (SELECT COUNT(*) FROM public.user_credits WHERE user_id = p_user_id AND consumed_at IS NULL),
    p_metadata || jsonb_build_object('credit_id', v_credit_id, 'credit_type', p_credit_type)
  );

  -- Get remaining credits count
  SELECT COUNT(*)::INTEGER INTO v_remaining_credits
  FROM public.user_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND consumed_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'credit_id', v_credit_id,
    'remaining_credits', v_remaining_credits
  );
END;
$$;

-- Update refund_credit function (references user_credits and credit_transactions)
CREATE OR REPLACE FUNCTION public.refund_credit(
  p_user_id UUID,
  p_credit_type TEXT DEFAULT 'adventure',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credit_id UUID;
  v_current_balance INTEGER;
BEGIN
  -- Find the most recently consumed credit of this type for the user
  SELECT id INTO v_credit_id
  FROM public.user_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND consumed_at IS NOT NULL
  ORDER BY consumed_at DESC
  LIMIT 1;

  -- No consumed credit found
  IF v_credit_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No consumed credit found to refund'
    );
  END IF;

  -- Refund the credit by setting consumed_at to NULL
  UPDATE public.user_credits
  SET consumed_at = NULL
  WHERE id = v_credit_id;

  -- Record the transaction
  INSERT INTO public.credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    'refund',
    1,
    (SELECT COUNT(*) FROM public.user_credits WHERE user_id = p_user_id AND consumed_at IS NULL),
    p_metadata || jsonb_build_object('credit_id', v_credit_id, 'credit_type', p_credit_type)
  );

  -- Get the new balance
  SELECT COUNT(*)::INTEGER INTO v_current_balance
  FROM public.user_credits
  WHERE user_id = p_user_id
    AND credit_type = p_credit_type
    AND consumed_at IS NULL;

  RETURN jsonb_build_object(
    'success', true,
    'credit_id', v_credit_id,
    'new_balance', v_current_balance
  );
END;
$$;

-- Update increment_scaffold_regenerations function (references adventures)
CREATE OR REPLACE FUNCTION increment_scaffold_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE daggerheart_adventures
  SET scaffold_regenerations_used = scaffold_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update increment_expansion_regenerations function (references adventures)
CREATE OR REPLACE FUNCTION increment_expansion_regenerations(adventure_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE daggerheart_adventures
  SET expansion_regenerations_used = expansion_regenerations_used + 1
  WHERE id = adventure_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update search_game_content function (references game_content)
CREATE OR REPLACE FUNCTION search_game_content(
  query_embedding vector(1536),
  match_frame text DEFAULT NULL,
  match_types text[] DEFAULT NULL,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content_type text,
  frame text,
  game_element jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.id,
    gc.content_type,
    gc.frame,
    gc.game_element,
    1 - (gc.embedding <=> query_embedding) as similarity
  FROM daggerheart_game_content gc
  WHERE
    (match_frame IS NULL OR gc.frame = match_frame)
    AND (match_types IS NULL OR gc.content_type = ANY(match_types))
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- =============================================
-- Step 3: Add comments to document the rename
-- =============================================

COMMENT ON TABLE daggerheart_user_profiles IS 'User profiles with credit system (renamed from user_profiles for namespace clarity)';
COMMENT ON TABLE daggerheart_adventures IS 'Adventures with comprehensive metadata (renamed from adventures for namespace clarity)';
COMMENT ON TABLE daggerheart_game_content IS 'Frame-aware content with vector embeddings (renamed from game_content for namespace clarity)';
COMMENT ON TABLE daggerheart_llm_cache IS 'Semantic caching for LLM responses (renamed from llm_cache for namespace clarity)';
COMMENT ON TABLE daggerheart_purchases IS 'Purchase history for auditing (renamed from purchases for namespace clarity)';
