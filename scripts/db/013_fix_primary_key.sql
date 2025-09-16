-- Fix primary key issue for plumbing_templates
-- First, drop the composite primary key if it exists
ALTER TABLE plumbing_templates
DROP CONSTRAINT IF EXISTS plumbing_templates_pkey;

-- Add a regular id column as primary key if it doesn't exist
ALTER TABLE plumbing_templates
ADD COLUMN IF NOT EXISTS id SERIAL PRIMARY KEY;

-- Create unique constraint for business_slug + version instead
ALTER TABLE plumbing_templates
ADD CONSTRAINT unique_business_version
UNIQUE (business_slug, version);