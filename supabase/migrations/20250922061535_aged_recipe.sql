/*
  # Fix Profile Images Storage RLS Policies

  1. Storage Policies
    - Drop existing policies that may be incorrect
    - Add proper INSERT policy for authenticated users to upload their own avatars
    - Add proper SELECT policy for users to view their own avatars
    - Add UPDATE policy for users to replace their own avatars
    - Add DELETE policy for users to delete their own avatars

  2. Security
    - Policies use regex to extract user ID from filename path
    - Only authenticated users can access their own files
    - Filename format: avatars/{user_id}-{timestamp}.{extension}
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to profile images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view their own avatar" ON storage.objects;

-- Create proper RLS policies for profile-images bucket
CREATE POLICY "Allow authenticated users to upload their own avatar"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '/'))[2] AND
    name ~ '^avatars/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}-[0-9]+\.(jpg|jpeg|png|webp)$'
  );

CREATE POLICY "Allow authenticated users to view their own avatar"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '/'))[2]
  );

CREATE POLICY "Allow authenticated users to update their own avatar"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '/'))[2]
  )
  WITH CHECK (
    bucket_id = 'profile-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '/'))[2]
  );

CREATE POLICY "Allow authenticated users to delete their own avatar"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images' AND 
    auth.uid()::text = (regexp_split_to_array(name, '/'))[2]
  );

-- Allow public read access to profile images (for displaying avatars)
CREATE POLICY "Allow public read access to profile images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');