# Database Migration System - WORKING SETUP ✅

**Status: COMPLETED** - The migration system is now fully functional and tested.

## How to Edit Database (For Next Agent)

The database migration system is **already set up and working**. To edit the Supabase database schema:

1. **Create new migration file** in `scripts/db/` with format: `00X_description.sql`
2. **Run migration**: `npm run db:migrate`
3. **Test first**: `npm run db:check` (dry run)

### Example: Adding a new table
```bash
# Create scripts/db/004_add_new_table.sql
echo "CREATE TABLE IF NOT EXISTS new_table (id SERIAL PRIMARY KEY, name TEXT);" > scripts/db/004_add_new_table.sql

# Test migration (dry run)
npm run db:check

# Apply migration
npm run db:migrate
```

## Working Environment Variables

The `.env.local` file contains the correct configuration:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public API key for client
- `SUPABASE_SERVICE_ROLE_KEY` - Admin key for server operations
- `SUPABASE_DB_URL` - **CRITICAL**: Uses pooler connection string for Replit compatibility

## Key Success Factors

1. **Use PostgreSQL Pool, not Client** - Required for Replit environment
2. **Use pooler connection string** - Format: `postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
3. **Migrations are tracked** - `_migrations` table tracks applied migrations automatically

## Created Tables

✅ **Successfully created via migrations:**
- `fake_test` - Test table with 3 sample records
- `leeds_2_0` - Plumbing business data table (empty, ready for import)
- `test_table` - Simple test table with RLS
- `_migrations` - Tracks applied migrations (auto-created)

## Existing Tables (from previous work)
- `leads` - HVAC/electrician business data (existing)

## Database Connection Test

To verify database access:
```bash
node scripts/verify-tables.js
```

Or quick test:
```bash
node -e "const {createClient} = require('@supabase/supabase-js'); require('dotenv').config({path:'.env.local'}); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY); supabase.from('fake_test').select('name').then(({data}) => console.log('✅ Connected:', data));"
```

## Next Steps for Plumbing Data

1. **Import CSV data to leeds_2_0**:
```bash
# Create migration file
echo "-- Import plumbing data from CSV" > scripts/db/004_import_plumbing_data.sql
# Add INSERT statements or use a separate import script
```

2. **Update data loader** - Modify `lib/csvReader.ts` to read from Supabase:
```typescript
// Use supabase client instead of CSV
const { data } = await supabase.from('leeds_2_0').select('*')
```

## Migration System Files

- `scripts/db/run-sql.js` - Migration runner (uses Pool + pooler connection)
- `scripts/db/001_create_test_table.sql` - Test table migration
- `scripts/db/002_create_leeds_table.sql` - Leeds 2.0 business table
- `scripts/db/003_create_fake_test.sql` - Fake test table as requested
- `package.json` - Contains `db:migrate` and `db:check` scripts

## Available Commands

```bash
# Check what migrations would run (dry run)
npm run db:check

# Apply all pending migrations
npm run db:migrate

# Verify tables exist
node scripts/verify-tables.js
```

**⚠️ IMPORTANT**: The system works because it uses the **pooler connection string**. Direct database connections (`db.PROJECT.supabase.co`) don't work in Replit - must use pooler (`aws-1-us-east-2.pooler.supabase.com`).