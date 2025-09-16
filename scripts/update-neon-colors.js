const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function updateNeonGreenColors() {
  const businessSlug = 'nathandebuskplumbingllc-3';

  // Neon green color scheme
  const neonGreenColors = {
    primary_color: '#39FF14',  // Neon green
    secondary_color: '#32E60D', // Slightly darker neon green
    hero_buttonColor: '#39FF14',
    hero_buttonTextColor: '#000000', // Black text for contrast
    services_buttonColor: '#39FF14',
    services_buttonTextColor: '#000000',
    cta_buttonColor: '#39FF14',
    cta_buttonTextColor: '#000000',
    contact_buttonColor: '#39FF14',
    contact_buttonTextColor: '#000000'
  };

  try {
    // First check if the record exists
    const { data: existing } = await supabase
      .from('plumbing_templates')
      .select('business_slug')
      .eq('business_slug', businessSlug)
      .single();

    if (existing) {
      // Update existing record
      const { data, error } = await supabase
        .from('plumbing_templates')
        .update({
          custom_colors: neonGreenColors,
          template_name: 'plumbing4'
        })
        .eq('business_slug', businessSlug);

      if (error) throw error;
      console.log('✅ Updated colors to neon green for', businessSlug);
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('plumbing_templates')
        .insert({
          business_slug: businessSlug,
          template_name: 'plumbing4',
          custom_colors: neonGreenColors
        });

      if (error) throw error;
      console.log('✅ Created new customization with neon green colors for', businessSlug);
    }
  } catch (error) {
    console.error('Error updating colors:', error);
  }
}

updateNeonGreenColors();