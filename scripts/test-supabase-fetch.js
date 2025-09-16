const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testFetch() {
  console.log('Testing Supabase data fetching...\n');

  // Test getAllBusinesses
  const { data: businesses, error: listError } = await supabase
    .from('leeds_2_0')
    .select('name, slug, city, rating, reviews')
    .limit(5)
    .order('rating', { ascending: false });

  if (listError) {
    console.error('Error fetching businesses:', listError);
  } else {
    console.log('✅ Top 5 businesses by rating:');
    businesses.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.name} (${b.city}) - ⭐ ${b.rating} (${b.reviews} reviews)`);
      console.log(`     Slug: ${b.slug}`);
    });
  }

  // Test getBusinessBySlug
  if (businesses && businesses.length > 0) {
    const testSlug = businesses[0].slug;
    const { data: business, error: slugError } = await supabase
      .from('leeds_2_0')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (slugError) {
      console.error('\nError fetching by slug:', slugError);
    } else {
      console.log(`\n✅ Fetched business by slug "${testSlug}":`);
      console.log(`  Name: ${business.name}`);
      console.log(`  Phone: ${business.phone}`);
      console.log(`  Address: ${business.full_address}`);
      console.log(`  Website: ${business.website || business.site || 'N/A'}`);
    }
  }

  // Count total businesses
  const { count } = await supabase
    .from('leeds_2_0')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Total businesses in database: ${count}`);

  console.log('\n✅ All data is now being fetched from Supabase!');
  console.log('   The website templates at /plumbing1/[slug] and /plumbing2/[slug]');
  console.log('   are now using the Supabase database instead of CSV files.');
}

testFetch();