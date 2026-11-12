import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const CAPTURE_BUCKET = 'web-captures';

// The publishable key, the visitor's id and the server key: RLS (db/0002, db/0004) limits every query and every
// stored image to that visitor, and without WEB_DB_KEY nothing matches at all. No Supabase secret key is used.
export function dbFor(visitorId: string): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  const webKey = process.env.WEB_DB_KEY;
  if (!url || !key || !webKey) throw new Error('supabase_env_missing');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { 'x-visitor-id': visitorId, 'x-web-key': webKey } },
  });
}
