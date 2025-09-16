import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TemplateCustomization {
  id?: number;
  business_slug: string;
  template_name: string;
  custom_images: Record<string, string>;
  custom_text: Record<string, string>;
  custom_colors: Record<string, string>;
  custom_styles: Record<string, string>;
  custom_buttons: Record<string, string>;
  is_published: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getTemplateCustomization(slug: string): Promise<TemplateCustomization | null> {
  try {
    const { data, error } = await supabase
      .from('plumbing_templates')
      .select('*')
      .eq('business_slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching template customization:', error);
      return null;
    }

    return data as TemplateCustomization || null;
  } catch (error) {
    console.error('Error in getTemplateCustomization:', error);
    return null;
  }
}

export async function saveTemplateCustomization(
  slug: string,
  field: 'custom_images' | 'custom_text' | 'custom_colors' | 'custom_styles' | 'custom_buttons',
  key: string,
  value: string
): Promise<boolean> {
  try {
    // Get existing customization or create default
    const existing = await getTemplateCustomization(slug);

    const currentData = existing || {
      business_slug: slug,
      template_name: 'plumbing3', // Always use plumbing3 for editor
      custom_images: {},
      custom_text: {},
      custom_colors: {},
      custom_styles: {},
      custom_buttons: {},
      is_published: false
    };

    // Update the specific field
    currentData[field] = {
      ...currentData[field],
      [key]: value
    };
    currentData.updated_at = new Date().toISOString();

    // Upsert the data
    const { error } = await supabase
      .from('plumbing_templates')
      .upsert({
        ...currentData,
        business_slug: slug
      }, {
        onConflict: 'business_slug'
      });

    if (error) {
      console.error('Error saving customization:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveTemplateCustomization:', error);
    return false;
  }
}

export async function publishTemplate(slug: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('plumbing_templates')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('business_slug', slug);

    if (error) {
      console.error('Error publishing template:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in publishTemplate:', error);
    return false;
  }
}