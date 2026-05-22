import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const ADMIN_DOMAIN = "alxafrica.com";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/admin-login?error=oauth`);
  }

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin-login?error=oauth`);
  }

  const email = (data.user.email ?? "").toLowerCase();
  const domain = email.split("@")[1];
  if (domain !== ADMIN_DOMAIN) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin-login?error=domain`);
  }

  // Ensure the admin profile exists (auto-provision on first login).
  // Done via the backend service-role endpoint because RLS blocks a
  // not-yet-admin user from inserting their own admin row.
  try {
    const res = await fetch(`${API_URL}/v1/auth/admin-bootstrap`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session.access_token}` },
    });
    if (!res.ok) {
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/admin-login?error=not_setup`);
    }
  } catch {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/admin-login?error=not_setup`);
  }

  return NextResponse.redirect(`${origin}/workspace/admin`);
}
