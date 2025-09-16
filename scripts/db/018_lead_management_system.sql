-- Migration 018: Lead Management System with Users

-- 1. Create users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Create lead_status table for tracking current lead states
CREATE TABLE IF NOT EXISTS lead_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_slug TEXT UNIQUE NOT NULL REFERENCES plumbing_leads(slug) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('active', 'not_interested', 'warm', 'cold', 'follow_up')) DEFAULT 'active',
  call_notes TEXT,
  website_sent BOOLEAN DEFAULT false,
  website_sent_date TIMESTAMP WITH TIME ZONE,
  last_contact_date TIMESTAMP WITH TIME ZONE,
  follow_up_date DATE,
  updated_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create lead_archive table for removed/not interested leads
CREATE TABLE IF NOT EXISTS lead_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_slug TEXT NOT NULL,
  business_name TEXT,
  phone TEXT,
  city TEXT,
  reason TEXT CHECK (reason IN ('not_interested', 'bad_fit', 'out_of_service_area', 'duplicate', 'no_answer', 'wrong_number')),
  notes TEXT,
  archived_by TEXT,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lead_status_slug ON lead_status(lead_slug);
CREATE INDEX IF NOT EXISTS idx_lead_status_status ON lead_status(status);
CREATE INDEX IF NOT EXISTS idx_lead_status_follow_up ON lead_status(follow_up_date);
CREATE INDEX IF NOT EXISTS idx_lead_archive_slug ON lead_archive(lead_slug);
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 5. Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_archive ENABLE ROW LEVEL SECURITY;

-- 6. Create policies for public access (we'll handle auth in the app)
CREATE POLICY "Enable all access for admin_users" ON admin_users
  FOR ALL USING (true);

CREATE POLICY "Enable all access for lead_status" ON lead_status
  FOR ALL USING (true);

CREATE POLICY "Enable all access for lead_archive" ON lead_archive
  FOR ALL USING (true);

-- 7. Insert default admin user (username: nick, password: nick)
-- Using a simple hash for demo purposes - in production use bcrypt
INSERT INTO admin_users (username, password_hash, full_name, is_active)
VALUES ('nick', 'nick_hashed_password_2024', 'Nick Admin', true)
ON CONFLICT (username) DO NOTHING;

-- 8. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger for updated_at
CREATE TRIGGER update_lead_status_updated_at
  BEFORE UPDATE ON lead_status
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
  RAISE NOTICE '✅ Created lead management system tables with admin users';
  RAISE NOTICE '📝 Default admin user: username=nick, password=nick';
END $$;