CREATE TABLE IF NOT EXISTS groups(

    id UUID NOT NULL PRIMARY KEY,
    group_title TEXT NOT NULL,
    creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent collision
DROP POLICY IF EXISTS "Anyone can view all groups" ON groups;
DROP POLICY IF EXISTS "Creators can manage their own groups" ON groups;

-- anyone can view a group because anyone can view a post
CREATE POLICY "Anyone can view all groups"
  ON groups FOR SELECT
  USING (true);

-- Only the creator can manage their own groups
CREATE POLICY "Creators can manage their own groups"
  ON groups
  FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);
