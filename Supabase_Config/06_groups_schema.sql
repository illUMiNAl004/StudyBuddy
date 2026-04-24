-- 1. Create the groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_title TEXT NOT NULL,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  requires_invite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- 2. Create the user_in_group membership table
CREATE TABLE IF NOT EXISTS user_in_group (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (group_id, user_id)
);

ALTER TABLE user_in_group ENABLE ROW LEVEL SECURITY;

-- 3. Create the group_join_requests table
CREATE TABLE IF NOT EXISTS group_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure user can only have one pending request per group
CREATE UNIQUE INDEX unique_pending_request ON group_join_requests (group_id, requester_id) WHERE status = 'pending';

ALTER TABLE group_join_requests ENABLE ROW LEVEL SECURITY;

-- 4. Create the notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  message TEXT,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- TRIGGERS & FUNCTIONS
-- ==========================================

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_groups_modtime
BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_requests_modtime
BEFORE UPDATE ON group_join_requests
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Trigger: Add creator to user_in_group upon group creation
CREATE OR REPLACE FUNCTION add_creator_to_group()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_in_group (group_id, user_id)
  VALUES (NEW.id, NEW.creator_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_group_created
AFTER INSERT ON groups
FOR EACH ROW EXECUTE PROCEDURE add_creator_to_group();

-- Trigger: notification on new join request
CREATE OR REPLACE FUNCTION notify_group_creator_on_request()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id UUID;
BEGIN
  SELECT creator_id INTO v_creator_id FROM groups WHERE id = NEW.group_id;
  INSERT INTO notifications (user_id, type, message, data)
  VALUES (
    v_creator_id,
    'join_request',
    'Someone requested to join your group.',
    jsonb_build_object('group_id', NEW.group_id, 'requester_id', NEW.requester_id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_join_request_created
AFTER INSERT ON group_join_requests
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE PROCEDURE notify_group_creator_on_request();

-- Trigger: Handle accepted/rejected join requests
CREATE OR REPLACE FUNCTION process_resolved_join_request()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Add to group
    INSERT INTO user_in_group (group_id, user_id) VALUES (NEW.group_id, NEW.requester_id) ON CONFLICT DO NOTHING;
    -- Notify requester
    INSERT INTO notifications (user_id, type, message, data)
    VALUES (
      NEW.requester_id,
      'join_accepted',
      'Your request to join a group was accepted.',
      jsonb_build_object('group_id', NEW.group_id)
    );
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    -- Notify requester
    INSERT INTO notifications (user_id, type, message, data)
    VALUES (
      NEW.requester_id,
      'join_rejected',
      'Your request to join a group was rejected.',
      jsonb_build_object('group_id', NEW.group_id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_join_request_resolved
AFTER UPDATE ON group_join_requests
FOR EACH ROW
EXECUTE PROCEDURE process_resolved_join_request();

-- ==========================================
-- ROW LEVEL SECURITY POLICIES
-- ==========================================

-- GROUPS Table
-- Anyone authenticated can view groups
CREATE POLICY "Groups are viewable by authenticated users"
ON groups FOR SELECT
USING (auth.role() = 'authenticated');

-- Auth users can create groups
CREATE POLICY "Users can insert their own groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() = creator_id);

-- Creators can update their groups
CREATE POLICY "Creators can update groups"
ON groups FOR UPDATE
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their groups
CREATE POLICY "Creators can delete groups"
ON groups FOR DELETE
USING (auth.uid() = creator_id);

-- USER_IN_GROUP Table
-- Users can see members only if they are in the group (Security definer helper function due to recursion issues)

-- Fast check for membership without hitting RLS recursion:
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM user_in_group WHERE group_id = p_group_id AND user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Users can view members of groups they belong to"
ON user_in_group FOR SELECT
USING (is_group_member(group_id, auth.uid()));

-- Users can join a group if requires_invite = false
CREATE POLICY "Users can join public groups"
ON user_in_group FOR INSERT
WITH CHECK (auth.uid() = user_id AND EXISTS (
  SELECT 1 FROM groups WHERE id = group_id AND requires_invite = false
));

-- Users can leave a group, but creator CANNOT leave.
CREATE POLICY "Users can leave a group"
ON user_in_group FOR DELETE
USING (
  auth.uid() = user_id AND
  NOT EXISTS (
    SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid()
  )
);

-- GROUP_JOIN_REQUESTS Table
-- Requesters can see their own requests, creators can see requests for their groups
CREATE POLICY "View join requests"
ON group_join_requests FOR SELECT
USING (
  auth.uid() = requester_id OR
  EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
);

-- Users can create requests for themselves
CREATE POLICY "Users can insert join requests"
ON group_join_requests FOR INSERT
WITH CHECK (auth.uid() = requester_id);

-- Only creators can update the status
CREATE POLICY "Creators can update join requests"
ON group_join_requests FOR UPDATE
USING (EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid()));

-- NOTIFICATIONS Table
-- Users can only read, update (for mark as read), or delete their own notifications
CREATE POLICY "Users can view their notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their notifications"
ON notifications FOR DELETE
USING (auth.uid() = user_id);

-- ==========================================
-- GROUP TRANSFER OWNERSHIP (Function)
-- ==========================================
-- Since clients might safely transfer ownership, we provide an RPC.
CREATE OR REPLACE FUNCTION transfer_group_ownership(p_group_id UUID, p_new_owner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_group_creator UUID;
BEGIN
  -- Verify the caller is the current creator
  SELECT creator_id INTO v_group_creator FROM groups WHERE id = p_group_id;
  IF v_group_creator IS NULL OR v_group_creator != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Ensure the new owner is in the group
  IF NOT is_group_member(p_group_id, p_new_owner_id) THEN
    RAISE EXCEPTION 'New owner must be a member of the group';
  END IF;

  -- Update creator
  UPDATE groups SET creator_id = p_new_owner_id WHERE id = p_group_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
