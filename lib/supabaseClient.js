import { createClient } from '@supabase/supabase-js'

const url = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : undefined;
const anonKey = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined;

if (!url || !anonKey) {
  throw new Error('Supabase environment variables are missing.');
}

const supabase = createClient(url, anonKey)

export default supabase
