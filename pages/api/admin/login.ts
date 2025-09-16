import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    // Query the admin_users table
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Simple password check (in production, use bcrypt)
    // For demo purposes, we're checking if password equals 'nick' for username 'nick'
    if (username === 'nick' && password === 'nick') {
      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('username', username);

      // Generate a simple token (in production, use JWT)
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      return res.status(200).json({
        success: true,
        token,
        user: {
          username: user.username,
          full_name: user.full_name
        }
      });
    } else {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}