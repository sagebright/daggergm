-- Credit transaction tracking table
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('consumption', 'purchase', 'refund', 'bonus')),
  credit_type TEXT CHECK (credit_type IN ('adventure', 'expansion', 'export')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user transaction history
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id, created_at DESC);

-- RLS policies for credit transactions
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transaction history
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert credit transactions (via functions)
CREATE POLICY "System can insert credit transactions" ON credit_transactions
  FOR INSERT
  WITH CHECK (false);

-- Function to consume credits atomically
CREATE OR REPLACE FUNCTION consume_credit(
  p_user_id UUID,
  p_credit_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (success BOOLEAN, remaining_credits INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_cost INTEGER := 1;
BEGIN
  -- Lock the user profile row to prevent race conditions
  SELECT credits INTO v_current_credits
  FROM user_profiles
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  -- Handle missing profile
  IF NOT FOUND THEN
    -- Create profile with 0 credits
    INSERT INTO user_profiles (user_id, credits)
    VALUES (p_user_id, 0);
    v_current_credits := 0;
  END IF;
  
  -- Check sufficient credits
  IF v_current_credits < v_cost THEN
    RAISE EXCEPTION 'Insufficient credits' USING ERRCODE = 'P0001';
  END IF;
  
  -- Deduct credits
  UPDATE user_profiles
  SET credits = credits - v_cost,
      updated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, type, credit_type, amount, balance_after, metadata
  ) VALUES (
    p_user_id, 'consumption', p_credit_type, -v_cost, v_current_credits - v_cost, p_metadata
  );
  
  RETURN QUERY SELECT true, v_current_credits - v_cost;
END;
$$;

-- Function to add credits
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Update or create user profile
  INSERT INTO user_profiles (user_id, credits)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    credits = user_profiles.credits + p_amount,
    updated_at = NOW()
  RETURNING credits INTO v_new_balance;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, type, amount, balance_after, metadata
  ) VALUES (
    p_user_id, p_source, p_amount, v_new_balance, p_metadata
  );
  
  RETURN QUERY SELECT v_new_balance;
END;
$$;

-- Function to refund credits
CREATE OR REPLACE FUNCTION refund_credit(
  p_user_id UUID,
  p_credit_type TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Add back the credit
  UPDATE user_profiles
  SET credits = credits + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;
  
  -- If no profile exists, create one with 1 credit
  IF NOT FOUND THEN
    INSERT INTO user_profiles (user_id, credits)
    VALUES (p_user_id, 1)
    RETURNING credits INTO v_new_balance;
  END IF;
  
  -- Record transaction
  INSERT INTO credit_transactions (
    user_id, type, credit_type, amount, balance_after, metadata
  ) VALUES (
    p_user_id, 'refund', p_credit_type, 1, v_new_balance, p_metadata
  );
  
  RETURN QUERY SELECT true, v_new_balance;
END;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION consume_credit TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION refund_credit TO authenticated;