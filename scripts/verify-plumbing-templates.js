const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyTable() {
  console.log('Checking plumbing_templates table...\n');

  // Try to query the table
  const { data, error, count } = await supabase
    .from('plumbing_templates')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log('✅ Table exists!');
  console.log(`   Records: ${count || 0}`);

  if (data && data.length > 0) {
    console.log('\nSample data:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('\n   Table is empty (ready for customizations)');
  }

  // Test insert
  console.log('\n📝 Testing write access...');
  const testData = {
    business_slug: 'test-business',
    template_name: 'plumbing1',
    custom_images: { hero: 'https://example.com/test.jpg' }
  };

  const { error: insertError } = await supabase
    .from('plumbing_templates')
    .upsert(testData, { onConflict: 'business_slug' });

  if (insertError) {
    console.error('❌ Write test failed:', insertError);
  } else {
    console.log('✅ Write access confirmed!');

    // Clean up test
    await supabase
      .from('plumbing_templates')
      .delete()
      .eq('business_slug', 'test-business');
  }
}

verifyTable();