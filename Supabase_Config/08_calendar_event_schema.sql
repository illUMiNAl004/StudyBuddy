-- calendar event:
-- id
-- group id
-- start time
-- end time
-- location

CREATE TABLE IF NOT EXISTS calendar_event (
  id UUID NOT NULL PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_times CHECK (start_time < end_time)
);

ALTER TABLE calendar_event ENABLE ROW LEVEL SECURITY;

-- Clean up old policies to prevent collision
DROP POLICY IF EXISTS "Authenticated users can view all events" ON calendar_event;
DROP POLICY IF EXISTS "Group creators can manage their group events" ON calendar_event;
DROP POLICY IF EXISTS "Group members can view their group events" ON calendar_event;

-- Only members of the group can view its events
CREATE POLICY "Group members can view their group events"
  ON calendar_event FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM user_in_group WHERE group_id = group_id)
    OR auth.uid() = (SELECT creator_id FROM groups WHERE id = group_id)
  );

-- Only the group creator can manage events
CREATE POLICY "Group creators can manage their group events"
  ON calendar_event
  FOR ALL
  USING (
    auth.uid() = (SELECT creator_id FROM groups WHERE id = group_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT creator_id FROM groups WHERE id = group_id)
  );
