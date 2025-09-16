const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getPlaceIds() {
  const { data, error } = await supabase
    .from('plumbing_leads')
    .select('name, place_id, city, state')
    .not('place_id', 'is', null)
    .order('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  let markdown = '# Place IDs from Plumbing Leads Table\n\n';
  markdown += `Total businesses with place_id: ${data.length}\n\n`;
  markdown += '| Business Name | Place ID | City | State |\n';
  markdown += '|---------------|----------|------|-------|\n';

  data.forEach(business => {
    markdown += `| ${business.name} | ${business.place_id} | ${business.city || 'N/A'} | ${business.state || 'N/A'} |\n`;
  });

  markdown += '\n## Place IDs Only (for easy copying)\n\n```\n';
  data.forEach(business => {
    markdown += `${business.place_id}\n`;
  });
  markdown += '```\n';

  fs.writeFileSync('place-ids.md', markdown);
  console.log(`Saved ${data.length} place IDs to place-ids.md`);
}

getPlaceIds().catch(console.error);