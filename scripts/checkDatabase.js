const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseTables() {
  try {
    // Query to get all tables in the public schema
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    if (error) {
      // Alternative approach - try to query pg_tables
      const { data: pgTables, error: pgError } = await supabase.rpc('get_tables', {});

      if (pgError) {
        // Let's try a direct query approach
        console.log('Attempting alternative method to list tables...');

        // Try to list common table names by attempting to query them
        const commonTables = ['users', 'profiles', 'businesses', 'plumbing_businesses', 'reviews'];

        for (const tableName of commonTables) {
          try {
            const { count, error: tableError } = await supabase
              .from(tableName)
              .select('*', { count: 'exact', head: true });

            if (!tableError) {
              console.log(`✓ Table found: ${tableName} (${count} rows)`);
            }
          } catch (e) {
            // Table doesn't exist
          }
        }

        // Also try to get schema information
        console.log('\nTrying to fetch table information via REST API...');
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          }
        });

        if (response.ok) {
          const data = await response.text();
          console.log('API Response:', data);
        }
      } else {
        console.log('Tables found via RPC:', pgTables);
      }
    } else {
      console.log('Tables in database:');
      tables.forEach(table => {
        console.log(`- ${table.table_name}`);
      });
    }

    // Try to get more detailed information about the database
    console.log('\n=== Database Connection Test ===');
    const { data: test, error: testError } = await supabase.rpc('version', {});
    if (!testError) {
      console.log('PostgreSQL version:', test);
    }

  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

checkDatabaseTables();