-- Create fake_test table as requested
CREATE TABLE IF NOT EXISTS fake_test (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  test_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT INTO fake_test (name, test_value) VALUES
  ('Test Item 1', 100),
  ('Test Item 2', 200),
  ('Test Item 3', 300);

-- Enable Row Level Security
ALTER TABLE fake_test ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Enable all access for all users" ON fake_test
  FOR ALL USING (true) WITH CHECK (true);