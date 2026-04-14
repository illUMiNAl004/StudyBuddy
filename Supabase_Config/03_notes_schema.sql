-- 1. Create a preset lookup table for Majors
-- By using TEXT PRIMARY KEY, we force the ID itself to be the spelled-out major.
-- This is brilliant because it locks down spelling, but keeps our React code simple 
-- (we don't have to deal with complex UUIDs on the frontend, just strings like 'Biology'!).
CREATE TABLE IF NOT EXISTS major_categories (
  name TEXT PRIMARY KEY
);

-- Insert the default 5 predefined majors requested
-- ON CONFLICT DO NOTHING ensures it doesn't crash if you run this script twice!
INSERT INTO major_categories (name) 
VALUES 
  ('Computer Science'), 
  ('Business'), 
  ('Biology'), 
  ('Chemistry'), 
  ('Computer Engineering')
ON CONFLICT (name) DO NOTHING;

-- 2. Link the EXISTING profiles to this new strict table
-- Warning: If you have old test profiles that say "Major: CS" instead of "Computer Science", 
-- this command will throw an error. Delete your test users first if so!
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS fk_major;
  
ALTER TABLE profiles
  ADD CONSTRAINT fk_major FOREIGN KEY (major) REFERENCES major_categories(name) ON UPDATE CASCADE;

-- 3. Create the Notes table
-- author_id ensures we always know who made it.
-- picture_url forces the record to contain an image string.
-- major forces it to belong specifically to a validated major.
CREATE TABLE IF NOT EXISTS notes (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  picture_urls TEXT[] NOT NULL,
  major TEXT NOT NULL REFERENCES major_categories(name) ON UPDATE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Turn on Security
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Clean out old rules if we run this piece of code twice
DROP POLICY IF EXISTS "Anyone can view notes" ON notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON notes;

-- 4. Database Security Policies (RLS)
-- Anyone accessing the website gets to view the notes
CREATE POLICY "Anyone can view notes"
  ON notes FOR SELECT
  USING (true);

-- Only logged in users can insert notes, and we use WITH CHECK so they can't upload notes pretending to be another user.
CREATE POLICY "Users can insert their own notes"
  ON notes FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Users can only delete notes that specifically match their own auth.uid.
CREATE POLICY "Users can delete their own notes"
  ON notes FOR DELETE
  USING (auth.uid() = author_id);
