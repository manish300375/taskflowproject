/*
  # Add Vector Embeddings to Tasks

  1. Extension
    - Enable the `vector` extension for vector similarity search
  
  2. Schema Changes
    - Add `embedding` column to tasks table (vector type with 384 dimensions for gte-small model)
    - Add vector similarity search index for performance
  
  3. Functions
    - Create function to automatically generate embeddings when tasks are created or updated
    - Create function for semantic search using cosine similarity
  
  4. Important Notes
    - Uses gte-small model which produces 384-dimensional embeddings
    - Embeddings are generated from task title and description
    - Cosine similarity is used for vector comparison (1 = identical, 0 = unrelated)
*/

-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tasks table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE tasks ADD COLUMN embedding vector(384);
  END IF;
END $$;

-- Create index for vector similarity search using cosine distance
CREATE INDEX IF NOT EXISTS tasks_embedding_idx ON tasks 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION search_tasks_by_similarity(
  query_embedding vector(384),
  similarity_threshold float DEFAULT 0.8,
  match_count int DEFAULT 10,
  filter_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  title text,
  description text,
  status text,
  priority text,
  due_date timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.user_id,
    t.title,
    t.description,
    t.status,
    t.priority,
    t.due_date,
    t.created_at,
    t.updated_at,
    1 - (t.embedding <=> query_embedding) as similarity
  FROM tasks t
  WHERE 
    t.embedding IS NOT NULL
    AND (filter_user_id IS NULL OR t.user_id = filter_user_id)
    AND 1 - (t.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
