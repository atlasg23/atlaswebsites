const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function verifyTables() {
  console.log('Verifying created tables...\n');

  // Check fake_test table
  const { data: fakeTest, error: fakeTestError } = await supabase
    .from('fake_test')
    .select('*')
    .limit(3);

  if (fakeTestError) {
    console.log('❌ fake_test table:', fakeTestError.message);
  } else {
    console.log('✅ fake_test table exists with', fakeTest.length, 'records');
    console.log('Sample data:', fakeTest);
  }

  // Check leeds_2_0 table
  const { count: leedsCount, error: leedsError } = await supabase
    .from('leeds_2_0')
    .select('*', { count: 'exact', head: true });

  if (leedsError) {
    console.log('❌ leeds_2_0 table:', leedsError.message);
  } else {
    console.log('\n✅ leeds_2_0 table exists (ready for data import)');
    console.log('Current records:', leedsCount || 0);
  }

  // Check test_table
  const { data: testTable, error: testError } = await supabase
    .from('test_table')
    .select('*')
    .limit(3);

  if (testError) {
    console.log('❌ test_table:', testError.message);
  } else {
    console.log('\n✅ test_table exists with', testTable.length, 'records');
    console.log('Sample data:', testTable);
  }
}

verifyTables();