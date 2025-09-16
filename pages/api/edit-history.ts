import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method, query, body } = req;

  if (method === 'GET') {
    const { slug } = query;

    if (!slug) {
      return res.status(400).json({ error: 'Slug required' });
    }

    try {
      // Get edit history for this business
      const { data: history, error } = await supabase
        .from('plumbing_edit_history')
        .select('*')
        .eq('business_slug', slug)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Group edits by timestamp (within 5 seconds = same batch)
      const groupedHistory: any[] = [];
      let currentGroup: any = null;

      history?.forEach((edit: any) => {
        const editTime = new Date(edit.created_at).getTime();

        if (!currentGroup || editTime < currentGroup.timestamp - 5000) {
          // New group
          currentGroup = {
            id: edit.id,
            timestamp: editTime,
            created_at: edit.created_at,
            edits: [edit],
            device_type: edit.device_type,
            summary: []
          };
          groupedHistory.push(currentGroup);
        } else {
          // Add to current group
          currentGroup.edits.push(edit);
        }
      });

      // Create summaries for each group
      groupedHistory.forEach(group => {
        const changes = new Set();
        group.edits.forEach((edit: any) => {
          if (edit.field_key.includes('headline')) changes.add('Headline');
          if (edit.field_key.includes('subheadline')) changes.add('Subheadline');
          if (edit.field_key.includes('button')) changes.add('Buttons');
          if (edit.field_key.includes('image')) changes.add('Image');
          if (edit.field_key.includes('Color')) changes.add('Colors');
          if (edit.field_key.includes('Size')) changes.add('Sizes');
          if (edit.field_key.includes('Font')) changes.add('Fonts');
        });
        group.summary = Array.from(changes).join(', ');
      });

      return res.status(200).json(groupedHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
  }

  if (method === 'POST') {
    const { slug, edits } = body;

    if (!slug || !edits) {
      return res.status(400).json({ error: 'Slug and edits required' });
    }

    try {
      // Save edit history
      const historyEntries = edits.map((edit: any) => ({
        business_slug: slug,
        edit_type: edit.field,
        field_key: edit.key,
        old_value: edit.oldValue,
        new_value: edit.newValue,
        device_type: edit.deviceType || 'all',
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
      }));

      const { error } = await supabase
        .from('plumbing_edit_history')
        .insert(historyEntries);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error saving history:', error);
      return res.status(500).json({ error: 'Failed to save history' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}