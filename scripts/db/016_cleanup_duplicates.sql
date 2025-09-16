-- Clean up test templates and fix version numbering

-- First, remove test business templates
DELETE FROM plumbing_templates
WHERE business_slug LIKE 'test-business-%';

-- For prestigeplumbingrepairllc-2, delete all but the latest
DELETE FROM plumbing_templates
WHERE business_slug = 'prestigeplumbingrepairllc-2'
AND id NOT IN (
  SELECT id FROM (
    SELECT id
    FROM plumbing_templates
    WHERE business_slug = 'prestigeplumbingrepairllc-2'
    ORDER BY version DESC
    LIMIT 1
  ) keep
);

-- Now update the remaining one to version 1
UPDATE plumbing_templates
SET version = 1,
    is_current = true,
    parent_version = NULL,
    change_summary = 'Initial version (cleaned up)'
WHERE business_slug = 'prestigeplumbingrepairllc-2';

-- Clean up any other businesses with multiple versions - keep only current
DELETE FROM plumbing_templates t1
WHERE EXISTS (
  SELECT 1
  FROM plumbing_templates t2
  WHERE t2.business_slug = t1.business_slug
  AND t2.is_current = true
  AND t2.id != t1.id
) AND t1.is_current = false;

-- Renumber all remaining templates to version 1
UPDATE plumbing_templates
SET version = 1,
    parent_version = NULL
WHERE version != 1;