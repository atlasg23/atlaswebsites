-- Create businesses_2_0 table for plumbing data
CREATE TABLE IF NOT EXISTS businesses_2_0 (
  id SERIAL PRIMARY KEY,

  -- Core business fields from CSV
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
  reviews INTEGER DEFAULT 0,
  reviews_link TEXT,
  photos_count INTEGER DEFAULT 0,
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

  -- New platform tracking fields
  niche VARCHAR(50) DEFAULT 'plumbers',
  status VARCHAR(50) DEFAULT 'imported',
  outreach_date TIMESTAMP,
  last_activity TIMESTAMP,
  notes TEXT,
  priority INTEGER DEFAULT 0,
  custom_images JSONB,
  custom_content JSONB,
  template_overrides JSONB,
  total_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_site INTEGER DEFAULT 0,
  last_viewed TIMESTAMP,
  ghl_contact_id TEXT,
  ghl_synced_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_slug ON businesses_2_0(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_city ON businesses_2_0(city);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_state ON businesses_2_0(state);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_rating ON businesses_2_0(rating DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_reviews ON businesses_2_0(reviews DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_niche ON businesses_2_0(niche);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_status ON businesses_2_0(status);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_priority ON businesses_2_0(priority DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_2_0_total_views ON businesses_2_0(total_views DESC);

-- Enable Row Level Security
ALTER TABLE businesses_2_0 ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON businesses_2_0
  FOR SELECT USING (true);

-- Log creation
DO $$
BEGIN
  RAISE NOTICE 'Created businesses_2_0 table successfully';
END $$;