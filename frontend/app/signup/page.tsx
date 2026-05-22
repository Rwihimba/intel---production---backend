"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { api } from "@/lib/api";

type Role = "agent" | "ambassador";
interface AdminOption {
  id: string;
  full_name: string;
}

function SignupInner() {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const initialRole: Role | null =
    roleParam === "agent" || roleParam === "ambassador" ? roleParam : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role | null>(initialRole);
  const [adminId, setAdminId] = useState("");
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ adminName: string } | null>(null);

  useEffect(() => {
    api
      .get("/v1/users/admins")
      .then((res) => setAdmins(res.data?.data ?? []))
      .catch(() => setAdmins([]));
  }, []);

  function validate(): string | null {
    if (!fullName.trim()) return "Full name is required.";
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirm) return "Passwords do not match.";
    if (!role) return "Select whether you are an agent or ambassador.";
    if (!adminId) return "Select your team lead.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    try {
      const { error: signUpErr } = await supabase.auth.signUp({ email, password });
      if (signUpErr) {
        setError(signUpErr.message);
        setSubmitting(false);
        return;
      }
      await api.post("/v1/auth/request-access", {
        email: email.toLowerCase(),
        full_name: fullName.trim(),
        role,
        approving_admin_id: adminId,
      });
      // Sign out the freshly created (unapproved) auth session.
      await supabase.auth.signOut();
      const adminName =
        admins.find((a) => a.id === adminId)?.full_name ?? "Your team lead";
      setSubmitted({ adminName });
    } catch (err) {
      const msg =
        typeof err === "object" && err && "error" in err
          ? String((err as { error: unknown }).error)
          : err instanceof Error
          ? err.message
          : "Request failed.";
      setError(msg);
      setSubmitting(false);
    }
  }

  if (submitted) {
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
            maxWidth: 440,
            background: "var(--surface)",
            borderRadius: 20,
            border: "1px solid var(--border)",
            boxShadow: "0 12px 40px rgba(26,32,53,0.08)",
            padding: "36px 32px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "var(--teal-bg)",
              color: "var(--teal)",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 14px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Request submitted
          </h1>
          <p style={{ fontSize: 13, color: "var(--text2)", margin: "10px 0 18px", lineHeight: 1.5 }}>
            {submitted.adminName} will review your account. You will receive an
            email once approved.
          </p>
          <Link href="/login" className="btn primary" style={{ textDecoration: "none" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    );
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
          maxWidth: 460,
          background: "var(--surface)",
          borderRadius: 20,
          border: "1px solid var(--border)",
          boxShadow: "0 12px 40px rgba(26,32,53,0.08)",
          padding: "36px 32px 30px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, textAlign: "center" }}>
          Request access
        </h1>
        <p style={{ fontSize: 13, color: "var(--text2)", margin: "6px 0 22px", textAlign: "center" }}>
          For agents and ambassadors. An admin must approve your account.
        </p>

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

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label className="field-label">Full Name</label>
            <input
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div>
              <label className="field-label">Confirm Password</label>
              <input
                className="input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="field-label">I am joining as</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(["agent", "ambassador"] as const).map((r) => {
                const active = role === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    style={{
                      padding: "14px 12px",
                      borderRadius: 12,
                      border: `1.5px solid ${active ? "var(--teal)" : "var(--border)"}`,
                      background: active ? "var(--teal-bg)" : "var(--surface)",
                      color: active ? "var(--teal)" : "var(--text)",
                      fontSize: 13,
                      fontWeight: 500,
                      textTransform: "capitalize",
                      cursor: "pointer",
                      transition: "all 0.12s",
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="field-label">Who is your team lead?</label>
            <select
              className="select"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              required
            >
              <option value="">Select your approving admin…</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name}
                </option>
              ))}
            </select>
            {admins.length === 0 && (
              <div className="tiny" style={{ marginTop: 4, color: "var(--text3)" }}>
                No admins available yet — contact ALX Rwanda ops.
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn primary login-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Request Access"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Link
            href="/login"
            style={{ fontSize: 13, color: "var(--text2)", textDecoration: "none" }}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupInner />
    </Suspense>
  );
}
