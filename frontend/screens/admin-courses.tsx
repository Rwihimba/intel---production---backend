"use client";

import { useState } from "react";
import { PROGRAMS_BASE } from "@/lib/mock-data";

const DragHandle = (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <circle cx="9" cy="6" r="1.5" />
    <circle cx="9" cy="12" r="1.5" />
    <circle cx="9" cy="18" r="1.5" />
    <circle cx="15" cy="6" r="1.5" />
    <circle cx="15" cy="12" r="1.5" />
    <circle cx="15" cy="18" r="1.5" />
  </svg>
);

export function AdminCourses() {
  const [programCode, setProgramCode] = useState<"FA" | "FLA">("FA");
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const sel = PROGRAMS_BASE.find((p) => p.code === programCode)!;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Course Manager</h1>
          <div className="sub">
            Order courses within each program · Expand a course to manage its deliverables
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <label className="tiny">Program</label>
          <select
            className="select"
            style={{ width: 200 }}
            value={programCode}
            onChange={(e) => setProgramCode(e.target.value as "FA" | "FLA")}
          >
            {PROGRAMS_BASE.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>
          <button className="btn primary">+ Add Course</button>
        </div>
      </div>
      <div className="card">
        <div className="tiny" style={{ marginBottom: 14 }}>
          <span className="badge muted">
            {sel.courses.length} course{sel.courses.length === 1 ? "" : "s"}
          </span>{" "}
          · Drag the handle to reorder · Click the chevron to manage deliverables.
        </div>
        <div>
          {sel.courses.map((c, i) => {
            const exp = !!expanded[c.seq];
            return (
              <div key={c.seq}>
                <div className="course-row">
                  <span className="drag-h">{DragHandle}</span>
                  <div className="seq">{c.seq}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{c.name}</div>
                    <div className="tiny" style={{ marginTop: 3 }}>
                      {c.desc}
                    </div>
                  </div>
                  <span className="badge muted">
                    {c.deliverables.length} deliverable{c.deliverables.length === 1 ? "" : "s"}
                  </span>
                  <button className="btn ghost sm" title="Edit">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z" />
                    </svg>
                  </button>
                  <button className="btn ghost sm" title="Delete" style={{ color: "var(--red)" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                  </button>
                  <button
                    className={`chev${exp ? " open" : ""}`}
                    onClick={() => setExpanded({ ...expanded, [c.seq]: !exp })}
                  >
                    <svg viewBox="0 0 24 24">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {exp && (
                  <div className="dlv-panel">
                    <div className="dlv-head">
                      <span>Deliverables · {c.name}</span>
                      <span>
                        {c.deliverables.length} item{c.deliverables.length === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="dlv-list">
                      {c.deliverables.length === 0 ? (
                        <div className="dlv-empty">No deliverables yet — add the first one below.</div>
                      ) : (
                        c.deliverables.map((d, di) => (
                          <div key={d.seq} className="dlv-item">
                            <span className="drag-h">{DragHandle}</span>
                            <div className="dlv-seq">{di + 1}</div>
                            <div className="dlv-body">
                              <div className="dlv-name">{d.name}</div>
                              {d.desc && <div className="dlv-desc">{d.desc}</div>}
                            </div>
                            <button
                              className="btn ghost sm"
                              style={{ color: "var(--red)" }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <button className="btn" style={{ marginTop: 8 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Add Deliverable
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
