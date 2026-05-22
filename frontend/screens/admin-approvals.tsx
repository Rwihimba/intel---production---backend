"use client";

import { Fragment, useState } from "react";
import {
  PENDING_APPROVALS_BASE,
  PROGRAMS_BASE,
  type PendingApproval,
  avatarColor,
  dealTypeClass,
  dealTypeLabel,
  initials,
  LEARNERS,
} from "@/lib/mock-data";

type Tab = "all" | "payments" | "activations" | "graduations";

function filterTab(items: PendingApproval[], tab: Tab) {
  if (tab === "all") return items;
  if (tab === "payments") return items.filter((p) => p.type === "conversion" || p.type === "followup");
  if (tab === "activations") return items.filter((p) => p.type === "activation");
  return items.filter((p) => p.type === "course-grad" || p.type === "grad-push");
}

function ProgramBadge({ p }: { p: string }) {
  return <span className={`pchip ${p}`}>{p}</span>;
}

function dealDeliverablesView(p: PendingApproval) {
  if (!["activation", "course-grad", "grad-push"].includes(p.type)) return null;
  const program = PROGRAMS_BASE.find((pr) => pr.code === p.program);
  if (!program) return null;
  const course = p.course
    ? program.courses.find((c) => c.name === p.course)
    : program.courses[0];
  if (!course) return null;
  const all = (course.deliverables || []).map((d) => d.name);
  const done = p.deliverablesDone ?? all;
  return { courseName: course.name, all, done, partial: done.length < all.length };
}

export function AdminApprovals() {
  const [tab, setTab] = useState<Tab>("all");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const all = PENDING_APPROVALS_BASE;
  const filtered = filterTab(all, tab);

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>
            Pending Approvals{" "}
            <span style={{ color: "var(--text3)", fontWeight: 500 }}>({all.length})</span>
          </h1>
          <div className="sub">
            Review claimed outcomes and deliverable completion before they count toward agent KPIs
          </div>
        </div>
      </div>
      <div className="tabbar">
        <button className={tab === "all" ? "active" : ""} onClick={() => setTab("all")}>
          All<span className="count">{all.length}</span>
        </button>
        <button className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}>
          Payments
          <span className="count">{all.filter((p) => p.type === "conversion" || p.type === "followup").length}</span>
        </button>
        <button className={tab === "activations" ? "active" : ""} onClick={() => setTab("activations")}>
          Activations<span className="count">{all.filter((p) => p.type === "activation").length}</span>
        </button>
        <button className={tab === "graduations" ? "active" : ""} onClick={() => setTab("graduations")}>
          Graduations
          <span className="count">{all.filter((p) => p.type === "course-grad" || p.type === "grad-push").length}</span>
        </button>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 30 }}></th>
                <th>Agent</th>
                <th>Learner</th>
                <th>Email</th>
                <th>Program</th>
                <th>Deal Type</th>
                <th>
                  Initial Course to Verify
                  <div className="tiny" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginTop: 2, color: "var(--text3)" }}>
                    Check LMS before approval
                  </div>
                </th>
                <th>Claimed Outcome</th>
                <th>Submitted</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const learner = LEARNERS.find((l) => l.name === p.learner);
                const isConv = p.type === "conversion" || p.type === "followup";
                const dlv = dealDeliverablesView(p);
                const isDlv = !!dlv;
                const isPartial = !!(dlv && dlv.partial);
                const exp = !!expanded[i];
                return (
                  <Fragment key={i}>
                    <tr className={isDlv ? "row-clickable" : ""}>
                      <td>
                        {isDlv && (
                          <button
                            className={`chev${exp ? " open" : ""}`}
                            onClick={() => setExpanded({ ...expanded, [i]: !exp })}
                            title={exp ? "Collapse" : "Expand"}
                          >
                            <svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" /></svg>
                          </button>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div className="av" style={{ background: avatarColor(p.agent) }}>
                            {initials(p.agent)}
                          </div>
                          <div style={{ fontWeight: 500 }}>{p.agent}</div>
                        </div>
                      </td>
                      <td>{p.learner}</td>
                      <td>
                        <a
                          href={`mailto:${learner?.email ?? ""}`}
                          className="mono"
                          style={{
                            fontSize: 12,
                            color: "var(--text2)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                          }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="M3 7l9 6 9-6" />
                          </svg>
                          {learner?.email ?? "—"}
                        </a>
                      </td>
                      <td><ProgramBadge p={p.program} /></td>
                      <td>
                        <span className={`dt ${dealTypeClass(p.type)}`}>{dealTypeLabel(p.type)}</span>
                        {isDlv && (
                          <span
                            className={`badge ${isPartial ? "amber" : "green"}`}
                            style={{ marginLeft: 6 }}
                          >
                            <span className="dot" />
                            {isPartial ? "Partial Completion" : "All Deliverables Done"}
                          </span>
                        )}
                      </td>
                      <td>
                        {isConv ? (
                          <span className="badge muted" style={{ fontFamily: "var(--font-dm-sans), sans-serif", fontWeight: 500 }}>
                            {PROGRAMS_BASE.find((pr) => pr.code === p.program)?.courses[0]?.name ?? "—"}
                          </span>
                        ) : isDlv ? (
                          <span className="tiny" style={{ color: "var(--text2)" }}>{dlv!.courseName}</span>
                        ) : (
                          <span className="tiny" style={{ color: "var(--text3)" }}>—</span>
                        )}
                      </td>
                      <td>
                        {isDlv ? (
                          <span className="tiny" style={{ color: "var(--text2)" }}>
                            {dlv!.done.length}/{dlv!.all.length} deliverables
                          </span>
                        ) : (
                          <span className="badge teal">{p.outcome}</span>
                        )}
                      </td>
                      <td className="tiny">{p.ago} ago</td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          className={isPartial ? "btn sm" : "btn sm primary"}
                          style={isPartial ? { background: "var(--amber)", color: "#fff", borderColor: "var(--amber)" } : undefined}
                        >
                          {isPartial ? "Approve Partial" : "✓ Approve"}
                        </button>
                        <button className="btn sm">✗ Reject</button>
                      </td>
                    </tr>
                    {isDlv && exp && (
                      <tr>
                        <td colSpan={10} style={{ background: "var(--surface2)", padding: "18px 22px" }}>
                          <div className="side-label" style={{ padding: "0 0 8px" }}>
                            Deliverables reported by agent · {dlv!.courseName}
                          </div>
                          <div className="dlv-readonly">
                            {dlv!.all.map((name) => {
                              const done = dlv!.done.includes(name);
                              return (
                                <div key={name} className="dlv-r-row">
                                  <span className={`dlv-r-icon ${done ? "done" : "miss"}`}>
                                    {done && (
                                      <svg viewBox="0 0 24 24">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </span>
                                  <span className={`dlv-r-name${done ? "" : " miss"}`}>{name}</span>
                                  <span
                                    className="tiny"
                                    style={{ color: done ? "var(--green)" : "var(--text3)" }}
                                  >
                                    {done ? "Completed" : "Not completed"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 13,
                              color: isPartial ? "var(--amber)" : "var(--green)",
                              fontWeight: 500,
                            }}
                          >
                            {dlv!.done.length} of {dlv!.all.length} deliverables confirmed by agent
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
