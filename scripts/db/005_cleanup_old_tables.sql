-- Migration: Clean up old unused tables and rename leeds_2_0 to businesses
-- This migration removes all test and unused tables, keeping only essential data

-- First, drop all the old/unused tables
DROP TABLE IF EXISTS test_table CASCADE;
DROP TABLE IF EXISTS fake_test CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS test CASCADE;
DROP TABLE IF EXISTS "biz 2" CASCADE;
DROP TABLE IF EXISTS business_assets CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS campaign_contacts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS messages_new CASCADE;
DROP TABLE IF EXISTS template_sends CASCADE;
DROP TABLE IF EXISTS template_views CASCADE;

-- Keep but consider: biz (has 641 rows), os_raw (has 2295 rows), google_reviews (has 51 rows)
-- Let's keep these for now as they might have useful data

-- Rename leeds_2_0 to businesses (our main table going forward)
ALTER TABLE leeds_2_0 RENAME TO businesses;

-- Update the businesses table structure for the new platform
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS niche VARCHAR(50) DEFAULT 'plumbers',
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'imported',
  ADD COLUMN IF NOT EXISTS outreach_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_images JSONB,
  ADD COLUMN IF NOT EXISTS custom_content JSONB,
  ADD COLUMN IF NOT EXISTS template_overrides JSONB,
  ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_visitors INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS avg_time_on_site INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed TIMESTAMP,
  ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT,
  ADD COLUMN IF NOT EXISTS ghl_synced_at TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_businesses_niche ON businesses(niche);
CREATE INDEX IF NOT EXISTS idx_businesses_status ON businesses(status);
CREATE INDEX IF NOT EXISTS idx_businesses_priority ON businesses(priority DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_total_views ON businesses(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_businesses_last_viewed ON businesses(last_viewed DESC);

-- Create analytics table for tracking page views and events
CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL, -- 'page_view', 'click', 'form_submit', 'call_click'
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  page_path TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_business_id ON analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics(session_id);

-- Create templates table for managing different website templates
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  niche VARCHAR(50),
  type VARCHAR(50) DEFAULT 'default', -- 'default', 'premium', 'custom'
  description TEXT,
  components JSONB, -- template structure and components
  styles JSONB, -- customizable style variables
  preview_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT INTO templates (name, niche, type, description) VALUES
  ('Modern', 'plumbers', 'default', 'Clean, modern design with bold CTAs'),
  ('Professional', 'plumbers', 'default', 'Traditional business layout'),
  ('Bold', 'plumbers', 'premium', 'High-impact design with animations')
ON CONFLICT DO NOTHING;

-- Create business_templates junction table
CREATE TABLE IF NOT EXISTS business_templates (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id) ON DELETE CASCADE,
  template_id INTEGER REFERENCES templates(id) ON DELETE CASCADE,
  customizations JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(business_id, template_id)
);

-- Create campaigns table for tracking outreach campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  niche VARCHAR(50),
  template_id INTEGER REFERENCES templates(id),
  business_ids INTEGER[], -- array of business IDs in this campaign
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'completed'
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create a summary of what we did
DO $$
BEGIN
  RAISE NOTICE 'Database cleanup completed:';
  RAISE NOTICE '- Dropped all test and unused tables';
  RAISE NOTICE '- Renamed leeds_2_0 to businesses';
  RAISE NOTICE '- Added tracking and customization columns';
  RAISE NOTICE '- Created analytics table for tracking';
  RAISE NOTICE '- Created templates system';
  RAISE NOTICE '- Created outreach campaigns table';
  RAISE NOTICE '- Added performance indexes';
END $$;