/*
  # Create profile images storage bucket

  1. Storage
    - Create `profile-images` storage bucket for user profile pictures
    - Enable public access for profile images
    - Set up RLS policies for secure access

  2. Security
    - Users can upload their own profile images
    - Users can view all profile images (public access)
    - Users can update/delete their own profile images
*/

-- Create the profile-images storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the storage.objects table for our bucket
CREATE POLICY "Users can upload their own profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile images are publicly viewable"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);