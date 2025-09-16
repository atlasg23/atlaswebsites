const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: false
  }
});

async function runMigration() {
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'db', '009_plumbing_templates.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running migration: 009_plumbing_templates.sql');

    // Execute the SQL using Supabase's raw SQL execution
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql
    }).single();

    if (error) {
      // Try alternative approach - direct execution
      console.log('Trying alternative approach...');

      // Split SQL into individual statements
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          // For now, we'll just log what we would execute
          // In production, you'd use a proper PostgreSQL client
        }
      }

      console.log('\n⚠️  Migration SQL ready but needs to be run directly in Supabase dashboard:');
      console.log('1. Go to Supabase Dashboard > SQL Editor');
      console.log('2. Paste and run the following SQL:\n');
      console.log(sql);
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
}

runMigration();