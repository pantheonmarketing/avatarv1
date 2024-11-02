-- Function to set environment configuration
CREATE OR REPLACE FUNCTION set_environment(env text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.environment', env, false);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_environment TO authenticated;
GRANT EXECUTE ON FUNCTION set_environment TO service_role;

CREATE OR REPLACE FUNCTION deduct_credits(user_id UUID, amount INT)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET credits = credits - amount
  WHERE id = user_id AND credits >= amount;
END;
$$ LANGUAGE plpgsql; 