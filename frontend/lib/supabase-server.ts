import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client for Route Handlers / Server Components.
 * Reads and writes the session cookies via next/headers so PKCE code
 * exchange and session reads work on the server.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll called from a Server Component (read-only cookies).
          // proxy.ts refreshes the session, so this can be safely ignored.
        }
      },
    },
  });
}
