import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const CAPTURE_BUCKET = 'web-captures';

// The publishable key plus the visitor's id: RLS (db/0002_visitor_policies.sql) limits every query and every
// stored image to that visitor. The server holds no secret key.
export function dbFor(visitorId: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('supabase_env_missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-visitor-id': visitorId } },
  });
}
