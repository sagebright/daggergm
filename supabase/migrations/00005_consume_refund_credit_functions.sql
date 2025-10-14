-- Create function to consume a credit atomically
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
  FROM public.user_profiles
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

-- Create function to refund a credit
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.consume_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_credit TO anon;
GRANT EXECUTE ON FUNCTION public.refund_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.refund_credit TO anon;