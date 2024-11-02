-- First drop existing policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service role can manage all users" ON users;
DROP POLICY IF EXISTS "Allow test operations" ON users;

DROP POLICY IF EXISTS "Users can read own credit logs" ON credits_log;
DROP POLICY IF EXISTS "Users can insert own credit logs" ON credits_log;
DROP POLICY IF EXISTS "Service role can manage all credit logs" ON credits_log;
DROP POLICY IF EXISTS "Allow test operations on credit logs" ON credits_log;

DROP POLICY IF EXISTS "Users can read own avatars" ON avatars;
DROP POLICY IF EXISTS "Users can create own avatars" ON avatars;
DROP POLICY IF EXISTS "Service role can manage all avatars" ON avatars;
DROP POLICY IF EXISTS "Allow test operations on avatars" ON avatars;

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;

-- Users policies - More permissive for testing
CREATE POLICY "Enable all operations for service role" ON users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations during testing" ON users
    FOR ALL USING (current_setting('app.environment', true) = 'test');

CREATE POLICY "Users can manage own data" ON users
    FOR ALL USING (auth.uid() = id);

-- Credits log policies
CREATE POLICY "Enable all operations on credits_log for service role" ON credits_log
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations on credits_log during testing" ON credits_log
    FOR ALL USING (current_setting('app.environment', true) = 'test');

CREATE POLICY "Users can manage own credit logs" ON credits_log
    FOR ALL USING (auth.uid() = user_id);

-- Avatars policies
CREATE POLICY "Enable all operations on avatars for service role" ON avatars
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Enable all operations on avatars during testing" ON avatars
    FOR ALL USING (current_setting('app.environment', true) = 'test');

CREATE POLICY "Users can manage own avatars" ON avatars
    FOR ALL USING (auth.uid() = user_id); 