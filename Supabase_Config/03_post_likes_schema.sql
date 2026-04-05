-- Track which users have liked which posts (prevents duplicate likes)
CREATE TABLE IF NOT EXISTS post_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, post_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view likes" ON post_likes;
DROP POLICY IF EXISTS "Users can manage their own likes" ON post_likes;

-- Anyone authenticated can read likes
CREATE POLICY "Authenticated users can view likes"
  ON post_likes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can only insert/delete their own likes
CREATE POLICY "Users can manage their own likes"
  ON post_likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
