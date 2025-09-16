import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface GoogleReview {
  id?: number;
  place_id: string;
  reviewer_name: string;
  review_text: string | null;
  stars: number;
  published_at: string | null;
  published_at_date: string | null;
  review_id: string;
  reviewer_url: string | null;
  review_url: string | null;
  likes_count: number;
  reviewer_photo_url: string | null;
  is_local_guide: boolean;
}

export interface PlumbingBusiness {
  id?: number;
  name: string;
  site: string;
  subtypes: string;
  category: string;
  type: string;
  phone: string;
  phone_phones_enricher_carrier_name: string;
  phone_phones_enricher_carrier_type: string;
  latitude: string;
  longitude: string;
  full_address: string;
  city: string;
  state: string;
  area_service: string;
  rating: string;
  reviews: string;
  reviews_link: string;
  photos_count: string;
  working_hours: string;
  verified: string;
  location_link: string;
  place_id: string;
  email_1: string;
  email_1_emails_validator_status: string;
  facebook: string;
  instagram: string;
  logo: string;
  primary_color: string;
  secondary_color: string;
  slug: string;
}

export async function getBusinessBySlug(slug: string): Promise<PlumbingBusiness | null> {
  try {
    // First try exact match
    let { data, error } = await supabase
      .from('plumbing_leads')
      .select('*')
      .eq('slug', slug)
      .single();

    // If not found, try with LIKE pattern to find slug that starts with the input
    if (error && error.code === 'PGRST116') {
      const { data: likeData, error: likeError } = await supabase
        .from('plumbing_leads')
        .select('*')
        .like('slug', `${slug}-%`)
        .limit(1)
        .single();

      data = likeData;
      error = likeError;
    }

    if (error) {
      console.error('Error fetching business:', error);
      return null;
    }

    // Map database fields to interface
    const business: PlumbingBusiness = {
      id: data.id,
      name: data.name || '',
      site: data.site || data.website || '',
      subtypes: data.subtypes || '',
      category: data.category || '',
      type: data.type || '',
      phone: data.phone || '',
      phone_phones_enricher_carrier_name: data.phone_phones_enricher_carrier_name || '',
      phone_phones_enricher_carrier_type: data.phone_phones_enricher_carrier_type || '',
      latitude: data.latitude || '',
      longitude: data.longitude || '',
      full_address: data.full_address || '',
      city: data.city || '',
      state: data.state || '',
      area_service: data.area_service || '',
      rating: data.rating || '',
      reviews: data.reviews || '',
      reviews_link: data.reviews_link || '',
      photos_count: data.photos_count || '',
      working_hours: data.working_hours || '',
      verified: data.verified || 'False',
      location_link: data.location_link || '',
      place_id: data.place_id || '',
      email_1: data.email_1 || '',
      email_1_emails_validator_status: data.email_1_emails_validator_status || '',
      facebook: data.facebook || '',
      instagram: data.instagram || '',
      logo: data.logo || '',
      primary_color: data.primary_color || '#0066CC',
      secondary_color: data.secondary_color || '#004C99',
      slug: data.slug || '',
      // Remove fields not in CSV
    };

    return business;
  } catch (error) {
    console.error('Error in getBusinessBySlug:', error);
    return null;
  }
}

export async function getBusinessReviews(placeId: string, limit: number = 10): Promise<GoogleReview[]> {
  try {
    const { data, error } = await supabase
      .from('google_reviews')
      .select('*')
      .eq('place_id', placeId)
      .eq('stars', 5)  // Only get 5-star reviews
      .order('published_at_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBusinessReviews:', error);
    return [];
  }
}

export async function getAllBusinesses(): Promise<PlumbingBusiness[]> {
  try {
    const { data, error } = await supabase
      .from('plumbing_leads')
      .select('*')
      .order('rating', { ascending: false });

    if (error) {
      console.error('Error fetching businesses:', error);
      return [];
    }

    // Map database fields to interface
    const businesses: PlumbingBusiness[] = data.map((item: any) => ({
      id: item.id,
      name: item.name || '',
      site: item.site || item.website || '',
      subtypes: item.subtypes || '',
      category: item.category || '',
      type: item.type || '',
      phone: item.phone || '',
      phone_phones_enricher_carrier_name: item.phone_phones_enricher_carrier_name || '',
      phone_phones_enricher_carrier_type: item.phone_phones_enricher_carrier_type || '',
      latitude: item.latitude || '',
      longitude: item.longitude || '',
      full_address: item.full_address || '',
      city: item.city || '',
      state: item.state || '',
      area_service: item.area_service || '',
      rating: item.rating || '',
      reviews: item.reviews || '',
      reviews_link: item.reviews_link || '',
      photos_count: item.photos_count || '',
      working_hours: item.working_hours || '',
      verified: item.verified || 'False',
      location_link: item.location_link || '',
      place_id: item.place_id || '',
      email_1: item.email_1 || '',
      email_1_emails_validator_status: item.email_1_emails_validator_status || '',
      facebook: item.facebook || '',
      instagram: item.instagram || '',
      logo: item.logo || '',
      primary_color: item.primary_color || '#0066CC',
      secondary_color: item.secondary_color || '#004C99',
      slug: item.slug || ''
    }));

    return businesses;
  } catch (error) {
    console.error('Error in getAllBusinesses:', error);
    return [];
  }
}

// Export the old field name mapping for compatibility
export {
  getBusinessBySlug as getBusinessBySlugFromSupabase,
  getAllBusinesses as getAllBusinessesFromSupabase
};