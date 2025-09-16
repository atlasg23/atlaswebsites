const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function listTables() {
  const client = await pool.connect();

  try {
    console.log('Fetching all tables in database...\n');

    // Get all tables from public schema
    const { rows } = await client.query(`
      SELECT
        tablename,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = tablename) as columns
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('📊 Current Tables in Database:');
    console.log('================================\n');

    for (const table of rows) {
      // Get row count for each table (handle special table names)
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table.tablename}"`);
      const count = countResult.rows[0].count;

      console.log(`📁 ${table.tablename}`);
      console.log(`   Columns: ${table.columns}`);
      console.log(`   Rows: ${count}`);
      console.log('');
    }

    // List which tables we're keeping vs deleting
    console.log('\n✅ Tables to KEEP:');
    console.log('- leeds_2_0 (will rename to businesses)');
    console.log('- _migrations (needed for migration system)');

    console.log('\n❌ Tables to DELETE:');
    console.log('- test_table (test data)');
    console.log('- fake_test (test data)');
    console.log('- leads (old HVAC data)');
    console.log('- Any other test/temporary tables');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

listTables();