-- Create plumbing_templates table for storing customizations
CREATE TABLE IF NOT EXISTS plumbing_templates (
  id SERIAL PRIMARY KEY,
  business_slug TEXT UNIQUE,
  template_name TEXT DEFAULT 'plumbing1', -- 'plumbing1' or 'plumbing2'

  -- Customizations stored as JSON
  custom_images JSONB DEFAULT '{}',
  custom_text JSONB DEFAULT '{}',
  custom_colors JSONB DEFAULT '{}',

  -- Publishing status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plumbing_templates_slug ON plumbing_templates(business_slug);