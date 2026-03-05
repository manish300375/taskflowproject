/*
  # Create Subtasks Table

  ## Overview
  This migration creates a table to store AI-generated subtasks for each task.

  ## New Tables
  1. `subtasks`
    - `id` (uuid, primary key) - Unique identifier for each subtask
    - `task_id` (uuid, foreign key) - References the parent task
    - `title` (text) - The subtask title/description
    - `completed` (boolean) - Whether the subtask is completed
    - `order` (integer) - Display order of subtasks
    - `created_at` (timestamptz) - When the subtask was created

  ## Security
  - Enable RLS on `subtasks` table
  - Add policy for authenticated users to read their own subtasks (via task ownership)
  - Add policy for authenticated users to insert subtasks for their own tasks
  - Add policy for authenticated users to update their own subtasks
  - Add policy for authenticated users to delete their own subtasks

  ## Important Notes
  - Subtasks are automatically deleted when parent task is deleted (CASCADE)
  - Users can only access subtasks for tasks they own
*/

-- Create subtasks table
CREATE TABLE IF NOT EXISTS subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean DEFAULT false,
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view subtasks for their own tasks
CREATE POLICY "Users can view own task subtasks"
  ON subtasks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can insert subtasks for their own tasks
CREATE POLICY "Users can insert subtasks for own tasks"
  ON subtasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can update their own subtasks
CREATE POLICY "Users can update own task subtasks"
  ON subtasks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Policy: Users can delete their own subtasks
CREATE POLICY "Users can delete own task subtasks"
  ON subtasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tasks
      WHERE tasks.id = subtasks.task_id
      AND tasks.user_id = auth.uid()
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_order ON subtasks(task_id, "order");