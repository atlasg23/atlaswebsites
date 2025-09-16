-- Migration: Final cleanup - Keep ONLY _migrations and businesses tables
-- Everything else gets deleted

-- First, verify our plumbing data is safe in businesses table
DO $$
DECLARE
  business_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO business_count FROM businesses;
  IF business_count < 800 THEN
    RAISE EXCEPTION 'Businesses table has less than 800 records! Aborting to protect data.';
  END IF;
  RAISE NOTICE 'Businesses table has % records - safe to proceed', business_count;
END $$;

-- Drop ALL tables except _migrations and businesses
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS biz CASCADE;
DROP TABLE IF EXISTS business_templates CASCADE;
DROP TABLE IF EXISTS google_reviews CASCADE;
DROP TABLE IF EXISTS os_raw CASCADE;
DROP TABLE IF EXISTS outreach_campaigns CASCADE;
DROP TABLE IF EXISTS templates CASCADE;

-- Also drop any remaining tables we might have missed
DROP TABLE IF EXISTS "biz 2" CASCADE;
DROP TABLE IF EXISTS test CASCADE;
DROP TABLE IF EXISTS test_table CASCADE;
DROP TABLE IF EXISTS fake_test CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS business_assets CASCADE;
DROP TABLE IF EXISTS call_logs CASCADE;
DROP TABLE IF EXISTS campaign_contacts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS messages_new CASCADE;
DROP TABLE IF EXISTS template_sends CASCADE;
DROP TABLE IF EXISTS template_views CASCADE;

-- Now we have a clean slate with just:
-- 1. _migrations (for tracking migrations)
-- 2. businesses (our 844 plumbing leads with all the new columns we added)

-- Let's verify the businesses table has our data and new columns
DO $$
DECLARE
  rec_count INTEGER;
  has_niche BOOLEAN;
  has_status BOOLEAN;
  has_views BOOLEAN;
BEGIN
  -- Count records
  SELECT COUNT(*) INTO rec_count FROM businesses;

  -- Check if new columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'niche'
  ) INTO has_niche;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'status'
  ) INTO has_status;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'total_views'
  ) INTO has_views;

  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '✅ FINAL DATABASE STATE:';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Tables remaining: _migrations, businesses';
  RAISE NOTICE 'Businesses table has % plumbing records', rec_count;
  RAISE NOTICE 'Has niche column: %', has_niche;
  RAISE NOTICE 'Has status column: %', has_status;
  RAISE NOTICE 'Has total_views column: %', has_views;
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Database is now clean and ready!';
  RAISE NOTICE '===========================================';
END $$;