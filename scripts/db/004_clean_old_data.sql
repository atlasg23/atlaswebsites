-- Clean out all old test data and prepare for plumbing data import
-- This migration will clear existing data but preserve table structures

-- Clear test tables (keeping structure)
TRUNCATE TABLE test_table RESTART IDENTITY CASCADE;
TRUNCATE TABLE fake_test RESTART IDENTITY CASCADE;

-- Clear leeds_2_0 table to prepare for fresh plumbing data
TRUNCATE TABLE leeds_2_0 RESTART IDENTITY CASCADE;

-- Clear the old leads table if we're not using it
TRUNCATE TABLE leads RESTART IDENTITY CASCADE;

-- Add a note about the data cleanup
INSERT INTO test_table (name, test_value) VALUES
  ('Data cleaned on migration 004', 1);