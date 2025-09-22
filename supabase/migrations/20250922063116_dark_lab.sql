/*
  # Fix storage RLS policies for profile images

  1. Storage Policies
    - Drop existing policies that may be incorrect
    - Create proper INSERT policy for authenticated users to upload their own avatars
    - Create proper SELECT policy for users to view their own avatars
    - Create proper UPDATE policy for users to update their own avatars
    - Create proper DELETE policy for users to delete their own avatars

  2. Policy Logic
    - Uses split_part() to extract user ID from filename format: avatars/{user_id}-{timestamp}.{ext}
    - Ensures authenticated users can only manage files with their own user ID in the path
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own avatars" ON storage.objects;

-- Create INSERT policy for uploading avatars
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

-- Create SELECT policy for viewing avatars
CREATE POLICY "Allow users to view own avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

-- Create UPDATE policy for updating avatars
CREATE POLICY "Allow users to update own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
)
WITH CHECK (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);

-- Create DELETE policy for deleting avatars
CREATE POLICY "Allow users to delete own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  auth.uid()::text = split_part(split_part(name, '/', 2), '-', 1)
);