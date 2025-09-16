const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTable() {
  console.log('Creating plumbing_templates table...\n');

  // First, let's check if the table exists
  const { data: existingTable, error: checkError } = await supabase
    .from('plumbing_templates')
    .select('*')
    .limit(1);

  if (!checkError) {
    console.log('✅ Table plumbing_templates already exists!');
    return;
  }

  console.log('Table does not exist, attempting to create...');

  // Since Supabase JS client doesn't support DDL directly,
  // we need to use the SQL editor in Supabase Dashboard

  console.log('\n⚠️  IMPORTANT: You need to create the table manually in Supabase!\n');
  console.log('Steps:');
  console.log('1. Go to your Supabase Dashboard');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Click "New Query"');
  console.log('4. Copy and paste this SQL:\n');

  const sql = `-- Create plumbing_templates table for storing customizations
CREATE TABLE IF NOT EXISTS plumbing_templates (
  id SERIAL PRIMARY KEY,
  business_slug TEXT UNIQUE,
  template_name TEXT DEFAULT 'plumbing1',

  -- Customizations stored as JSON
  custom_images JSONB DEFAULT '{}',
  custom_text JSONB DEFAULT '{}',
  custom_colors JSONB DEFAULT '{}',

  -- Publishing status
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_plumbing_templates_slug ON plumbing_templates(business_slug);

-- Grant permissions
GRANT ALL ON plumbing_templates TO authenticated;
GRANT ALL ON plumbing_templates TO anon;`;

  console.log(sql);
  console.log('\n5. Click "Run" to execute the SQL');
  console.log('6. You should see "Success. No rows returned"');
  console.log('\nOnce done, the table will be ready to use!');
}

createTable();