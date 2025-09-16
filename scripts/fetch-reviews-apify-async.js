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

// Apify configuration
const APIFY_TOKEN = 'apify_api_DrC4qdJIT1ethXdgpU2tEqZeaobP0h4EfLZ3';
const APIFY_ACTOR_ID = 'compass~google-maps-reviews-scraper';
const MAX_BUSINESSES = 5;
const MAX_REVIEWS_PER_BUSINESS = 10;

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function startActorRun(placeId, businessName) {
  try {
    console.log(`\nStarting actor run for ${businessName}...`);

    const input = {
      queries: [placeId],
      maxReviews: MAX_REVIEWS_PER_BUSINESS,
      reviewsSort: 'newest',
      language: 'en'
    };

    const response = await axios.post(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_TOKEN}`,
      input,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (response.data && response.data.data) {
      console.log(`  Run started with ID: ${response.data.data.id}`);
      return response.data.data.id;
    }
    return null;
  } catch (error) {
    console.error(`  Error starting actor run: ${error.message}`);
    if (error.response) {
      console.error(`  Response: ${JSON.stringify(error.response.data)}`);
    }
    return null;
  }
}

async function checkRunStatus(runId) {
  try {
    const response = await axios.get(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}?token=${APIFY_TOKEN}`
    );
    return response.data.data;
  } catch (error) {
    console.error(`  Error checking run status: ${error.message}`);
    return null;
  }
}

async function getRunDataset(runId) {
  try {
    const response = await axios.get(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs/${runId}/dataset/items?token=${APIFY_TOKEN}`
    );
    return response.data;
  } catch (error) {
    console.error(`  Error fetching dataset: ${error.message}`);
    return [];
  }
}

async function fetchReviewsForBusiness(placeId, businessName) {
  const runId = await startActorRun(placeId, businessName);
  if (!runId) return [];

  // Poll for completion (max 2 minutes)
  const maxAttempts = 24; // 24 * 5 seconds = 120 seconds
  let attempts = 0;

  while (attempts < maxAttempts) {
    await delay(5000); // Wait 5 seconds
    const runInfo = await checkRunStatus(runId);

    if (!runInfo) {
      console.error('  Failed to get run status');
      break;
    }

    console.log(`  Status: ${runInfo.status}`);

    if (runInfo.status === 'SUCCEEDED') {
      console.log('  Run completed successfully');
      const data = await getRunDataset(runId);

      // Extract reviews
      const allReviews = [];
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item.reviews && Array.isArray(item.reviews)) {
            allReviews.push(...item.reviews.map(review => ({
              ...review,
              placeId: placeId,
              businessName: businessName,
              fetchedAt: new Date().toISOString()
            })));
          }
        }
      }

      // Filter only 5-star reviews
      const fiveStarReviews = allReviews.filter(review => review.stars === 5);
      console.log(`  Found ${fiveStarReviews.length} five-star reviews`);
      return fiveStarReviews;
    }

    if (runInfo.status === 'FAILED' || runInfo.status === 'ABORTED') {
      console.error(`  Run failed with status: ${runInfo.status}`);
      break;
    }

    attempts++;
  }

  console.error('  Timeout waiting for run to complete');
  return [];
}

async function saveReviewsToDatabase(reviews) {
  if (reviews.length === 0) return 0;

  const reviewsToInsert = reviews.map(review => ({
    place_id: review.placeId,
    reviewer_name: review.name || 'Anonymous',
    review_text: review.text || null,
    stars: review.stars,
    published_at: review.publishAt || null,
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

  return reviewsToInsert.length;
}

async function main() {
  try {
    console.log('=== Google Reviews Fetcher (Apify Async) ===');
    console.log(`Testing with ${MAX_BUSINESSES} businesses\n`);

    // Get businesses from database
    const { data: businesses, error } = await supabase
      .from('plumbing_leads')
      .select('name, place_id, city, state')
      .not('place_id', 'is', null)
      .limit(MAX_BUSINESSES);

    if (error || !businesses || businesses.length === 0) {
      console.error('No businesses found');
      process.exit(1);
    }

    console.log(`Processing ${businesses.length} businesses\n`);

    const allResults = [];
    let totalReviews = 0;
    let totalSaved = 0;

    for (const business of businesses) {
      const reviews = await fetchReviewsForBusiness(business.place_id, business.name);

      if (reviews.length > 0) {
        allResults.push({
          business: business,
          reviews: reviews,
          count: reviews.length
        });

        totalReviews += reviews.length;

        const saved = await saveReviewsToDatabase(reviews);
        totalSaved += saved;
        console.log(`  Saved ${saved} reviews to database\n`);
      }

      await delay(2000); // Wait between businesses
    }

    // Save to file
    const outputFile = path.join(__dirname, '..', 'data', 'fetched_reviews_apify_async.json');
    fs.writeFileSync(outputFile, JSON.stringify(allResults, null, 2));

    console.log('\n=== Summary ===');
    console.log(`Businesses processed: ${businesses.length}`);
    console.log(`Total five-star reviews: ${totalReviews}`);
    console.log(`Reviews saved to database: ${totalSaved}`);
    console.log(`Output file: ${outputFile}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });