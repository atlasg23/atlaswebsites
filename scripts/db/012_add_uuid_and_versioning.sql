-- Add UUID to plumbing_leads for universal business identifier
ALTER TABLE plumbing_leads
ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() UNIQUE;

-- Add versioning columns to plumbing_templates
ALTER TABLE plumbing_templates
ADD COLUMN IF NOT EXISTS business_uuid UUID,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS parent_version INTEGER,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS change_summary TEXT;

-- Link existing templates to plumbing_leads using UUID
UPDATE plumbing_templates pt
SET business_uuid = pl.uuid
FROM plumbing_leads pl
WHERE pt.business_slug = pl.slug
AND pt.business_uuid IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_templates_uuid_current
ON plumbing_templates (business_uuid, is_current)
WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_templates_slug_current
ON plumbing_templates (business_slug, is_current)
WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_templates_slug_version
ON plumbing_templates (business_slug, version);

-- Drop old primary key constraint if exists
ALTER TABLE plumbing_templates
DROP CONSTRAINT IF EXISTS plumbing_templates_pkey;

-- Create new composite primary key
ALTER TABLE plumbing_templates
ADD CONSTRAINT plumbing_templates_pkey
PRIMARY KEY (business_slug, version);

-- Add foreign key constraint
ALTER TABLE plumbing_templates
ADD CONSTRAINT fk_templates_business_uuid
FOREIGN KEY (business_uuid)
REFERENCES plumbing_leads(uuid)
ON DELETE CASCADE;