const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Use pooler connection string for Replit compatibility
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations(dryRun = false) {
  const client = await pool.connect();

  try {
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Get list of migration files
    const migrationDir = path.join(__dirname);
    const files = fs.readdirSync(migrationDir)
      .filter(f => f.endsWith('.sql') && f[0] !== '_')
      .sort();

    // Get applied migrations
    const { rows: applied } = await client.query(
      'SELECT filename FROM _migrations'
    );
    const appliedSet = new Set(applied.map(r => r.filename));

    console.log(`Found ${files.length} migration files`);
    console.log(`Already applied: ${appliedSet.size} migrations`);

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`✓ Already applied: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');

      if (dryRun) {
        console.log(`\n[DRY RUN] Would apply: ${file}`);
        console.log('SQL:', sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));
      } else {
        console.log(`\nApplying migration: ${file}`);

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query(
            'INSERT INTO _migrations (filename) VALUES ($1)',
            [file]
          );
          await client.query('COMMIT');
          console.log(`✅ Successfully applied: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        }
      }
    }

    if (!dryRun) {
      console.log('\n✅ All migrations completed successfully');
    } else {
      console.log('\n[DRY RUN] No changes made');
    }

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Check if dry run
const isDryRun = process.argv.includes('--dry-run');
runMigrations(isDryRun);