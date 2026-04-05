import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajrubsqxqcnblxqjmjsg.supabase.co';
// GANTI DENGAN ANON KEY DARI SUPABASE DASHBOARD ANDA
// Settings > API > Project API keys > anon public
const supabaseAnonKey = 'sb_publishable_9aDmAyLG7K84VIrjnMTGyQ_vPpFYqPt';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
