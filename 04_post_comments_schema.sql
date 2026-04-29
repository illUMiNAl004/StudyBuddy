CREATE TABLE IF NOT EXISTS post_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to view comments (or restrict to group members if desired, but this is simpler)
CREATE POLICY "Anyone can view comments"
  ON post_comments
  FOR SELECT
  USING (true);

-- Allow authenticated users to add comments
CREATE POLICY "Authenticated users can add comments"
  ON post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = author_id);

-- Allow authors to delete their own comments
CREATE POLICY "Authors can delete their own comments"
  ON post_comments
  FOR DELETE
  USING (auth.uid() = author_id);
