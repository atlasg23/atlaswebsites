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
const MAX_BUSINESSES = 5; // Test with 5 businesses
const MAX_REVIEWS_PER_BUSINESS = 10; // Maximum 10 reviews per business

async function fetchReviewsFromApify(placeId, businessName) {
  try {
    console.log(`\nFetching reviews for ${businessName} (${placeId})...`);

    const input = {
      queries: [placeId],
      maxReviews: MAX_REVIEWS_PER_BUSINESS,
      reviewsSort: 'newest',
      language: 'en',
      personalData: false
    };

    // Call Apify actor
    const response = await axios.post(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`,
      input,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          token: APIFY_TOKEN
        },
        timeout: 60000 // 60 seconds timeout
      }
    );

    if (response.data && Array.isArray(response.data)) {
      console.log(`  Received ${response.data.length} items from Apify`);

      // Extract reviews from the response
      const allReviews = [];
      for (const item of response.data) {
        if (item.reviews && Array.isArray(item.reviews)) {
          allReviews.push(...item.reviews.map(review => ({
            ...review,
            placeId: placeId,
            businessName: businessName,
            fetchedAt: new Date().toISOString()
          })));
        }
      }

      // Filter only 5-star reviews
      const fiveStarReviews = allReviews.filter(review => review.stars === 5);
      console.log(`  Found ${fiveStarReviews.length} five-star reviews out of ${allReviews.length} total`);

      return fiveStarReviews;
    }

    return [];
  } catch (error) {
    console.error(`  Error fetching reviews for ${businessName}:`, error.message);
    return [];
  }
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
    console.error('Error inserting reviews to database:', error);
    return 0;
  }

  return reviewsToInsert.length;
}

async function main() {
  try {
    console.log('=== Google Reviews Fetcher (Apify) ===');
    console.log(`Testing with ${MAX_BUSINESSES} businesses, max ${MAX_REVIEWS_PER_BUSINESS} reviews each\n`);

    // Get businesses with place_id from plumbing_leads
    const { data: businesses, error } = await supabase
      .from('plumbing_leads')
      .select('name, place_id, city, state')
      .not('place_id', 'is', null)
      .limit(MAX_BUSINESSES);

    if (error) {
      console.error('Error fetching businesses:', error);
      process.exit(1);
    }

    if (!businesses || businesses.length === 0) {
      console.log('No businesses found with place_id');
      process.exit(0);
    }

    console.log(`Found ${businesses.length} businesses to process`);

    // Collect all reviews
    const allFetchedReviews = [];
    let totalFiveStarReviews = 0;
    let totalInserted = 0;

    for (const business of businesses) {
      const reviews = await fetchReviewsFromApify(business.place_id, business.name);

      if (reviews.length > 0) {
        allFetchedReviews.push({
          business: {
            name: business.name,
            place_id: business.place_id,
            city: business.city,
            state: business.state
          },
          reviews: reviews,
          totalReviews: reviews.length,
          fiveStarCount: reviews.filter(r => r.stars === 5).length
        });

        totalFiveStarReviews += reviews.length;

        // Save to database
        const inserted = await saveReviewsToDatabase(reviews);
        totalInserted += inserted;
        console.log(`  Saved ${inserted} reviews to database`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save results to JSON file
    const outputFile = path.join(__dirname, '..', 'data', 'fetched_reviews_apify.json');
    fs.writeFileSync(outputFile, JSON.stringify(allFetchedReviews, null, 2));
    console.log(`\nResults saved to: ${outputFile}`);

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Businesses processed: ${businesses.length}`);
    console.log(`Total five-star reviews fetched: ${totalFiveStarReviews}`);
    console.log(`Reviews saved to database: ${totalInserted}`);
    console.log(`Results file: ${outputFile}`);

    // Test the view
    const { data: viewTest, error: viewError } = await supabase
      .from('five_star_reviews')
      .select('*')
      .limit(5);

    if (!viewError && viewTest) {
      console.log(`\nFive-star reviews view: ${viewTest.length} sample records`);
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });