const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importApifyDataset() {
  try {
    console.log('=== Importing Apify Dataset Reviews ===\n');

    // Read the dataset file
    const data = JSON.parse(fs.readFileSync('data/apify-dataset.json', 'utf8'));
    console.log(`Total items in dataset: ${data.length}`);

    // Filter for actual reviews (items with reviewId and stars)
    const reviews = data.filter(item =>
      item.reviewId &&
      item.stars &&
      item.placeId &&
      !item.error
    );
    console.log(`Found ${reviews.length} valid reviews`);

    // Filter for 5-star reviews only
    const fiveStarReviews = reviews.filter(r => r.stars === 5);
    console.log(`Found ${fiveStarReviews.length} five-star reviews`);

    // Get unique place IDs
    const uniquePlaceIds = [...new Set(reviews.map(r => r.placeId))];
    console.log(`Reviews cover ${uniquePlaceIds.length} unique businesses`);

    // Prepare reviews for insertion
    const reviewsToInsert = reviews.map(review => ({
      place_id: review.placeId,
      reviewer_name: review.name || 'Anonymous',
      review_text: review.text || null,
      stars: review.stars,
      published_at: review.publishAt || null,
      published_at_date: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
      review_id: review.reviewId,
      reviewer_url: review.reviewerUrl || null,
      review_url: review.reviewUrl || null,
      likes_count: review.likesCount || 0,
      reviewer_photo_url: review.reviewerPhotoUrl || null,
      is_local_guide: review.isLocalGuide || false
    }));

    console.log(`\nPrepared ${reviewsToInsert.length} reviews for database insertion`);

    // Insert in batches of 100
    const batchSize = 100;
    let totalInserted = 0;
    let totalErrors = 0;

    for (let i = 0; i < reviewsToInsert.length; i += batchSize) {
      const batch = reviewsToInsert.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(reviewsToInsert.length / batchSize);

      process.stdout.write(`Inserting batch ${batchNum}/${totalBatches}... `);

      const { data, error } = await supabase
        .from('google_reviews')
        .upsert(batch, {
          onConflict: 'review_id',
          ignoreDuplicates: true
        });

      if (error) {
        console.log(`ERROR: ${error.message}`);
        totalErrors += batch.length;
      } else {
        console.log(`✓`);
        totalInserted += batch.length;
      }
    }

    console.log('\n=== Import Summary ===');
    console.log(`Total items in dataset: ${data.length}`);
    console.log(`Valid reviews found: ${reviews.length}`);
    console.log(`Five-star reviews: ${fiveStarReviews.length}`);
    console.log(`Unique businesses: ${uniquePlaceIds.length}`);
    console.log(`Reviews inserted: ${totalInserted}`);
    console.log(`Errors: ${totalErrors}`);

    // Show breakdown by star rating
    const starCounts = {};
    reviews.forEach(r => {
      starCounts[r.stars] = (starCounts[r.stars] || 0) + 1;
    });

    console.log('\nReview breakdown by stars:');
    Object.keys(starCounts).sort().forEach(stars => {
      console.log(`  ${stars} stars: ${starCounts[stars]} reviews`);
    });

    // Test the view
    const { data: viewTest, error: viewError } = await supabase
      .from('five_star_reviews')
      .select('*')
      .limit(5);

    if (!viewError && viewTest) {
      console.log(`\nFive-star reviews view test: ${viewTest.length} sample records retrieved`);
    }

    // Get total count in database
    const { count } = await supabase
      .from('google_reviews')
      .select('*', { count: 'exact', head: true });

    console.log(`\nTotal reviews now in database: ${count}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

importApifyDataset()
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Import failed:', error);
    process.exit(1);
  });