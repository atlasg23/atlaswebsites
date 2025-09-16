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

async function importPlumbingLeads() {
  try {
    console.log('📊 Starting import to plumbing_leads table...\n');

    // Read the CSV file
    const csvPath = path.join(process.cwd(), 'data', 'mobile_filtered_plumbing_data.csv');
    console.log(`Reading: ${csvPath}`);

    if (!fs.existsSync(csvPath)) {
      console.error('❌ File not found:', csvPath);
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvData.split('\n').filter(line => line.trim());
    const headers = parseCSVLine(lines[0]);

    console.log(`Found ${headers.length} columns:`);
    console.log(headers.join(', '));
    console.log(`\nProcessing ${lines.length - 1} data rows...\n`);

    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      // Create record with exact column mapping
      const record = {
        name: values[0] || null,
        site: values[1] || null,
        subtypes: values[2] || null,
        category: values[3] || null,
        type: values[4] || null,
        phone: values[5] || null,
        phone_phones_enricher_carrier_name: values[6] || null,
        phone_phones_enricher_carrier_type: values[7] || null,
        latitude: values[8] ? parseFloat(values[8]) : null,
        longitude: values[9] ? parseFloat(values[9]) : null,
        full_address: values[10] || null,
        city: values[11] || null,
        state: values[12] || null,
        area_service: values[13] || null,
        rating: values[14] || null,
        reviews: values[15] || null,
        reviews_link: values[16] || null,
        photos_count: values[17] || null,
        working_hours: values[18] || null,
        verified: values[19] || null,
        location_link: values[20] || null,
        place_id: values[21] || null,
        email_1: values[22] || null,
        email_1_emails_validator_status: values[23] || null,
        facebook: values[24] || null,
        instagram: values[25] || null,
        logo: values[26] || null,
        primary_color: values[27] || null,
        secondary_color: values[28] || null,
        slug: values[29] || null
      };

      // Make sure slug is unique
      if (record.slug) {
        record.slug = `${record.slug}-${i}`;
      } else {
        record.slug = `business-${i}`;
      }

      records.push(record);
    }

    console.log(`Prepared ${records.length} records for import`);

    // Clear existing data
    console.log('Clearing existing data...');
    await supabase.from('plumbing_leads').delete().gte('id', 0);

    // Insert in batches
    const batchSize = 50;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('plumbing_leads')
        .insert(batch)
        .select();

      if (error) {
        console.error(`❌ Error in batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      } else {
        inserted += data.length;
        console.log(`✓ Inserted ${inserted}/${records.length} records`);
      }
    }

    // Verify
    const { count } = await supabase
      .from('plumbing_leads')
      .select('*', { count: 'exact', head: true });

    console.log('\n========================================');
    console.log('✅ Import complete!');
    console.log(`   Total records in plumbing_leads: ${count}`);
    console.log('========================================');

  } catch (error) {
    console.error('❌ Import error:', error);
  }
}

importPlumbingLeads();