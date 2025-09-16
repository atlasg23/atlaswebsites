const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 2;
      } else {
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current);
  return result;
}

async function importToBusinesses20() {
  try {
    console.log('Starting import to businesses_2_0 table...\n');

    // Read the mobile filtered plumbing CSV
    const csvPath = path.join(process.cwd(), 'data', 'mobile_filtered_plumbing_data.csv');

    if (!fs.existsSync(csvPath)) {
      console.error('mobile_filtered_plumbing_data.csv not found!');
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n');
    const headers = parseCSVLine(lines[0]);

    console.log(`Found ${lines.length - 1} records in CSV`);
    console.log('Processing data...\n');

    const businesses = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = parseCSVLine(lines[i]);
        const business = {};

        headers.forEach((header, index) => {
          business[header] = values[index] || '';
        });

        // Map CSV fields to database columns
        const record = {
          name: business.name || '',
          site: business.site || business.website || null,
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
          slug: business.slug || business.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          website: business.website || business.site || null,
          country: business.country || 'United States',
          plus_code: business.plus_code || null,
          niche: 'plumbers',
          status: 'imported'
        };

        // Make slug unique
        record.slug = record.slug.replace(/^-+|-+$/g, '').substring(0, 100);
        if (!record.slug) {
          record.slug = `business-${i}`;
        }
        record.slug = `${record.slug}-${i}`;

        businesses.push(record);
      }
    }

    console.log(`Prepared ${businesses.length} records for import`);

    // Clear any existing data first
    console.log('Clearing any existing data in businesses_2_0...');
    const { error: deleteError } = await supabase
      .from('businesses_2_0')
      .delete()
      .gte('id', 0);

    if (deleteError) {
      console.log('No existing data to clear or error:', deleteError.message);
    }

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < businesses.length; i += batchSize) {
      const batch = businesses.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('businesses_2_0')
        .insert(batch)
        .select();

      if (error) {
        console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        failed += batch.length;
      } else {
        inserted += data.length;
        console.log(`✓ Inserted ${inserted}/${businesses.length} records`);
      }
    }

    console.log('\n========================================');
    console.log(`✅ Import to businesses_2_0 complete!`);
    console.log(`   Successfully imported: ${inserted} records`);
    if (failed > 0) {
      console.log(`   Failed: ${failed} records`);
    }

    // Verify the import
    const { count } = await supabase
      .from('businesses_2_0')
      .select('*', { count: 'exact', head: true });

    console.log(`   Total records in businesses_2_0: ${count}`);

  } catch (error) {
    console.error('Import error:', error);
  }
}

// Run the import
importToBusinesses20();