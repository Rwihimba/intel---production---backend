"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const CALLBACK_ERRORS: Record<string, string> = {
  slug_taken: "That workspace URL is already taken. Pick another.",
  email_taken: "This email already belongs to a different workspace.",
  invalid_slug: "Workspace URL must contain at least 2 letters or numbers.",
  oauth: "Sign-in link was invalid or expired. Please request a new one.",
};

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [orgName, setOrgName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  // Auto-derive slug from workspace name until the user edits it themselves.
  const derivedSlug = useMemo(() => slugify(orgName), [orgName]);
  const effectiveSlug = slugTouched ? slug : derivedSlug;

  useEffect(() => {
    const code = searchParams.get("error");
    if (code && CALLBACK_ERRORS[code]) setError(CALLBACK_ERRORS[code]);
  }, [searchParams]);

  // Already signed in (e.g. redirected from /admin-login when their email
  // had no workspace yet) — they shouldn't have to re-verify, just finish
  // provisioning. Bypass the magic-link round-trip and call the backend
  // directly with their existing session.
  const isReturningAuthed = !!user === false && !!searchParams.get("intent");

  useEffect(() => {
    if (user?.role === "admin") router.replace("/workspace/admin");
  }, [user, router]);

  async function handleAuthedSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (effectiveSlug.length < 2) {
      setError("Workspace URL must contain at least 2 letters or numbers.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/v1/auth/admin-signup", {
        org_name: orgName.trim(),
        org_slug: effectiveSlug,
        full_name: fullName.trim() || undefined,
      });
      router.replace("/workspace/admin");
    } catch (err) {
      const errObj = err as { code?: string; error?: string };
      const code = errObj?.code;
      if (code && CALLBACK_ERRORS[code]) {
        setError(CALLBACK_ERRORS[code]);
      } else {
        setError(errObj?.error ?? "Could not create workspace.");
      }
      setSubmitting(false);
    }
  }

  async function handleMagicLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (effectiveSlug.length < 2) {
      setError("Workspace URL must contain at least 2 letters or numbers.");
      return;
    }
    setSubmitting(true);
    const origin = window.location.origin;
    const params = new URLSearchParams({
      intent: "signup",
      org_name: orgName.trim(),
      slug: effectiveSlug,
    });
    if (fullName.trim()) params.set("full_name", fullName.trim());
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?${params.toString()}` },
    });
    if (otpErr) {
      setError(otpErr.message);
      setSubmitting(false);
      return;
    }
    setSent(true);
    setSubmitting(false);
  }

  // Two flow variants for the same page:
  //  1) Brand-new user: magic-link path. We need their email and send OTP.
  //  2) User came back from /admin-login with a verified session but no
  //     workspace yet (callback redirected here keeping the session). They
  //     only need to fill in workspace details — no second magic link.
  const submitHandler = user ? handleAuthedSubmit : handleMagicLinkSubmit;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "var(--surface)",
          borderRadius: 20,
          boxShadow: "0 12px 40px rgba(26,32,53,0.08)",
          border: "1px solid var(--border)",
          padding: "36px 32px 30px",
        }}
      >
        <div
          style={{
            fontSize: 10,
            letterSpacing: "0.16em",
            color: "var(--text3)",
            fontWeight: 500,
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          INTEL · Create Workspace
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            {user ? "Finish setting up your workspace" : "Create your INTEL workspace"}
          </h1>
          <p style={{ fontSize: 13, color: "var(--text2)", margin: "6px 0 22px" }}>
            {user
              ? `Signed in as ${user.email ?? "you"}. Tell us about your team.`
              : "We'll email you a one-time sign-in link to verify and provision your workspace."}
          </p>
        </div>

        {error && (
          <div
            style={{
              color: "var(--red)",
              fontSize: 13,
              background: "var(--red-bg)",
              border: "1px solid #FBD0D5",
              padding: "9px 12px",
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {sent ? (
          <div
            style={{
              textAlign: "center",
              background: "var(--teal-bg)",
              border: "1px solid #CDE9E5",
              borderRadius: 10,
              padding: "18px 16px",
            }}
          >
            <div style={{ fontWeight: 500, color: "var(--text)" }}>Check your email</div>
            <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6, lineHeight: 1.5 }}>
              We sent a sign-in link to <b>{email}</b>. Open it on this device to finish creating
              <b> {orgName.trim()}</b>.
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              onClick={() => setSent(false)}
            >
              Start over
            </button>
          </div>
        ) : (
          <form onSubmit={submitHandler} className="login-form" style={{ marginTop: 0 }}>
            {!user && (
              <div>
                <label htmlFor="email">EMAIL ADDRESS</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@yourcompany.com"
                  autoComplete="email"
                  required
                  disabled={isReturningAuthed}
                />
              </div>
            )}

            <div>
              <label htmlFor="full_name">YOUR NAME (OPTIONAL)</label>
              <input
                id="full_name"
                className="input"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                autoComplete="name"
              />
            </div>

            <div>
              <label htmlFor="org_name">WORKSPACE NAME</label>
              <input
                id="org_name"
                className="input"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Acme Africa"
                required
                minLength={2}
                maxLength={80}
              />
            </div>

            <div>
              <label htmlFor="org_slug">WORKSPACE URL</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "var(--surface)",
                }}
              >
                <span
                  style={{
                    padding: "10px 8px 10px 12px",
                    color: "var(--text3)",
                    fontSize: 13,
                    background: "var(--surface-2, #F8F9FB)",
                    whiteSpace: "nowrap",
                  }}
                >
                  intel.app/
                </span>
                <input
                  id="org_slug"
                  type="text"
                  value={effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(slugify(e.target.value));
                  }}
                  placeholder="acme-africa"
                  pattern="[a-z0-9-]+"
                  minLength={2}
                  maxLength={48}
                  required
                  style={{
                    flex: 1,
                    border: "none",
                    outline: "none",
                    padding: "10px 12px 10px 0",
                    fontSize: 14,
                    background: "transparent",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>
                Lowercase letters, numbers, and hyphens only.
              </div>
            </div>

            <button type="submit" className="btn primary login-btn" disabled={submitting}>
              {submitting
                ? user
                  ? "Creating workspace…"
                  : "Sending link…"
                : user
                ? "Create workspace"
                : "Send sign-in link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link
            href="/admin-login"
            style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}
          >
            Already have a workspace? Sign in →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminSignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
