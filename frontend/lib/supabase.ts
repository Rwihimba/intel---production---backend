"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local"
  );
}

// Cookie-backed browser client. Sessions live in cookies (chunked) so that
// server route handlers (e.g. /auth/callback) and proxy.ts can read/refresh
// them. The .auth API is identical to the previous createClient usage, so
// AuthContext, lib/api.ts and the login page keep working unchanged.
export const supabase = createBrowserClient(url, anonKey);
