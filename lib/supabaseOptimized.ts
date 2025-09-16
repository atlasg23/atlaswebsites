import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Simplified business interface for list views
export interface PlumbingBusinessSummary {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string;
  rating: string;
  reviews: string;
  full_address: string;
  website?: string;
  email_1?: string;
  reviews_link?: string;
  facebook?: string;
  instagram?: string;
}

export async function getAllBusinessesSummary(limit: number = 100, offset: number = 0): Promise<{
  businesses: PlumbingBusinessSummary[];
  total: number;
}> {
  try {
    // Get total count
    const { count } = await supabase
      .from('plumbing_leads')
      .select('*', { count: 'exact', head: true });

    // Get paginated summary data (only essential fields)
    const { data, error } = await supabase
      .from('plumbing_leads')
      .select('id, name, slug, city, state, phone, rating, reviews, full_address, site, email_1, reviews_link, facebook, instagram')
      .order('rating', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching businesses:', error);
      return { businesses: [], total: 0 };
    }

    const businesses: PlumbingBusinessSummary[] = (data || []).map(item => ({
      id: item.id,
      name: item.name || '',
      slug: item.slug || '',
      city: item.city || '',
      state: item.state || '',
      phone: item.phone || '',
      rating: item.rating || '0',  // Already a string in DB
      reviews: item.reviews || '0',  // Already a string in DB
      full_address: item.full_address || '',
      website: item.site || '',
      email_1: item.email_1 || '',
      reviews_link: item.reviews_link || '',
      facebook: item.facebook || '',
      instagram: item.instagram || ''
    }));

    return { businesses, total: count || 0 };
  } catch (error) {
    console.error('Error in getAllBusinessesSummary:', error);
    return { businesses: [], total: 0 };
  }
}