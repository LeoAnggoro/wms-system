import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajrubsqxqcnblxqjmjsg.supabase.co';
// GANTI DENGAN ANON KEY DARI SUPABASE DASHBOARD ANDA
// Settings > API > Project API keys > anon public
const supabaseAnonKey = 'GANTI_DENGAN_ANON_KEY_ANDA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
