import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getEnv(): { url?: string; key?: string } {
  // Vite exposes VITE_* vars via import.meta.env during build; fallback to process.env for Node usage
  const meta: any = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
  const url = meta?.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = meta?.VITE_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_KEY;
  return { url, key };
}

const { url, key } = getEnv();

export const supabase: SupabaseClient | null = (url && key) ? createClient(url, key) : null;

export function ensureClient(): SupabaseClient {
  if (!supabase) throw new Error('Supabase client not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (or SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).');
  return supabase as SupabaseClient;
}
