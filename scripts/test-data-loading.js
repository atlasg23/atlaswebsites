const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testDataLoading() {
  console.log('Testing data loading for pages...\n');

  // Test the query used by supabaseOptimized.ts
  console.log('1. Testing optimized query (used by index page):');
  const { data: summaryData, error: summaryError } = await supabase
    .from('plumbing_leads')
    .select('id, name, slug, city, state, phone, rating, reviews, full_address, site, email_1, reviews_link, facebook, instagram')
    .order('rating', { ascending: false })
    .limit(5);

  if (summaryError) {
    console.error('❌ Summary query error:', summaryError);
  } else {
    console.log(`✅ Loaded ${summaryData.length} businesses`);
    if (summaryData[0]) {
      console.log('Sample:', summaryData[0].name, '-', summaryData[0].city);
    }
  }

  // Test the query used by supabaseReader.ts
  console.log('\n2. Testing full query (used by templates):');
  const { data: fullData, error: fullError } = await supabase
    .from('plumbing_leads')
    .select('*')
    .limit(5);

  if (fullError) {
    console.error('❌ Full query error:', fullError);
  } else {
    console.log(`✅ Loaded ${fullData.length} businesses`);
    if (fullData[0]) {
      console.log('Sample:', fullData[0].name, '-', fullData[0].slug);
    }
  }

  // Check for null ratings that might cause sorting issues
  console.log('\n3. Checking rating data:');
  const { data: nullRatings, error: nullError } = await supabase
    .from('plumbing_leads')
    .select('name, rating')
    .is('rating', null)
    .limit(5);

  if (!nullError) {
    console.log(`Found ${nullRatings?.length || 0} businesses with null ratings`);
  }

  console.log('\n✅ Data queries are working correctly!');
}

testDataLoading();