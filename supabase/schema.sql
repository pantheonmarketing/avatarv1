-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS avatars;
DROP TABLE IF EXISTS credits_log;
DROP TABLE IF EXISTS users;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
-- Drop the function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT,
  credits INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_authenticated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE
);

-- Credits log table
CREATE TABLE credits_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  clerk_user_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Avatars table
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  clerk_user_id TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger on users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX idx_credits_log_user_id ON credits_log(user_id);
CREATE INDEX idx_credits_log_clerk_user_id ON credits_log(clerk_user_id);
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_clerk_user_id ON avatars(clerk_user_id);

-- Set initial super admin
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'yoniwe@gmail.com';