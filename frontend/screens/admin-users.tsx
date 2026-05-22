"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { avatarColor, initials } from "@/lib/mock-data";

interface PendingUser {
  id: string;
  email: string;
  full_name: string;
  role: "agent" | "ambassador" | "admin";
  requested_at: string | null;
}

interface AppUser {
  id: string;
  email: string;
  full_name: string;
  role: "agent" | "ambassador" | "admin";
  is_active: boolean | null;
  last_login_at: string | null;
}

function roleBadge(r: string) {
  const k = r.toLowerCase();
  if (k === "admin") return <span className="badge red"><span className="dot" />Admin</span>;
  if (k === "agent") return <span className="badge teal"><span className="dot" />Agent</span>;
  return <span className="badge blue"><span className="dot" />Ambassador</span>;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function AdminUsers() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [rejecting, setRejecting] = useState<PendingUser | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await api.get("/v1/users");
      setUsers(res.data?.data ?? []);
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadPending = useCallback(async () => {
    setLoadingPending(true);
    try {
      const res = await api.get("/v1/auth/pending");
      setPending(res.data?.data ?? []);
    } catch {
      setPending([]);
    } finally {
      setLoadingPending(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadPending();
  }, [loadUsers, loadPending]);

  async function approve(p: PendingUser) {
    setBusyId(p.id);
    try {
      await api.post("/v1/auth/approve-user", { pending_user_id: p.id });
      setPending((prev) => prev.filter((x) => x.id !== p.id));
      loadUsers();
      showToast(`Account approved. ${p.full_name} can now sign in.`, "success");
    } catch {
      showToast("Could not approve request.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmReject() {
    if (!rejecting) return;
    setBusyId(rejecting.id);
    try {
      await api.post("/v1/auth/reject-user", {
        pending_user_id: rejecting.id,
        rejection_reason: rejectReason.trim() || undefined,
      });
      setPending((prev) => prev.filter((x) => x.id !== rejecting.id));
      showToast("Request rejected.", "info");
    } catch {
      showToast("Could not reject request.", "error");
    } finally {
      setBusyId(null);
      setRejecting(null);
      setRejectReason("");
    }
  }

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>User Management</h1>
          <div className="sub">
            {users.length} users · {users.filter((u) => u.is_active).length} active
          </div>
        </div>
        <button className="btn primary">+ Add User</button>
      </div>

      <div className="tabbar">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All Users<span className="count">{users.length}</span>
        </button>
        <button className={tab === "pending" ? "active" : ""} onClick={() => setTab("pending")}>
          Pending Requests<span className="count">{pending.length}</span>
        </button>
      </div>

      {tab === "all" ? (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="av" style={{ background: avatarColor(u.full_name) }}>
                          {initials(u.full_name)}
                        </div>
                        <div style={{ fontWeight: 500 }}>{u.full_name}</div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--text2)" }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>
                      {u.is_active ? (
                        <span className="badge green"><span className="dot" />Active</span>
                      ) : (
                        <span className="badge muted"><span className="dot" />Inactive</span>
                      )}
                    </td>
                    <td className="tiny">{timeAgo(u.last_login_at)}</td>
                    <td style={{ textAlign: "right" }}>
                      <button className="btn ghost sm">Edit</button>
                      <button className="btn ghost sm" style={{ color: u.is_active ? "var(--red)" : "var(--green)" }}>
                        {u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Requested</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingPending ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>
                    Loading pending requests…
                  </td>
                </tr>
              ) : pending.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}>
                    No pending requests.
                  </td>
                </tr>
              ) : (
                pending.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="av" style={{ background: avatarColor(p.full_name) }}>
                          {initials(p.full_name)}
                        </div>
                        <div style={{ fontWeight: 500 }}>{p.full_name}</div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--text2)" }}>{p.email}</td>
                    <td>{roleBadge(p.role)}</td>
                    <td className="tiny">{timeAgo(p.requested_at)}</td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn sm primary"
                        disabled={busyId === p.id}
                        onClick={() => approve(p)}
                      >
                        Approve
                      </button>
                      <button
                        className="btn sm"
                        disabled={busyId === p.id}
                        onClick={() => {
                          setRejecting(p);
                          setRejectReason("");
                        }}
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {rejecting && (
        <div className="modal-backdrop on" onClick={() => setRejecting(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-h">
              <h3>Reject {rejecting.full_name}?</h3>
              <button className="x-close" onClick={() => setRejecting(null)}>✕</button>
            </div>
            <div className="modal-b">
              <label className="field-label">Reason for rejection (optional)</label>
              <textarea
                className="textarea"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Shared with the requester in the rejection email…"
              />
            </div>
            <div className="modal-f">
              <button className="btn" onClick={() => setRejecting(null)}>Cancel</button>
              <button
                className="btn danger"
                disabled={busyId === rejecting.id}
                onClick={confirmReject}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
