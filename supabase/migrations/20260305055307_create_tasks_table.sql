/*
  # Create Tasks Management Schema

  ## Overview
  This migration sets up the complete database schema for a task management application with user authentication.

  ## New Tables
  
  ### `tasks`
  - `id` (uuid, primary key) - Unique identifier for each task
  - `user_id` (uuid, foreign key) - References auth.users, the owner of the task
  - `title` (text) - The task title/name
  - `description` (text, nullable) - Optional detailed description of the task
  - `status` (text) - Task status: 'pending', 'in_progress', or 'completed'
  - `priority` (text) - Priority level: 'low', 'medium', or 'high'
  - `due_date` (timestamptz, nullable) - Optional due date for the task
  - `created_at` (timestamptz) - Timestamp when task was created
  - `updated_at` (timestamptz) - Timestamp when task was last updated

  ## Security
  
  1. Enable Row Level Security (RLS) on tasks table
  2. Policies:
     - Users can view only their own tasks
     - Users can insert tasks for themselves only
     - Users can update only their own tasks
     - Users can delete only their own tasks

  ## Important Notes
  - All tasks are private to the user who created them
  - RLS ensures complete data isolation between users
  - Timestamps are automatically managed for audit trail
*/

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view only their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert tasks for themselves
CREATE POLICY "Users can insert own tasks"
  ON tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update only their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx ON tasks(due_date);