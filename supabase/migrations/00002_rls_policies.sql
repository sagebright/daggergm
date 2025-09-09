-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE adventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email)
    VALUES (new.id, new.email);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Adventures policies (supporting guest access)
CREATE POLICY "Users can view own adventures" ON adventures
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Guests can view adventures with token" ON adventures
    FOR SELECT TO anon
    USING (
        guest_email IS NOT NULL 
        AND guest_token::text = current_setting('app.guest_token', true)
    );

CREATE POLICY "Users can create adventures" ON adventures
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Guests can create adventures" ON adventures
    FOR INSERT TO anon
    WITH CHECK (
        user_id IS NULL 
        AND guest_email IS NOT NULL
        AND guest_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

CREATE POLICY "Users can update own adventures" ON adventures
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own adventures" ON adventures
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Game content policies (read-only for all)
CREATE POLICY "Anyone can read game content" ON game_content
    FOR SELECT TO authenticated, anon
    USING (true);

-- Cache policies (system use only via service role)
CREATE POLICY "System can manage cache" ON llm_cache
    FOR ALL TO service_role
    USING (true);

-- Purchase policies
CREATE POLICY "Users can view own purchases" ON purchases
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases" ON purchases
    FOR INSERT TO service_role
    WITH CHECK (true);

-- Database functions for atomic operations

-- Function to consume adventure credit
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
  FROM user_profiles
  WHERE id = p_user_id
  FOR UPDATE;
  
  -- Check sufficient credits
  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0001';
  END IF;
  
  -- Consume credit
  UPDATE user_profiles
  SET credits = credits - 1,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Mark adventure as credit consumed
  UPDATE adventures
  SET metadata = metadata || jsonb_build_object('credit_consumed', true)
  WHERE id = p_adventure_id;
  
  RETURN TRUE;
END;
$$;

-- Function to add user credits
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
  UPDATE user_profiles
  SET credits = credits + p_amount,
      total_purchased = total_purchased + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log the credit addition in metadata (could be expanded to separate table)
  UPDATE user_profiles
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

-- Function for vector similarity search
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
  FROM game_content gc
  WHERE 
    (match_frame IS NULL OR gc.frame = match_frame)
    AND (match_types IS NULL OR gc.content_type = ANY(match_types))
  ORDER BY gc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;