"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const CALLBACK_ERRORS: Record<string, string> = {
  no_workspace:
    "No INTEL workspace is associated with this email yet. Create one to get started.",
  not_setup: "Your admin account could not be set up. Try again or contact support.",
  wrong_role: "This account is not an admin. Use the team sign-in screen.",
  oauth: "Sign-in link was invalid or expired. Please request a new one.",
};

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const code = searchParams.get("error");
    if (code && CALLBACK_ERRORS[code]) setError(CALLBACK_ERRORS[code]);
  }, [searchParams]);

  useEffect(() => {
    if (user?.role === "admin") router.replace("/workspace/admin");
    else if (user) router.replace(`/workspace/${user.role}`);
  }, [user, router]);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const origin = window.location.origin;
    const { error: otpErr } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/auth/callback?intent=login` },
    });
    if (otpErr) {
      setError(otpErr.message);
      setSending(false);
      return;
    }
    setSent(true);
    setSending(false);
  }

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
          maxWidth: 420,
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
          INTEL · Admin
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Admin Sign In</h1>
          <p style={{ fontSize: 13, color: "var(--text2)", margin: "6px 0 22px" }}>
            Enter your admin email — we&apos;ll send you a one-time sign-in link.
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
              We sent a sign-in link to <b>{email}</b>. Open it on this device to continue.
            </div>
            <button
              type="button"
              className="btn"
              style={{ marginTop: 14 }}
              onClick={() => {
                setSent(false);
                setError(null);
              }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSendLink} className="login-form" style={{ marginTop: 0 }}>
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
              />
            </div>
            <button type="submit" className="btn primary login-btn" disabled={sending}>
              {sending ? "Sending link…" : "Send sign-in link"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <Link
            href="/admin-signup"
            style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}
          >
            Don&apos;t have a workspace yet? Create one →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}
