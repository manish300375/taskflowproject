/*
  # Add Priority, Status, and Due Date to Tasks

  1. Changes
    - Add `priority` column (text, values: 'low', 'medium', 'high')
    - Add `status` column (text, values: 'todo', 'in_progress', 'completed')
    - Add `due_date` column (date, nullable)
    - Set default values for existing tasks
  
  2. Notes
    - Priority defaults to 'medium' for new tasks
    - Status defaults to 'todo' for new tasks
    - Due date is optional and can be null
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'medium' NOT NULL;
    ALTER TABLE tasks 
      ADD CONSTRAINT tasks_priority_check 
      CHECK (priority IN ('low', 'medium', 'high'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'status'
  ) THEN
    ALTER TABLE tasks ADD COLUMN status text DEFAULT 'todo' NOT NULL;
    ALTER TABLE tasks 
      ADD CONSTRAINT tasks_status_check 
      CHECK (status IN ('todo', 'in_progress', 'completed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'due_date'
  ) THEN
    ALTER TABLE tasks ADD COLUMN due_date date;
  END IF;
END $$;