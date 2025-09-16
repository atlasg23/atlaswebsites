const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPlumbingData() {
  console.log('Checking businesses table for plumbing data...\n');

  // Get count
  const { count, error: countError } = await supabase
    .from('businesses')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error accessing businesses table:', countError);
    return;
  }

  console.log(`✅ Businesses table has ${count} records`);

  // Get sample data
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, city, phone, slug')
    .limit(5);

  if (!error && data) {
    console.log('\nSample plumbing businesses:');
    data.forEach(b => {
      console.log(`  - ${b.name} (${b.city}) - ${b.phone}`);
    });
  }

  // Check for new columns
  const { data: sampleRow } = await supabase
    .from('businesses')
    .select('niche, status, total_views')
    .limit(1)
    .single();

  if (sampleRow) {
    console.log('\n✅ New platform columns exist:');
    console.log(`  - niche: ${sampleRow.niche || 'exists'}`);
    console.log(`  - status: ${sampleRow.status || 'exists'}`);
    console.log(`  - total_views: ${sampleRow.total_views !== undefined ? 'exists' : 'missing'}`);
  }
}

checkPlumbingData();