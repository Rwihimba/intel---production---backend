"use client";

import { useState } from "react";
import { LEARNERS, type Learner, avatarColor, initials } from "@/lib/mock-data";

const TABS = [
  { key: "cold", label: "Cold Leads", filter: (l: Learner) => l.status === "Cold Lead" },
  { key: "unpaid", label: "Enrolled — Unpaid", filter: (l: Learner) => l.status === "Enrolled Unpaid" },
  { key: "paid", label: "Paid", filter: (l: Learner) => l.paid },
  { key: "risk", label: "Payment at Risk", filter: (l: Learner) => l.risk },
  { key: "active", label: "Active", filter: (l: Learner) => l.status === "Active" },
  { key: "pending", label: "Pending Graduation", filter: (l: Learner) => l.status === "Pending Graduation" },
  { key: "grad", label: "Graduates", filter: (l: Learner) => l.status === "Graduate" },
] as const;

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

function statusBadge(l: Learner) {
  if (l.status === "Active") return <span className="badge teal">Active</span>;
  if (l.status === "Cold Lead") return <span className="badge muted">Cold</span>;
  if (l.status === "Enrolled Unpaid") return <span className="badge amber">Unpaid</span>;
  if (l.status === "Payment at Risk") return <span className="badge red">At Risk</span>;
  if (l.status === "Pending Graduation") return <span className="badge blue">Pending Grad</span>;
  if (l.status === "Graduate") return <span className="badge green">Graduate</span>;
  return <span className="badge">{l.status}</span>;
}

export function AdminLearners() {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("cold");
  const [q, setQ] = useState("");
  const activeTab = TABS.find((t) => t.key === tab)!;
  const hasExtra = ["risk", "active", "pending", "grad"].includes(tab);

  const all = LEARNERS.filter(activeTab.filter);
  const filtered = all.filter(
    (l) =>
      !q ||
      l.name.toLowerCase().includes(q.toLowerCase()) ||
      l.email.toLowerCase().includes(q.toLowerCase()) ||
      l.phone.includes(q)
  );

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Learners</h1>
          <div className="sub">
            {all.length} {activeTab.label.toLowerCase()} across both programs
          </div>
        </div>
      </div>
      <div className="tabbar">
        {TABS.map((t) => (
          <button key={t.key} className={t.key === tab ? "active" : ""} onClick={() => setTab(t.key)}>
            {t.label}
            <span className="count">{LEARNERS.filter(t.filter).length}</span>
          </button>
        ))}
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div
          style={{
            padding: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div className="search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
              <input
                className="input"
                placeholder="Search by name, email, or phone…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select className="select" style={{ width: 130 }} defaultValue="Both">
              <option value="Both">All programs</option>
              <option value="FA">FA</option>
              <option value="FLA">FLA</option>
            </select>
          </div>
          <button className="btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            Export CSV
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}>
                  <input type="checkbox" className="chk" />
                </th>
                <th className="sortable">Learner<span className="arrow" /></th>
                <th>Email</th>
                <th>Program</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="sortable">Last Contact<span className="arrow" /></th>
                {hasExtra && (
                  <>
                    <th>Health</th>
                    <th>Current Course</th>
                    <th>Last Day of Contact</th>
                    <th>Duration on Course</th>
                  </>
                )}
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasExtra ? 12 : 8}
                    style={{ textAlign: "center", padding: 30, color: "var(--text3)" }}
                  >
                    No learners match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => (
                  <tr key={l.email} className="row-clickable">
                    <td>
                      <input type="checkbox" className="chk" onClick={(e) => e.stopPropagation()} />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="av" style={{ background: avatarColor(l.name) }}>
                          {initials(l.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{l.name}</div>
                          <div className="tiny">{l.country}</div>
                        </div>
                      </div>
                    </td>
                    <td className="mono" style={{ fontSize: 12, color: "var(--text2)" }}>{l.email}</td>
                    <td><ProgramBadge p={l.program} /></td>
                    <td className="mono" style={{ fontSize: 12 }}>{l.phone}</td>
                    <td>{statusBadge(l)}</td>
                    <td className="muted" style={{ fontSize: 12 }}>{l.lastContact}</td>
                    {hasExtra && (
                      <>
                        <td>
                          {["Active", "Pending Graduation", "Graduate"].includes(l.status) ? (
                            <span className="badge green"><span className="dot" />Active</span>
                          ) : (
                            <span className="badge red"><span className="dot" />Not Active</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: 12 }}>
                            {l.status === "Graduate" ? "—" : `Course ${Math.max(1, l.progress + 1)}`}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: "var(--text2)" }}>{l.lastContact}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: 12, color: "var(--text2)" }}>{l.progress * 8 + 12} days</span>
                        </td>
                      </>
                    )}
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button className="btn ghost sm" title="WhatsApp">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M21 11.5a8.4 8.4 0 0 1-8.4 8.4 8.4 8.4 0 0 1-4.3-1.2L3 20l1.4-5a8.4 8.4 0 1 1 16.6-3.5z" />
                        </svg>
                      </button>
                      <button className="btn ghost sm" title="Open">
                        →
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="paginate">
          <div>Showing 1-{Math.min(filtered.length, 8)} of {filtered.length}</div>
          <div className="controls">
            <button className="btn sm" disabled>← Prev</button>
            <span className="mono" style={{ fontSize: 12, padding: "0 6px", color: "var(--text2)" }}>
              1 / {Math.max(1, Math.ceil(filtered.length / 8))}
            </span>
            <button className="btn sm">Next →</button>
          </div>
        </div>
      </div>
    </div>
  );
}
