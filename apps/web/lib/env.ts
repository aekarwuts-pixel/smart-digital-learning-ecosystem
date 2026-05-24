/**
 * lib/env.ts
 * Supabase recently renamed NEXT_PUBLIC_SUPABASE_ANON_KEY
 * to NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
 * This helper supports BOTH names for backward compatibility.
 */

function getAnonKey(): string | undefined {
  // New name (Supabase SDK v2 / latest dashboard)
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    // Legacy name — still works if set in .env.local
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && getAnonKey());
}

export function getSupabaseEnv() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = getAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local"
    );
  }

  return { url, anonKey };
}
