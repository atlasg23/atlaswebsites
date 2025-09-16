import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  try {
    // Query the information schema to get all tables
    const { data: tables, error } = await supabase.rpc('get_tables_list');

    if (error) {
      // Try a different approach - query a known system table
      console.log('Trying alternative method to list tables...\n');

      // Check if 'leads' table exists (based on the error hint)
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .limit(5);

      if (!leadsError) {
        console.log('✅ Found table: leads');
        console.log(`Sample data from 'leads' table:`);
        console.log(JSON.stringify(leadsData, null, 2));

        // Get count
        const { count } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true });
        console.log(`\nTotal records in 'leads' table: ${count}`);
      } else {
        console.log('❌ Table "leads" not accessible:', leadsError.message);
      }

      // Try to check for other common tables
      const tablesToCheck = ['users', 'profiles', 'businesses', 'plumbing_businesses', 'leeds_2_0'];

      for (const tableName of tablesToCheck) {
        const { error: tableError, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!tableError) {
          console.log(`✅ Found table: ${tableName} (${count} records)`);
        }
      }
    } else {
      console.log('Tables in database:', tables);
    }

    // Get the schema of the leads table if it exists
    const { data: leadsColumns, error: schemaError } = await supabase
      .from('leads')
      .select('*')
      .limit(0);

    if (!schemaError) {
      console.log('\n📋 Structure of "leads" table:');
      const { data: sampleRow } = await supabase
        .from('leads')
        .select('*')
        .limit(1)
        .single();

      if (sampleRow) {
        console.log('Columns:', Object.keys(sampleRow));
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkTables();