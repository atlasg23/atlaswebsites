-- Create leeds_2_0 table for plumbing business data
CREATE TABLE IF NOT EXISTS leeds_2_0 (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  site TEXT,
  subtypes TEXT,
  category TEXT,
  type TEXT,
  phone TEXT,
  phone_carrier_name TEXT,
  phone_carrier_type TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  full_address TEXT,
  city TEXT,
  state TEXT,
  area_service TEXT,
  rating DECIMAL(2, 1),
  reviews INTEGER,
  reviews_link TEXT,
  photos_count INTEGER,
  working_hours TEXT,
  verified BOOLEAN DEFAULT FALSE,
  location_link TEXT,
  place_id TEXT,
  email_1 TEXT,
  email_1_status TEXT,
  facebook TEXT,
  instagram TEXT,
  logo TEXT,
  primary_color TEXT DEFAULT '#0066CC',
  secondary_color TEXT DEFAULT '#004C99',
  slug TEXT UNIQUE,
  website TEXT,
  country TEXT DEFAULT 'United States',
  plus_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_slug ON leeds_2_0(slug);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_city ON leeds_2_0(city);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_state ON leeds_2_0(state);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_rating ON leeds_2_0(rating DESC);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_reviews ON leeds_2_0(reviews DESC);

-- Enable Row Level Security
ALTER TABLE leeds_2_0 ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON leeds_2_0
  FOR SELECT USING (true);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leeds_2_0_updated_at
  BEFORE UPDATE ON leeds_2_0
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();