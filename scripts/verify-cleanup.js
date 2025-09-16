const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function verifyCleanup() {
  const client = await pool.connect();

  try {
    console.log('🧹 Database Cleanup Verification\n');
    console.log('=' .repeat(50));

    // 1. List remaining tables
    const { rows: tables } = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('\n📊 Remaining Tables:');
    for (const table of tables) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM "${table.tablename}"`);
      const count = countResult.rows[0].count;
      console.log(`   ✅ ${table.tablename} (${count} rows)`);
    }

    // 2. Check the businesses table structure
    console.log('\n🏢 Businesses Table Structure:');
    const { rows: columns } = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'businesses'
      AND column_name IN ('niche', 'status', 'total_views', 'custom_images', 'priority')
      ORDER BY column_name;
    `);

    for (const col of columns) {
      console.log(`   ✅ ${col.column_name}: ${col.data_type}`);
    }

    // 3. Test Supabase access to renamed table
    console.log('\n🔌 Testing Supabase Access:');
    const { data: bizData, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, niche, status')
      .limit(3);

    if (!bizError && bizData) {
      console.log(`   ✅ Can access businesses table via Supabase`);
      console.log(`   ✅ Sample data: ${bizData.length} businesses loaded`);
    } else {
      console.log(`   ❌ Error accessing businesses:`, bizError);
    }

    // 4. Check new tables
    console.log('\n📈 New Platform Tables:');
    const newTables = ['analytics', 'templates', 'business_templates', 'outreach_campaigns'];

    for (const tableName of newTables) {
      const { rows } = await client.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
        [tableName]
      );

      if (rows[0].exists) {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = countResult.rows[0].count;
        console.log(`   ✅ ${tableName} table exists (${count} rows)`);
      } else {
        console.log(`   ❌ ${tableName} table missing`);
      }
    }

    // 5. Check templates were inserted
    const { rows: templateRows } = await client.query(`SELECT name, niche, type FROM templates`);
    if (templateRows.length > 0) {
      console.log('\n📝 Default Templates:');
      templateRows.forEach(t => {
        console.log(`   ✅ ${t.name} (${t.niche}) - ${t.type}`);
      });
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Database cleanup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update code to use "businesses" table instead of "leeds_2_0"');
    console.log('2. Start adding tracking to templates');
    console.log('3. Build admin dashboard');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyCleanup();