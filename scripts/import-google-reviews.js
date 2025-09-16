const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importFiveStarReviews() {
  try {
    // Read the reviews JSON file
    console.log('Reading reviews data...');
    const rawData = fs.readFileSync('data/all_reviews_raw.json', 'utf8');
    const allReviews = JSON.parse(rawData);

    // Filter only 5-star reviews
    const fiveStarReviews = allReviews.filter(review => review.stars === 5);
    console.log(`Found ${fiveStarReviews.length} five-star reviews out of ${allReviews.length} total reviews`);

    // Get unique place IDs from reviews
    const uniquePlaceIds = [...new Set(fiveStarReviews.map(r => r.placeId).filter(Boolean))];
    console.log(`Found ${uniquePlaceIds.length} unique businesses with 5-star reviews`);

    // Check which place_ids exist in our plumbing_leads table
    const { data: existingBusinesses, error: bizError } = await supabase
      .from('plumbing_leads')
      .select('place_id')
      .in('place_id', uniquePlaceIds);

    if (bizError) {
      console.error('Error checking existing businesses:', bizError);
    } else {
      const existingPlaceIds = new Set(existingBusinesses?.map(b => b.place_id) || []);
      console.log(`${existingPlaceIds.size} businesses found in plumbing_leads table`);

      // Filter reviews to only those matching existing businesses
      const matchingReviews = fiveStarReviews.filter(r => existingPlaceIds.has(r.placeId));
      console.log(`${matchingReviews.length} five-star reviews match existing businesses`);
    }

    // Prepare batch insert data
    const reviewsToInsert = [];
    const batchSize = 100;
    let skippedCount = 0;

    for (const review of fiveStarReviews) {
      // Skip reviews without essential data
      if (!review.placeId || !review.name) {
        skippedCount++;
        continue;
      }

      reviewsToInsert.push({
        place_id: review.placeId,
        reviewer_name: review.name,
        review_text: review.text || null,
        stars: review.stars,
        published_at: review.publishAt || null,
        published_at_date: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
        review_id: review.reviewId || null,
        reviewer_url: review.reviewerUrl || null,
        review_url: review.reviewUrl || null,
        likes_count: review.likesCount || 0,
        reviewer_photo_url: review.reviewerPhotoUrl || null,
        is_local_guide: review.isLocalGuide || false
      });
    }

    console.log(`Prepared ${reviewsToInsert.length} reviews for insertion (skipped ${skippedCount} with missing data)`);

    // Insert reviews in batches
    let inserted = 0;
    let errors = 0;

    for (let i = 0; i < reviewsToInsert.length; i += batchSize) {
      const batch = reviewsToInsert.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('google_reviews')
        .upsert(batch, {
          onConflict: 'review_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        errors += batch.length;
      } else {
        inserted += batch.length;
        console.log(`Inserted batch ${Math.floor(i/batchSize) + 1} (${inserted}/${reviewsToInsert.length})`);
      }
    }

    console.log('\\n=== Import Summary ===');
    console.log(`Total reviews in file: ${allReviews.length}`);
    console.log(`Five-star reviews: ${fiveStarReviews.length}`);
    console.log(`Reviews prepared: ${reviewsToInsert.length}`);
    console.log(`Successfully inserted: ${inserted}`);
    console.log(`Errors: ${errors}`);

    // Test the view
    const { data: viewTest, error: viewError } = await supabase
      .from('five_star_reviews')
      .select('*')
      .limit(5);

    if (viewError) {
      console.error('Error testing five_star_reviews view:', viewError);
    } else {
      console.log(`\\nFive-star reviews view working: ${viewTest?.length || 0} sample records retrieved`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the import
console.log('Starting Google Reviews import...');
console.log('================================\\n');

importFiveStarReviews()
  .then(() => {
    console.log('\\nImport completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });