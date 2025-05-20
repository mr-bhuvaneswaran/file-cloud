import { createClient } from '@supabase/supabase-js';
import nextConfig from '../../next.config';

const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } = nextConfig.env ?? {};

export const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL!, NEXT_PUBLIC_SUPABASE_ANON_KEY!); 