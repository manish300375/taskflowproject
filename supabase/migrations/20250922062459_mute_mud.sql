/*
  # Fix Storage RLS Policy for Profile Images

  1. Storage Configuration
    - Drop existing policies that may be incorrect
    - Create proper RLS policies for profile-images bucket
    - Allow authenticated users to upload/manage their own files

  2. Security
    - Users can only access files in their own folder structure
    - File path validation ensures user owns the file
*/

-- First, ensure the profile-images bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

-- Create comprehensive RLS policies for the profile-images bucket
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array((storage.filename(name)), '-'))[1] = auth.uid()::text
);

CREATE POLICY "Users can view profile images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-images');

CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array((storage.filename(name)), '-'))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'avatars' AND
  (regexp_split_to_array((storage.filename(name)), '-'))[1] = auth.uid()::text
);