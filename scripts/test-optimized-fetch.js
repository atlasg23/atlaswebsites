const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testOptimizedFetch() {
  console.log('Testing optimized data fetching...\n');

  // Test fetching only essential fields (like the optimized version)
  const { data: summaryData, error: summaryError } = await supabase
    .from('leeds_2_0')
    .select('id, name, slug, city, state, phone, rating, reviews')
    .limit(5)
    .order('rating', { ascending: false });

  let summarySize = 0;
  if (!summaryError) {
    console.log('✅ Optimized fetch (summary fields only):');
    summarySize = JSON.stringify(summaryData).length;
    console.log(`   Data size: ${(summarySize / 1024).toFixed(2)} KB for ${summaryData.length} records`);
  }

  // Compare with full data fetch
  const { data: fullData, error: fullError } = await supabase
    .from('leeds_2_0')
    .select('*')
    .limit(5);

  if (!fullError && summarySize > 0) {
    console.log('\n📊 Full fetch (all fields):');
    const fullSize = JSON.stringify(fullData).length;
    console.log(`   Data size: ${(fullSize / 1024).toFixed(2)} KB for ${fullData.length} records`);
    console.log(`   Savings: ${(100 - (summarySize / fullSize * 100)).toFixed(1)}% reduction`);
  }

  // Test the slug lookup fix
  console.log('\n🔍 Testing slug lookup:');
  const testSlug = 'prestigeplumbingrepairllc';

  // Try to find any slug that starts with this
  const { data: slugMatch } = await supabase
    .from('leeds_2_0')
    .select('slug, name')
    .like('slug', `${testSlug}%`)
    .limit(1)
    .single();

  if (slugMatch) {
    console.log(`   Found match for "${testSlug}"`);
    console.log(`   Actual slug: ${slugMatch.slug}`);
    console.log(`   Business: ${slugMatch.name}`);
  } else {
    console.log(`   No match found for "${testSlug}"`);
  }
}

testOptimizedFetch();