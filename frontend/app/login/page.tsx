"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function destFor(role: string): string {
  if (role === "admin") return "/workspace/admin";
  if (role === "agent") return "/workspace/agent";
  if (role === "ambassador") return "/workspace/ambassador";
  return "/login";
}

const HEADINGS: Record<string, string> = {
  agent: "Agent Sign In",
  ambassador: "Ambassador Sign In",
};

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const roleParam = searchParams.get("role") ?? "";
  const heading = HEADINGS[roleParam] ?? "Team Sign In";
  const signupHref = roleParam ? `/signup?role=${roleParam}` : "/signup";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) router.replace(destFor(user.role));
  }, [user, router]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInErr) {
        setError(signInErr.message);
        setSubmitting(false);
        return;
      }

      // Approved users have a /v1/me record; pending/rejected users do not.
      try {
        const res = await api.get("/v1/me");
        const me = (res.data?.user ?? res.data) as { role: string } | null;
        if (me?.role) {
          router.replace(destFor(me.role));
          return;
        }
      } catch {
        // No users row yet — fall through to the pending/rejected check.
      }

      const statusRes = await api.get("/v1/auth/status", {
        params: { email: email.toLowerCase() },
      });
      const status = statusRes.data?.status as string | undefined;
      const adminName = statusRes.data?.approving_admin_name as string | null;
      const rejectionReason = statusRes.data?.rejection_reason as string | null;

      if (status === "pending") {
        await supabase.auth.signOut();
        setError(
          `Your account is pending approval${
            adminName ? ` from ${adminName}` : ""
          }. You will receive an email when it is approved.`
        );
      } else if (status === "rejected") {
        await supabase.auth.signOut();
        setError(
          `Your account request was not approved.${
            rejectionReason ? ` ${rejectionReason}` : ""
          }`
        );
      } else {
        await supabase.auth.signOut();
        setError("Your account has not been set up. Contact your team lead.");
      }
      setSubmitting(false);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "error" in err
          ? String((err as { error: unknown }).error)
          : "Sign-in failed.";
      setError(msg);
      setSubmitting(false);
    }
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
          INTEL · ALX Rwanda
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{heading}</h1>
          <p style={{ fontSize: 13, color: "var(--text2)", margin: "6px 0 22px" }}>
            Sign in to your INTEL workspace.
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

        <form onSubmit={handleSignIn} className="login-form" style={{ marginTop: 0 }}>
          <div>
            <label htmlFor="email">EMAIL ADDRESS</label>
            <input
              id="email"
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div>
            <label htmlFor="password">PASSWORD</label>
            <input
              id="password"
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>
          <button type="submit" className="btn primary login-btn" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {(
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Link
              href={signupHref}
              style={{ fontSize: 13, color: "var(--teal)", textDecoration: "none" }}
            >
              Request access →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
