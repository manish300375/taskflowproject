/*
  # Fix Storage RLS Policy for Profile Images

  1. Storage Policies
    - Drop existing conflicting policies
    - Create proper RLS policies for profile-images bucket
    - Allow authenticated users to upload only to their own avatar paths
    - Extract user ID from filename format: avatars/{userId}-{timestamp}.{ext}

  2. Security
    - Users can only access files with their user ID in the filename
    - All operations require authentication
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

-- Create comprehensive storage policies for profile-images bucket
CREATE POLICY "Users can upload own avatars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

CREATE POLICY "Users can view own avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

CREATE POLICY "Users can update own avatars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

CREATE POLICY "Users can delete own avatars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);