-- Create plumbing_leads table with EXACT columns from mobile_filtered_plumbing_data.csv
CREATE TABLE IF NOT EXISTS plumbing_leads (
  id SERIAL PRIMARY KEY,

  -- Exact columns from CSV (30 columns)
  name TEXT,
  site TEXT,
  subtypes TEXT,
  category TEXT,
  type TEXT,
  phone TEXT,
  phone_phones_enricher_carrier_name TEXT,  -- was phone.phones_enricher.carrier_name
  phone_phones_enricher_carrier_type TEXT,  -- was phone.phones_enricher.carrier_type
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  full_address TEXT,
  city TEXT,
  state TEXT,
  area_service TEXT,
  rating TEXT,  -- keeping as TEXT since CSV might have empty values
  reviews TEXT,  -- keeping as TEXT since CSV might have empty values
  reviews_link TEXT,
  photos_count TEXT,  -- keeping as TEXT since CSV might have empty values
  working_hours TEXT,
  verified TEXT,  -- keeping as TEXT since CSV has True/False strings
  location_link TEXT,
  place_id TEXT,
  email_1 TEXT,
  email_1_emails_validator_status TEXT,  -- was email_1.emails_validator.status
  facebook TEXT,
  instagram TEXT,
  logo TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  slug TEXT UNIQUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_plumbing_leads_slug ON plumbing_leads(slug);
CREATE INDEX IF NOT EXISTS idx_plumbing_leads_city ON plumbing_leads(city);
CREATE INDEX IF NOT EXISTS idx_plumbing_leads_state ON plumbing_leads(state);

-- Enable Row Level Security
ALTER TABLE plumbing_leads ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Enable read access for all users" ON plumbing_leads
  FOR SELECT USING (true);

DO $$
BEGIN
  RAISE NOTICE '✅ Created plumbing_leads table with exact CSV columns';
END $$;