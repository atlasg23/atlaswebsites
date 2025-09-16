-- Migration 017: Create Google Reviews Table
-- This migration creates a table for storing Google reviews linked to businesses

-- Create google_reviews table
CREATE TABLE IF NOT EXISTS google_reviews (
  id SERIAL PRIMARY KEY,
  place_id TEXT NOT NULL,
  reviewer_name TEXT NOT NULL,
  review_text TEXT,
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  published_at TEXT,
  published_at_date TIMESTAMP,
  review_id TEXT UNIQUE,
  reviewer_url TEXT,
  review_url TEXT,
  likes_count INTEGER DEFAULT 0,
  reviewer_photo_url TEXT,
  is_local_guide BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on place_id for fast lookups
CREATE INDEX idx_google_reviews_place_id ON google_reviews(place_id);

-- Create index on stars for filtering
CREATE INDEX idx_google_reviews_stars ON google_reviews(stars);

-- Create index on published_at_date for sorting
CREATE INDEX idx_google_reviews_published_date ON google_reviews(published_at_date DESC);

-- Add foreign key constraint to link with plumbing_leads
-- Note: This assumes plumbing_leads.place_id exists
-- We're not enforcing the constraint strictly in case some reviews don't match businesses
CREATE INDEX idx_google_reviews_business_link ON google_reviews(place_id)
WHERE place_id IS NOT NULL;

-- Create a view for easy access to 5-star reviews with business info
CREATE VIEW five_star_reviews AS
SELECT
  gr.*,
  pl.name as business_name,
  pl.city,
  pl.state
FROM google_reviews gr
LEFT JOIN plumbing_leads pl ON gr.place_id = pl.place_id
WHERE gr.stars = 5
ORDER BY gr.published_at_date DESC;

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_reviews_updated_at
BEFORE UPDATE ON google_reviews
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();