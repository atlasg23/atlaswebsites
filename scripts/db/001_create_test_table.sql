-- Create test table to verify migration system
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  test_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='test_table' AND column_name='test_value') THEN
    ALTER TABLE test_table ADD COLUMN test_value INTEGER;
  END IF;
END $$;

-- Enable Row Level Security (if not already enabled)
ALTER TABLE test_table ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for public access (for testing) - drop existing first
DROP POLICY IF EXISTS "Enable read access for all users" ON test_table;
CREATE POLICY "Enable read access for all users" ON test_table
  FOR SELECT USING (true);

-- Insert some test data
INSERT INTO test_table (name, test_value) VALUES
  ('Migration Test 1', 100),
  ('Migration Test 2', 200),
  ('Migration Test 3', 300)
ON CONFLICT DO NOTHING;