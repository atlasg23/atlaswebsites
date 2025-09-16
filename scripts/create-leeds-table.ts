import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SQL to create the leeds_2_0 table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS leeds_2_0 (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  site TEXT,
  subtypes TEXT,
  category TEXT,
  type TEXT,
  phone TEXT,
  phone_carrier_name TEXT,
  phone_carrier_type TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  full_address TEXT,
  city TEXT,
  state TEXT,
  area_service TEXT,
  rating DECIMAL(2, 1),
  reviews INTEGER,
  reviews_link TEXT,
  photos_count INTEGER,
  working_hours TEXT,
  verified BOOLEAN,
  location_link TEXT,
  place_id TEXT,
  email_1 TEXT,
  email_1_status TEXT,
  facebook TEXT,
  instagram TEXT,
  logo TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  slug TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_slug ON leeds_2_0(slug);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_city ON leeds_2_0(city);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_state ON leeds_2_0(state);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_rating ON leeds_2_0(rating DESC);
CREATE INDEX IF NOT EXISTS idx_leeds_2_0_reviews ON leeds_2_0(reviews DESC);
`;

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last field
  result.push(current);
  return result;
}

async function createTable() {
  console.log('Creating leeds_2_0 table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql_query: createTableSQL
  }).single();

  if (error) {
    // If RPC doesn't exist, try direct query (for newer Supabase versions)
    const { error: directError } = await supabase.from('leeds_2_0').select('id').limit(1);

    if (directError && directError.code === '42P01') {
      console.log('Table does not exist, creating via SQL editor is required.');
      console.log('Please run the following SQL in your Supabase dashboard:\n');
      console.log(createTableSQL);
      return false;
    }
  }

  console.log('Table created or already exists.');
  return true;
}

async function importCSVData() {
  console.log('Reading CSV file...');

  const csvPath = path.join(process.cwd(), 'data', 'mobile_filtered_plumbing_data.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');

  const lines = csvData.split('\n');
  const headers = parseCSVLine(lines[0]);

  console.log(`Found ${lines.length - 1} records to import...`);

  const businesses = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = parseCSVLine(lines[i]);
      const business: any = {};

      headers.forEach((header, index) => {
        business[header] = values[index] || '';
      });

      // Transform the data to match our table schema
      const record = {
        name: business.name,
        site: business.site || null,
        subtypes: business.subtypes || null,
        category: business.category || null,
        type: business.type || null,
        phone: business.phone || null,
        phone_carrier_name: business['phone.phones_enricher.carrier_name'] || null,
        phone_carrier_type: business['phone.phones_enricher.carrier_type'] || null,
        latitude: business.latitude ? parseFloat(business.latitude) : null,
        longitude: business.longitude ? parseFloat(business.longitude) : null,
        full_address: business.full_address || null,
        city: business.city || null,
        state: business.state || null,
        area_service: business.area_service || null,
        rating: business.rating ? parseFloat(business.rating) : null,
        reviews: business.reviews ? parseInt(business.reviews) : 0,
        reviews_link: business.reviews_link || null,
        photos_count: business.photos_count ? parseInt(business.photos_count) : 0,
        working_hours: business.working_hours || null,
        verified: business.verified === 'True' || business.verified === 'true',
        location_link: business.location_link || null,
        place_id: business.place_id || null,
        email_1: business.email_1 || null,
        email_1_status: business['email_1.emails_validator.status'] || null,
        facebook: business.facebook || null,
        instagram: business.instagram || null,
        logo: business.logo || null,
        primary_color: business.primary_color || '#0066CC',
        secondary_color: business.secondary_color || '#004C99',
        slug: business.slug || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      };

      businesses.push(record);
    }
  }

  console.log(`Inserting ${businesses.length} records into Supabase...`);

  // Insert in batches of 100 to avoid timeouts
  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < businesses.length; i += batchSize) {
    const batch = businesses.slice(i, i + batchSize);

    const { error } = await supabase
      .from('leeds_2_0')
      .upsert(batch, { onConflict: 'slug' });

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
      continue;
    }

    inserted += batch.length;
    console.log(`Inserted ${inserted}/${businesses.length} records...`);
  }

  console.log('Import complete!');
}

async function main() {
  try {
    // First, let's check if we can connect to Supabase
    const { data, error } = await supabase.from('leeds_2_0').select('count').limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist
      console.log('Table leeds_2_0 does not exist.');
      console.log('\nPlease create the table by running this SQL in your Supabase SQL Editor:');
      console.log('https://supabase.com/dashboard/project/oyjezdyioyzijbnecvnh/sql\n');
      console.log(createTableSQL);
      console.log('\nAfter creating the table, run this script again to import the data.');
      return;
    }

    // Table exists, let's import the data
    await importCSVData();

  } catch (error) {
    console.error('Error:', error);
  }
}

main();