import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface TemplateCustomization {
  id?: number;
  business_slug: string;
  business_uuid?: string;
  template_name: string;
  custom_images: Record<string, string>;
  custom_text: Record<string, string>;
  custom_colors: Record<string, string>;
  custom_styles: Record<string, string>;
  custom_buttons: Record<string, string>;
  version?: number;
  is_current?: boolean;
  parent_version?: number;
  change_summary?: string;
  is_published: boolean;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getTemplateCustomization(slug: string): Promise<TemplateCustomization | null> {
  try {
    console.log('[getTemplateCustomization] Looking for:', slug);

    // First get the business UUID from plumbing_leads
    const { data: businessData, error: businessError } = await supabase
      .from('plumbing_leads')
      .select('uuid')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData?.uuid) {
      console.log('[getTemplateCustomization] No UUID found, using slug fallback');
      // Fallback to old method for backwards compatibility
      const { data, error } = await supabase
        .from('plumbing_templates')
        .select('*')
        .eq('business_slug', slug)
        .eq('is_current', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[getTemplateCustomization] Error with slug lookup:', error);
        return null;
      }

      console.log('[getTemplateCustomization] Found by slug:', data ? `v${data.version}` : 'none');
      return data as TemplateCustomization || null;
    }

    console.log('[getTemplateCustomization] Found UUID:', businessData.uuid);

    // Use UUID to get the template
    const { data, error } = await supabase
      .from('plumbing_templates')
      .select('*')
      .eq('business_uuid', businessData.uuid)
      .eq('is_current', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[getTemplateCustomization] Error with UUID lookup:', error);
      return null;
    }

    console.log('[getTemplateCustomization] Found by UUID:', data ? `v${data.version}` : 'none');
    return data as TemplateCustomization || null;
  } catch (error) {
    console.error('[getTemplateCustomization] Unexpected error:', error);
    return null;
  }
}

export async function getTemplateVersions(slug: string): Promise<TemplateCustomization[]> {
  try {
    // Get business UUID first
    const { data: businessData, error: businessError } = await supabase
      .from('plumbing_leads')
      .select('uuid')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData?.uuid) {
      // Fallback to old method
      const { data, error } = await supabase
        .from('plumbing_templates')
        .select('*')
        .eq('business_slug', slug)
        .order('version', { ascending: false });

      if (error) {
        console.error('Error fetching template versions:', error);
        return [];
      }

      return data as TemplateCustomization[] || [];
    }

    // Use UUID to get versions
    const { data, error } = await supabase
      .from('plumbing_templates')
      .select('*')
      .eq('business_uuid', businessData.uuid)
      .order('version', { ascending: false });

    if (error) {
      console.error('Error fetching template versions:', error);
      return [];
    }

    return data as TemplateCustomization[] || [];
  } catch (error) {
    console.error('Error in getTemplateVersions:', error);
    return [];
  }
}

// OLD FUNCTION - Keep for backward compatibility but it creates versions now
export async function saveTemplateCustomization(
  slug: string,
  field: 'custom_images' | 'custom_text' | 'custom_colors' | 'custom_styles' | 'custom_buttons',
  key: string,
  value: string
): Promise<boolean> {
  try {
    // Get existing current version
    const existing = await getTemplateCustomization(slug);

    if (existing) {
      // For individual saves, just update the current version
      // This is temporary until we update the editor to use batch saves
      const updatedField = {
        ...existing[field],
        [key]: value
      };

      const { error } = await supabase
        .from('plumbing_templates')
        .update({
          [field]: updatedField,
          updated_at: new Date().toISOString()
        })
        .eq('business_slug', slug)
        .eq('is_current', true);

      if (error) {
        console.error('Error updating template:', error);
        return false;
      }

      return true;
    } else {
      // First time - create version 1
      // Get business UUID first
      const { data: businessData, error: businessError } = await supabase
        .from('plumbing_leads')
        .select('uuid')
        .eq('slug', slug)
        .single();
      
      if (businessError || !businessData?.uuid) {
        console.error('Error finding business UUID for first-time save:', businessError);
        return false;
      }
      
      const newData = {
        business_slug: slug,
        business_uuid: businessData.uuid,
        template_name: 'plumbing3',
        custom_images: field === 'custom_images' ? { [key]: value } : {},
        custom_text: field === 'custom_text' ? { [key]: value } : {},
        custom_colors: field === 'custom_colors' ? { [key]: value } : {},
        custom_styles: field === 'custom_styles' ? { [key]: value } : {},
        custom_buttons: field === 'custom_buttons' ? { [key]: value } : {},
        version: 1,
        is_current: true,
        is_published: false,
        change_summary: `Initial version - ${field}.${key}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('plumbing_templates')
        .insert(newData);

      if (error) {
        console.error('Error creating first version:', error);
        return false;
      }

      return true;
    }
  } catch (error) {
    console.error('Error in saveTemplateCustomization:', error);
    return false;
  }
}

// NEW BATCH SAVE - Creates a new version with all changes
export async function saveTemplateVersion(
  slug: string,
  allData: Partial<TemplateCustomization>,
  summary?: string
): Promise<boolean> {
  try {
    console.log('=== SAVE TEMPLATE VERSION START ===');
    console.log('Slug:', slug);
    console.log('Summary:', summary);
    console.log('Data being saved:', JSON.stringify(allData, null, 2));

    // First get the business UUID
    const { data: businessData, error: businessError } = await supabase
      .from('plumbing_leads')
      .select('uuid')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData?.uuid) {
      console.error('❌ BUSINESS UUID ERROR:', businessError);
      console.error('Business data:', businessData);
      alert(`Failed to find business: ${businessError?.message || 'Business not found'}`);
      return false;
    }

    const businessUuid = businessData.uuid;
    console.log('✅ Found business UUID:', businessUuid);

    // Get existing current version
    const existing = await getTemplateCustomization(slug);
    console.log('Existing template:', existing ? `Version ${existing.version}` : 'None');

    if (existing) {
      // Calculate next version number
      const newVersion = (existing.version || 1) + 1;
      console.log('Found existing version:', existing.version);
      console.log('Creating new version:', newVersion);
      console.log('Existing ID:', existing.id);

      // Create complete new version data
      const newData = {
        business_slug: slug,
        business_uuid: businessUuid,
        template_name: existing.template_name || 'plumbing3',
        custom_images: allData.custom_images || existing.custom_images || {},
        custom_text: allData.custom_text || existing.custom_text || {},
        custom_colors: allData.custom_colors || existing.custom_colors || {},
        custom_styles: allData.custom_styles || existing.custom_styles || {},
        custom_buttons: allData.custom_buttons || existing.custom_buttons || {},
        version: newVersion,
        is_current: true,
        parent_version: existing.version || 1,
        change_summary: summary || `Version ${newVersion} - Multiple changes`,
        is_published: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📦 NEW VERSION DATA:', JSON.stringify(newData, null, 2));

      // Start transaction: Mark old as not current (use UUID for accuracy)
      console.log('Marking old version as not current...');
      const { error: updateError } = await supabase
        .from('plumbing_templates')
        .update({ is_current: false })
        .eq('business_uuid', businessUuid)
        .eq('is_current', true);

      if (updateError) {
        console.error('❌ UPDATE ERROR:', updateError);
        alert(`Failed to update old version: ${updateError.message}`);
        return false;
      }
      console.log('✅ Old version marked as not current');

      // Insert new version
      console.log('Inserting new version...');
      const { data: insertData, error: insertError } = await supabase
        .from('plumbing_templates')
        .insert(newData)
        .select();

      if (insertError) {
        console.error('❌ INSERT ERROR:', insertError);
        console.error('Error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        console.error('Data attempted:', JSON.stringify(newData, null, 2));
        alert(`Failed to create new version: ${insertError.message}`);

        // Rollback: set old version back to current
        await supabase
          .from('plumbing_templates')
          .update({ is_current: true })
          .eq('business_uuid', businessUuid)
          .eq('version', existing.version);

        return false;
      }

      console.log(`✅ SUCCESS! Created version ${newVersion} for ${slug}`);
      console.log('Inserted data:', insertData);
      return true;

    } else {
      // First time - create version 1
      console.log('No existing template, creating version 1');
      const newData = {
        business_slug: slug,
        business_uuid: businessUuid,
        template_name: 'plumbing3',
        custom_images: allData.custom_images || {},
        custom_text: allData.custom_text || {},
        custom_colors: allData.custom_colors || {},
        custom_styles: allData.custom_styles || {},
        custom_buttons: allData.custom_buttons || {},
        version: 1,
        is_current: true,
        is_published: false,
        change_summary: summary || 'Initial version',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📦 INITIAL VERSION DATA:', JSON.stringify(newData, null, 2));

      const { data: insertData, error } = await supabase
        .from('plumbing_templates')
        .insert(newData)
        .select();

      if (error) {
        console.error('❌ FIRST VERSION ERROR:', error);
        alert(`Failed to create first version: ${error.message}`);
        return false;
      }

      console.log(`✅ SUCCESS! Created version 1 for ${slug}`);
      console.log('Inserted data:', insertData);
      return true;
    }
  } catch (error) {
    console.error('❌ UNEXPECTED ERROR in saveTemplateVersion:', error);
    alert(`Unexpected error: ${error}`);
    return false;
  }
}

export async function rollbackToVersion(slug: string, targetVersion: number): Promise<boolean> {
  try {
    // Get business UUID first
    const { data: businessData, error: businessError } = await supabase
      .from('plumbing_leads')
      .select('uuid')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData?.uuid) {
      console.error('Error fetching business UUID:', businessError);
      return false;
    }

    const businessUuid = businessData.uuid;

    // Get the target version data
    const { data: targetData, error: fetchError } = await supabase
      .from('plumbing_templates')
      .select('*')
      .eq('business_uuid', businessUuid)
      .eq('version', targetVersion)
      .single();

    if (fetchError || !targetData) {
      console.error('Error fetching target version:', fetchError);
      return false;
    }

    // Get current max version
    const { data: maxVersionData, error: maxError } = await supabase
      .from('plumbing_templates')
      .select('version')
      .eq('business_uuid', businessUuid)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (maxError) {
      console.error('Error getting max version:', maxError);
      return false;
    }

    const newVersion = (maxVersionData?.version || 1) + 1;

    // Create new version with target version's data
    const restoredData = {
      ...targetData,
      version: newVersion,
      is_current: true,
      parent_version: targetVersion,
      change_summary: `Restored from version ${targetVersion}`,
      created_at: new Date().toISOString()
    };

    delete restoredData.id;

    // Mark all current as not current
    await supabase
      .from('plumbing_templates')
      .update({ is_current: false })
      .eq('business_uuid', businessUuid)
      .eq('is_current', true);

    // Insert restored version
    const { error: insertError } = await supabase
      .from('plumbing_templates')
      .insert(restoredData);

    if (insertError) {
      console.error('Error creating restored version:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in rollbackToVersion:', error);
    return false;
  }
}

export async function publishTemplate(slug: string): Promise<boolean> {
  try {
    // Get business UUID first
    const { data: businessData, error: businessError } = await supabase
      .from('plumbing_leads')
      .select('uuid')
      .eq('slug', slug)
      .single();

    if (businessError || !businessData?.uuid) {
      // Fallback to old method
      const { error } = await supabase
        .from('plumbing_templates')
        .update({
          is_published: true,
          published_at: new Date().toISOString()
        })
        .eq('business_slug', slug)
        .eq('is_current', true);

      if (error) {
        console.error('Error publishing template:', error);
        return false;
      }

      return true;
    }

    const { error } = await supabase
      .from('plumbing_templates')
      .update({
        is_published: true,
        published_at: new Date().toISOString()
      })
      .eq('business_uuid', businessData.uuid)
      .eq('is_current', true);

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