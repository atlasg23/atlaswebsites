-- First, ensure all existing plumbing_leads have UUIDs
UPDATE plumbing_leads
SET uuid = gen_random_uuid()
WHERE uuid IS NULL;

-- Now update plumbing_templates to link to the business UUID
-- This will match existing templates to their businesses
UPDATE plumbing_templates pt
SET business_uuid = pl.uuid
FROM plumbing_leads pl
WHERE pt.business_slug = pl.slug
AND pt.business_uuid IS NULL;

-- Add a foreign key constraint to ensure data integrity
ALTER TABLE plumbing_templates
ADD CONSTRAINT fk_business_uuid
FOREIGN KEY (business_uuid)
REFERENCES plumbing_leads(uuid)
ON DELETE CASCADE;