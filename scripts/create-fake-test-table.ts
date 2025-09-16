import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFakeTestTable() {
  try {
    console.log('Creating fake_test table...');

    // First, try to create the table using raw SQL
    const { data, error } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS fake_test (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255),
          test_value INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
    });

    if (error) {
      console.log('RPC method not available, trying direct insert to create table...');

      // Try to insert a test record (this will fail if table doesn't exist)
      const { error: insertError } = await supabase
        .from('fake_test')
        .insert([
          { name: 'Test Item 1', test_value: 100 },
          { name: 'Test Item 2', test_value: 200 }
        ]);

      if (insertError) {
        console.error('Table creation failed. You need to create it manually in Supabase.');
        console.log('\n📋 Please run this SQL in your Supabase SQL Editor:');
        console.log('https://supabase.com/dashboard/project/oyjezdyioyzijbnecvnh/sql\n');
        console.log(`
CREATE TABLE IF NOT EXISTS fake_test (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  test_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert some test data
INSERT INTO fake_test (name, test_value) VALUES
  ('Test Item 1', 100),
  ('Test Item 2', 200),
  ('Test Item 3', 300);
        `);
        return;
      }
    }

    // Check if table exists and has data
    const { data: testData, error: selectError } = await supabase
      .from('fake_test')
      .select('*');

    if (!selectError) {
      console.log('✅ Table fake_test exists!');
      console.log('Current data:', testData);

      // Add more test data
      const { error: moreDataError } = await supabase
        .from('fake_test')
        .insert([
          { name: 'New Test Item', test_value: Math.floor(Math.random() * 1000) }
        ]);

      if (!moreDataError) {
        console.log('✅ Successfully added new test data');
      }
    } else {
      console.error('Error accessing table:', selectError);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

createFakeTestTable();