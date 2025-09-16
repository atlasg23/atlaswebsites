const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkReviews() {
  // Get total count
  const { count } = await supabase
    .from('google_reviews')
    .select('*', { count: 'exact', head: true });

  console.log(`Total reviews in database: ${count}`);

  // Get sample of 5-star reviews with business info
  const { data: reviews } = await supabase
    .from('five_star_reviews')
    .select('reviewer_name, review_text, business_name, city, published_at')
    .limit(5);

  console.log('\nSample 5-star reviews:');
  console.log('======================');
  reviews?.forEach(r => {
    console.log(`\n${r.reviewer_name} - ${r.business_name} (${r.city})`);
    console.log(`Published: ${r.published_at}`);
    if (r.review_text) {
      console.log(`Review: ${r.review_text.substring(0, 100)}...`);
    }
  });

  // Get count by business
  const { data: businesses } = await supabase
    .from('google_reviews')
    .select('place_id')
    .eq('stars', 5);

  const counts = {};
  businesses?.forEach(b => {
    counts[b.place_id] = (counts[b.place_id] || 0) + 1;
  });

  console.log('\n5-star review count by place_id:');
  Object.entries(counts).forEach(([place_id, count]) => {
    console.log(`  ${place_id}: ${count} reviews`);
  });
}

checkReviews().catch(console.error);
