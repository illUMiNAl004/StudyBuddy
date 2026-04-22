-- 1. Add new columns for group integration and privacy
ALTER TABLE notes 
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 2. Clean out old security permissions
DROP POLICY IF EXISTS "Anyone can view notes" ON notes;
DROP POLICY IF EXISTS "Users can view notes" ON notes;

-- 3. Create the new smart read policy
-- Users can see a note if:
--   a) It's public (is_private = false AND group_id is null)
--   b) It's their own note (auth.uid() = author_id)
--   c) It belongs to a group they are a member of
CREATE POLICY "Users can view notes"
  ON notes FOR SELECT
  USING (
    (is_private = false AND group_id IS NULL)
    OR
    (auth.uid() = author_id)
    OR
    (group_id IS NOT NULL AND is_group_member(group_id, auth.uid()))
  );
