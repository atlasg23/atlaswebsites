-- Remove the old unique constraint on business_slug alone
-- This was preventing multiple versions from being created
ALTER TABLE plumbing_templates
DROP CONSTRAINT IF EXISTS plumbing_templates_business_slug_key;

-- The unique constraint should only be on (business_slug, version)
-- which we already added in 013_fix_primary_key.sql as unique_business_version

-- Verify we have the correct constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_business_version'
    ) THEN
        ALTER TABLE plumbing_templates
        ADD CONSTRAINT unique_business_version
        UNIQUE (business_slug, version);
    END IF;
END $$;