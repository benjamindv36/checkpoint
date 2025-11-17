import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns a Supabase client when environment variables are configured.
 * If not configured, returns null so server-side prerendering doesn't throw.
 */
export function getSupabaseClient(): SupabaseClient | null {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		return null;
	}

	return createClient(supabaseUrl, supabaseAnonKey);
}

export default getSupabaseClient;
