const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testPlumbingLeads() {
  console.log('Testing plumbing_leads table...\n');

  // Get count
  const { count, error: countError } = await supabase
    .from('plumbing_leads')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ Error:', countError);
    return;
  }

  console.log(`✅ plumbing_leads table has ${count} records`);

  // Get sample data
  const { data, error } = await supabase
    .from('plumbing_leads')
    .select('*')
    .limit(3);

  if (!error && data) {
    console.log('\n📊 Sample records:');
    data.forEach((b, i) => {
      console.log(`\n${i + 1}. ${b.name}`);
      console.log(`   City: ${b.city}, ${b.state}`);
      console.log(`   Phone: ${b.phone}`);
      console.log(`   Slug: ${b.slug}`);
      console.log(`   Rating: ${b.rating || 'N/A'}`);
    });
  }

  // Test slug lookup
  if (data && data[0]) {
    const testSlug = data[0].slug;
    console.log(`\n🔍 Testing slug lookup for: ${testSlug}`);

    const { data: singleBiz, error: slugError } = await supabase
      .from('plumbing_leads')
      .select('*')
      .eq('slug', testSlug)
      .single();

    if (!slugError) {
      console.log(`✅ Found business: ${singleBiz.name}`);
    } else {
      console.log('❌ Slug lookup error:', slugError);
    }
  }

  console.log('\n✅ Database is ready to use!');
  console.log('The templates should now work with URLs like:');
  console.log('  /plumbing1/[slug]');
  console.log('  /plumbing2/[slug]');
}

testPlumbingLeads();