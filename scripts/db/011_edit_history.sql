-- Create edit history table
CREATE TABLE IF NOT EXISTS plumbing_edit_history (
  id SERIAL PRIMARY KEY,
  business_slug TEXT NOT NULL,
  edit_type TEXT NOT NULL, -- 'custom_images', 'custom_text', 'custom_colors', 'custom_styles', 'custom_buttons'
  field_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  device_type TEXT DEFAULT 'all', -- 'all', 'desktop', 'tablet', 'mobile'
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_history_slug_created ON plumbing_edit_history (business_slug, created_at DESC);

-- Add device-specific columns to plumbing_templates
ALTER TABLE plumbing_templates
ADD COLUMN IF NOT EXISTS custom_styles_mobile JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_styles_tablet JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_styles_desktop JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP DEFAULT NOW();