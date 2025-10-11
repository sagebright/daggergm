-- Function to add credits to user account
CREATE OR REPLACE FUNCTION add_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS TABLE (success BOOLEAN, new_balance INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Ensure user profile exists
  INSERT INTO user_profiles (user_id, credits)
  VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Update credits with row lock
  UPDATE user_profiles
  SET credits = credits + p_amount
  WHERE user_id = p_user_id
  RETURNING credits INTO v_new_balance;

  -- Record the transaction
  INSERT INTO credit_transactions (
    user_id,
    type,
    amount,
    balance_after,
    metadata
  ) VALUES (
    p_user_id,
    'credit',
    p_amount,
    v_new_balance,
    p_metadata || jsonb_build_object('source', p_source)
  );

  -- Return success and new balance
  RETURN QUERY SELECT true, v_new_balance;
END;
$$;