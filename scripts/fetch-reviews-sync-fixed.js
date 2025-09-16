const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env.local file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_BUSINESSES = 5;
const MAX_REVIEWS_PER_BUSINESS = 10;

async function fetchReviewsFromApify(businesses) {
  try {
    console.log(`\nFetching reviews for ${businesses.length} businesses...`);

    // Create array of place IDs
    const placeIds = businesses.map(b => b.place_id);

    console.log('Sending place IDs:', placeIds);

    const requestBody = {
      queries: placeIds,
      maxReviews: MAX_REVIEWS_PER_BUSINESS,
      reviewsSort: 'newest',
      language: 'en',
      personalData: false,
      scrapeReviewId: true,
      scrapeReviewUrl: true,
      scrapeReviewPhoto: true,
      scrapeReviewerName: true,
      scrapeReviewerUrl: true
    };

    console.log('\nMaking request to Apify...');

    const response = await axios.post(
      'https://api.apify.com/v2/acts/compass~google-maps-reviews-scraper/run-sync-get-dataset-items?token=apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3',
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout for sync call
      }
    );

    console.log(`Response received. Status: ${response.status}`);

    if (response.data && Array.isArray(response.data)) {
      console.log(`Received ${response.data.length} items from Apify`);

      // Process each location result
      const allReviews = [];
      const businessMap = new Map(businesses.map(b => [b.place_id, b.name]));

      for (const item of response.data) {
        // Extract place ID from the item
        const itemPlaceId = item.placeId || item.place_id || (item.query && extractPlaceId(item.query));
        const businessName = businessMap.get(itemPlaceId) || item.title || 'Unknown Business';

        if (item.reviews && Array.isArray(item.reviews)) {
          console.log(`  Found ${item.reviews.length} reviews for ${businessName}`);

          // Add metadata to each review
          const reviewsWithMeta = item.reviews.map(review => ({
            ...review,
            placeId: itemPlaceId,
            businessName: businessName,
            fetchedAt: new Date().toISOString()
          }));

          allReviews.push(...reviewsWithMeta);
        }
      }

      // Filter only 5-star reviews
      const fiveStarReviews = allReviews.filter(review => review.stars === 5);
      console.log(`\nTotal reviews found: ${allReviews.length}`);
      console.log(`Five-star reviews: ${fiveStarReviews.length}`);

      return fiveStarReviews;
    }

    console.log('No data in response');
    return [];

  } catch (error) {
    console.error('\nError fetching reviews:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      if (error.response.data) {
        console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    return [];
  }
}

function extractPlaceId(query) {
  // Try to extract place ID from query string if it's a URL
  const match = query.match(/place_id[=:]([^&\s]+)/);
  return match ? match[1] : null;
}

async function saveReviewsToDatabase(reviews) {
  if (reviews.length === 0) return 0;

  console.log(`\nSaving ${reviews.length} reviews to database...`);

  const reviewsToInsert = reviews.map(review => ({
    place_id: review.placeId,
    reviewer_name: review.name || review.reviewerName || 'Anonymous',
    review_text: review.text || review.reviewText || null,
    stars: review.stars || review.rating || 5,
    published_at: review.publishAt || review.publishedAt || null,
    published_at_date: review.publishedAtDate ? new Date(review.publishedAtDate).toISOString() : null,
    review_id: review.reviewId || `${review.placeId}_${Date.now()}_${Math.random()}`,
    reviewer_url: review.reviewerUrl || null,
    review_url: review.reviewUrl || null,
    likes_count: review.likesCount || 0,
    reviewer_photo_url: review.reviewerPhotoUrl || null,
    is_local_guide: review.isLocalGuide || false
  }));

  const { data, error } = await supabase
    .from('google_reviews')
    .upsert(reviewsToInsert, {
      onConflict: 'review_id',
      ignoreDuplicates: true
    });

  if (error) {
    console.error('Error inserting reviews:', error);
    return 0;
  }

  console.log(`Successfully saved ${reviewsToInsert.length} reviews`);
  return reviewsToInsert.length;
}

async function main() {
  try {
    console.log('=== Google Reviews Fetcher (Fixed Sync) ===');
    console.log(`Fetching reviews for up to ${MAX_BUSINESSES} businesses`);
    console.log(`Max ${MAX_REVIEWS_PER_BUSINESS} reviews per business\n`);

    // Get businesses from database
    const { data: businesses, error } = await supabase
      .from('plumbing_leads')
      .select('name, place_id, city, state')
      .not('place_id', 'is', null)
      .limit(MAX_BUSINESSES);

    if (error || !businesses || businesses.length === 0) {
      console.error('No businesses found with place_id');
      process.exit(1);
    }

    console.log(`Found ${businesses.length} businesses with place_ids:`);
    businesses.forEach(b => console.log(`  - ${b.name} (${b.place_id})`));

    // Fetch reviews for all businesses in one call
    const reviews = await fetchReviewsFromApify(businesses);

    // Save to database
    let savedCount = 0;
    if (reviews.length > 0) {
      savedCount = await saveReviewsToDatabase(reviews);
    }

    // Save results to file
    const outputData = {
      timestamp: new Date().toISOString(),
      businessesQueried: businesses.length,
      totalReviewsFetched: reviews.length,
      reviewsSaved: savedCount,
      businesses: businesses.map(b => ({
        name: b.name,
        place_id: b.place_id,
        reviewCount: reviews.filter(r => r.placeId === b.place_id).length
      })),
      reviews: reviews
    };

    const outputFile = path.join(__dirname, '..', 'data', 'fetched_reviews_sync.json');
    fs.writeFileSync(outputFile, JSON.stringify(outputData, null, 2));

    console.log('\n=== Summary ===');
    console.log(`Businesses queried: ${businesses.length}`);
    console.log(`Total five-star reviews fetched: ${reviews.length}`);
    console.log(`Reviews saved to database: ${savedCount}`);
    console.log(`Output file: ${outputFile}`);

    // Test the view
    const { data: viewTest, error: viewError } = await supabase
      .from('five_star_reviews')
      .select('*')
      .limit(5);

    if (!viewError && viewTest) {
      console.log(`\nFive-star reviews view test: ${viewTest.length} sample records`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });