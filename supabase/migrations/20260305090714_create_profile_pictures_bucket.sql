/*
  # Create profile_pictures storage bucket

  1. Storage Bucket
    - Create `profile_pictures` bucket for storing user profile images
    - Set bucket to public so profile pictures can be viewed by anyone
    - Allow users to upload images up to 5MB
  
  2. Security Policies
    - Enable RLS on storage.objects for the profile_pictures bucket
    - Allow authenticated users to upload their own profile pictures
    - Allow authenticated users to update their own profile pictures
    - Allow authenticated users to delete their own profile pictures
    - Allow public read access to all profile pictures
  
  3. Important Notes
    - File size limit: 5MB (5242880 bytes)
    - Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
    - Files are organized by user ID in folders
*/

-- Create the profile_pictures bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile_pictures',
  'profile_pictures',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

-- Policy: Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile_pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update own profile picture"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile_pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'profile_pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete own profile picture"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile_pictures' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Allow public read access to all profile pictures
CREATE POLICY "Public can view profile pictures"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile_pictures');
