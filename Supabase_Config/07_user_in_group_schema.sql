-- Safely create table if it does not already exist
CREATE TABLE IF NOT EXISTS user_in_group (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE user_in_group ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent collision
DROP POLICY IF EXISTS "Members can view their group's members" ON user_in_group;
DROP POLICY IF EXISTS "Users can join groups" ON user_in_group;
DROP POLICY IF EXISTS "Users can leave groups" ON user_in_group;
DROP POLICY IF EXISTS "Creators can remove members" ON user_in_group;

-- Members can see who else is in their groups
CREATE POLICY "Members can view their group's members"
  ON user_in_group FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT creator_id FROM groups WHERE id = group_id)
  );

-- Any authenticated user can join a group
CREATE POLICY "Users can join groups"
  ON user_in_group FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can leave a group themselves
CREATE POLICY "Users can leave groups"
  ON user_in_group FOR DELETE
  USING (auth.uid() = user_id);

-- Creators can remove members from their group
CREATE POLICY "Creators can remove members"
  ON user_in_group FOR DELETE
  USING (
    auth.uid() = (SELECT creator_id FROM groups WHERE id = group_id)
  );
