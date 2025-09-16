-- Add custom_styles and custom_buttons fields to plumbing_templates table
ALTER TABLE plumbing_templates
ADD COLUMN IF NOT EXISTS custom_styles JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS custom_buttons JSONB DEFAULT '{}';