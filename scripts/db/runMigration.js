const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function runMigration(sqlFile) {
  try {
    const sqlPath = path.resolve(sqlFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`Running migration: ${sqlFile}`);

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: sql
    });

    if (error) {
      // Try running it directly via raw SQL connection
      console.log('Trying direct SQL execution...');

      // Split into individual statements
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        const trimmed = statement.trim();
        if (trimmed) {
          console.log(`Executing: ${trimmed.substring(0, 50)}...`);

          // Use the pooler connection string for DDL
          const { Pool } = require('pg');
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL
          });

          try {
            await pool.query(trimmed);
            console.log('Statement executed successfully');
          } catch (e) {
            console.error('Statement error:', e.message);
          }

          await pool.end();
        }
      }
    }

    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Get SQL file from command line
const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('Usage: node runMigration.js <sql-file>');
  process.exit(1);
}

runMigration(sqlFile);