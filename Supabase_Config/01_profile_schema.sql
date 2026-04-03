CREATE TABLE profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  class_year TEXT,
  major TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view any profile
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Prevent users from inserting a profile for someone else
CREATE POLICY "Users can only insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
