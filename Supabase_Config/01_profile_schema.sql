-- 1. Create the categories table FIRST so profiles can reference it below!
CREATE TABLE IF NOT EXISTS major_categories (
  name TEXT PRIMARY KEY
);

INSERT INTO major_categories (name) 
VALUES 
  ('Computer Science'), 
  ('Business'), 
  ('Biology'), 
  ('Chemistry'), 
  ('Computer Engineering')
ON CONFLICT (name) DO NOTHING;

-- 2. Safely create profiles table inherently tied to the categories table above
CREATE TABLE IF NOT EXISTS profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  class_year TEXT,
  major TEXT REFERENCES major_categories(name) ON UPDATE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 3. Clean up old policies to prevent collision
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can only insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;

-- 4. Anyone authenticated can view any profile
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

-- 5. Global power for users to manage their own profile
CREATE POLICY "Users can manage their own profile"
  ON profiles 
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
