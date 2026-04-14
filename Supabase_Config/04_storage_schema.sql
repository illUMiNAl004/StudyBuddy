-- 1. Create the bucket securely natively if it does not already exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('notes', 'notes', true) 
ON CONFLICT (id) DO NOTHING;

-- 2. Clean out old security permissions to make this script idempotent
DROP POLICY IF EXISTS "Anyone can read notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to notes bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in notes bucket" ON storage.objects;

-- 3. Security Rules
-- Rule A: Anyone (even guests theoretically) can view the images inside the bucket since they are meant to be public study notes.
CREATE POLICY "Anyone can read notes bucket"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'notes' );

-- Rule B: Security enforcer prevents unauthorized users from uploading junk into the server
CREATE POLICY "Authenticated users can upload to notes bucket"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'notes' AND auth.role() = 'authenticated' );

-- Rule C: Allows users to physically destroy their images off the server if they delete a note
CREATE POLICY "Users can delete their own uploads in notes bucket"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'notes' AND auth.uid() = owner );
