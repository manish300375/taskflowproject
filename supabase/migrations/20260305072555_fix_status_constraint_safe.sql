/*
  # Fix Task Status Constraint (Safe Version)

  ## Overview
  This migration safely updates the status constraint to use 'todo' instead of 'pending'.

  ## Changes
  1. Drop the existing status check constraint
  2. Add new constraint with correct values: 'todo', 'in_progress', 'completed'
  3. Update default value for status column

  ## Important Notes
  - This aligns the database constraint with the frontend implementation
  - Constraint is dropped first to allow existing operations to complete
*/

-- Drop the old constraint first to unblock any pending operations
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;

-- Update any existing 'pending' tasks to 'todo' if they exist
UPDATE tasks SET status = 'todo' WHERE status = 'pending';

-- Update the default value for the status column
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'todo';

-- Add the new constraint with correct values
ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
  CHECK (status IN ('todo', 'in_progress', 'completed'));