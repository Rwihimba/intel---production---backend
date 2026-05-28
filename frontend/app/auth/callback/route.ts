import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type IntentErr =
  | "oauth"
  | "no_workspace"
  | "wrong_role"
  | "not_setup"
  | "slug_taken"
  | "email_taken"
  | "invalid_slug";

function bounce(
  origin: string,
  target: "/admin-login" | "/admin-signup",
  err: IntentErr,
  extra?: Record<string, string>
) {
  const params = new URLSearchParams({ error: err, ...(extra ?? {}) });
  return NextResponse.redirect(`${origin}${target}?${params.toString()}`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const intent = searchParams.get("intent") ?? "login";

  if (!code) return bounce(origin, "/admin-login", "oauth");

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.session || !data.user) {
    await supabase.auth.signOut();
    return bounce(origin, "/admin-login", "oauth");
  }

  const bearer = `Bearer ${data.session.access_token}`;

  if (intent === "signup") {
    // Provision a brand-new tenant — workspace details came in the magic
    // link URL params so they survive the email round-trip.
    const orgName = searchParams.get("org_name");
    const slug = searchParams.get("slug");
    const fullName = searchParams.get("full_name");
    if (!orgName || !slug) {
      // Lost the URL params (some email clients strip them). Fall through
      // to the signup screen with the session still valid; the user just
      // re-enters workspace name and we provision via the authed path.
      return NextResponse.redirect(`${origin}/admin-signup`);
    }
    try {
      const res = await fetch(`${API_URL}/v1/auth/admin-signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: bearer },
        body: JSON.stringify({
          org_name: orgName,
          org_slug: slug,
          full_name: fullName ?? undefined,
        }),
      });
      if (res.ok) {
        return NextResponse.redirect(`${origin}/workspace/admin`);
      }
      const body = (await res.json().catch(() => ({}))) as { code?: string };
      const errKey = (body.code as IntentErr) ?? "not_setup";
      return bounce(origin, "/admin-signup", errKey, {
        org_name: orgName,
        slug,
      });
    } catch {
      return bounce(origin, "/admin-signup", "not_setup");
    }
  }

  // intent === "login" (default). Existing-admin path. We DO NOT sign the
  // user out on 404 (no_workspace) — instead we keep their session and
  // send them to /admin-signup so they can complete provisioning without
  // a second magic link round-trip.
  try {
    const res = await fetch(`${API_URL}/v1/auth/admin-bootstrap`, {
      method: "POST",
      headers: { Authorization: bearer },
    });
    if (res.ok) {
      return NextResponse.redirect(`${origin}/workspace/admin`);
    }
    const body = (await res.json().catch(() => ({}))) as { code?: string };
    if (body.code === "no_workspace") {
      return NextResponse.redirect(`${origin}/admin-signup?intent=onboard`);
    }
    if (body.code === "wrong_role") {
      await supabase.auth.signOut();
      return bounce(origin, "/admin-login", "wrong_role");
    }
    await supabase.auth.signOut();
    return bounce(origin, "/admin-login", "not_setup");
  } catch {
    await supabase.auth.signOut();
    return bounce(origin, "/admin-login", "not_setup");
  }
}
