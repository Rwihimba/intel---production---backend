"use client";

import { useMemo, useState } from "react";
import {
  AGENTS_DATA,
  PROGRAMS_BASE,
  avatarColor,
  initials,
} from "@/lib/mock-data";

const DEAL_MIX_TYPES = [
  { key: "conversion", label: "Conversion", sub: "Cold → paid enrolment", color: "var(--blue)", badgeCls: "conversion" },
  { key: "activation", label: "Activation", sub: "First-course completion", color: "var(--teal)", badgeCls: "activation" },
  { key: "gradPush", label: "Graduation Push / Deliverable", sub: "Capstone & deliverable submission", color: "var(--amber)", badgeCls: "grad-push" },
  { key: "retention", label: "Retention", sub: "Re-engage at-risk learners", color: "var(--red)", badgeCls: "retention" },
] as const;

const DEFAULT_MIX = { conversion: 40, activation: 25, gradPush: 20, retention: 15 };

export function AdminDistribution() {
  const [program, setProgram] = useState<"FA" | "FLA" | "Both">("Both");
  const [mix, setMix] = useState<Record<string, number>>({ ...DEFAULT_MIX });
  const [agentDeals, setAgentDeals] = useState<number[]>(
    AGENTS_DATA.map((a) => a.assigned)
  );
  const [courses, setCourses] = useState<Record<string, string[]>>(() => {
    const out: Record<string, string[]> = {};
    PROGRAMS_BASE.forEach((p) => (out[p.code] = p.courses.map((c) => c.name)));
    return out;
  });

  const total = agentDeals.reduce((s, n) => s + n, 0);
  const mixTotal = DEAL_MIX_TYPES.reduce((s, t) => s + (mix[t.key] || 0), 0);
  const mixOk = mixTotal === 100;
  const programsInScope = program === "Both"
    ? PROGRAMS_BASE
    : PROGRAMS_BASE.filter((p) => p.code === program);

  function toggleCourse(prog: string, name: string) {
    setCourses((prev) => {
      const list = prev[prog] ?? [];
      const next = list.includes(name) ? list.filter((n) => n !== name) : [...list, name];
      return { ...prev, [prog]: next };
    });
  }

  function toggleAllCourses(prog: string, on: boolean) {
    const p = PROGRAMS_BASE.find((x) => x.code === prog);
    if (!p) return;
    setCourses((prev) => ({
      ...prev,
      [prog]: on ? p.courses.map((c) => c.name) : [],
    }));
  }

  const programBadgeColor = program === "Both" ? "teal" : program === "FA" ? "blue" : "green";

  return (
    <div className="page">
      <style>{`
        .dist-card-head{padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
        .dist-scope-body{padding:16px 18px;display:grid;grid-template-columns:240px 1fr;gap:24px}
        @media(max-width:900px){.dist-scope-body{grid-template-columns:1fr}}
        .dist-prog-toggle{display:flex;flex-direction:column;gap:6px}
        .dist-prog-toggle button{
          text-align:left;background:var(--surface);border:1px solid var(--border);
          padding:10px 12px;border-radius:8px;font-size:13px;font-weight:500;color:var(--text2);
          transition:all 0.12s;
        }
        .dist-prog-toggle button:hover{background:var(--surface2);color:var(--text)}
        .dist-prog-toggle button.active{
          background:var(--teal-bg);color:var(--teal);
          border-color:#CDE9E5;box-shadow:inset 2px 0 0 var(--teal);
        }
        .dist-course-group + .dist-course-group{margin-top:16px}
        .dist-course-head{display:flex;align-items:center;gap:10px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border)}
        .dist-course-rows{display:flex;flex-direction:column;gap:4px}
        .dist-course-row{
          display:flex;align-items:center;gap:10px;
          padding:8px 10px;border-radius:8px;cursor:pointer;
          transition:background 0.1s;font-size:13px;
        }
        .dist-course-row:hover{background:var(--surface2)}
        .dist-course-row.all-row{background:var(--surface2);font-size:12px;color:var(--text2)}
        .dist-course-seq{
          font-size:10px;font-weight:500;
          background:var(--surface2);color:var(--text2);
          padding:2px 6px;border-radius:5px;
        }
        .dist-course-name{flex:1}
        .dist-mix-row{
          display:grid;grid-template-columns:240px 1fr 60px 100px;gap:18px;align-items:center;
          padding:14px 0;border-bottom:1px solid var(--border);
        }
        .dist-mix-row:last-child{border-bottom:0}
        .dist-mix-pct{text-align:right;font-size:15px;font-weight:500}
        .dist-mix-deals{text-align:right}
        .dist-mix-total{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;}
        .dist-mix-total.ok{background:var(--green-bg);color:var(--green)}
        .dist-mix-total.warn{background:var(--amber-bg);color:var(--amber)}
        .dist-mix-total .dot{width:8px;height:8px;border-radius:50%;background:currentColor}
      `}</style>

      <div className="page-h">
        <div>
          <h1>Deal Distribution</h1>
          <div className="sub">
            Set the daily pool: program scope, course coverage, deal-type mix, then per-agent counts
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn">Reset to defaults</button>
          <button className="btn primary">Lock Distribution</button>
        </div>
      </div>

      <div className="three-col" style={{ marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">Total dispatched today</div>
          <div className="value">{total}</div>
          <div className="tiny" style={{ marginTop: 6 }}>Across {AGENTS_DATA.length} active agents</div>
        </div>
        <div className="kpi">
          <div className="label">Avg per agent</div>
          <div className="value">{Math.round(total / AGENTS_DATA.length)}</div>
          <div className="tiny" style={{ marginTop: 6 }}>Target average: 28</div>
        </div>
        <div className="kpi">
          <div className="label">Cap per agent</div>
          <div className="value">35</div>
          <div className="tiny" style={{ marginTop: 6 }}>Override max from settings</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 14 }}>
        <div className="dist-card-head">
          <div>
            <div className="card-title">Distribution scope</div>
            <div className="card-sub">Which programs &amp; courses feed today&apos;s queue</div>
          </div>
          <span className={`badge ${programBadgeColor}`}>
            {program === "Both" ? "Both programs" : program === "FA" ? "Founders Academy" : "Freelancer Academy"}
          </span>
        </div>
        <div className="dist-scope-body">
          <div>
            <div className="side-label" style={{ padding: "0 0 8px" }}>Program</div>
            <div className="dist-prog-toggle">
              {(["FA", "FLA", "Both"] as const).map((p) => (
                <button key={p} className={program === p ? "active" : ""} onClick={() => setProgram(p)}>
                  {p === "Both" ? "Both programs" : p === "FA" ? "Founders Academy" : "Freelancer Academy"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="side-label" style={{ padding: "0 0 8px" }}>Courses to include</div>
            <div>
              {programsInScope.map((p) => {
                const selected = courses[p.code] ?? [];
                const allOn = selected.length === p.courses.length;
                return (
                  <div key={p.code} className="dist-course-group">
                    <div className="dist-course-head">
                      <span className={`pchip ${p.code}`}>{p.code}</span>
                      <span style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</span>
                      <span className="tiny" style={{ marginLeft: "auto" }}>
                        {selected.length}/{p.courses.length} courses included
                      </span>
                    </div>
                    <div className="dist-course-rows">
                      <label className="dist-course-row all-row">
                        <input
                          type="checkbox"
                          className="chk"
                          checked={allOn}
                          onChange={(e) => toggleAllCourses(p.code, e.target.checked)}
                        />
                        <span style={{ fontWeight: 500 }}>All courses</span>
                      </label>
                      {p.courses.map((c) => (
                        <label key={c.seq} className="dist-course-row">
                          <input
                            type="checkbox"
                            className="chk"
                            checked={selected.includes(c.name)}
                            onChange={() => toggleCourse(p.code, c.name)}
                          />
                          <span className="dist-course-seq mono">C{c.seq}</span>
                          <span className="dist-course-name">{c.name}</span>
                          <span className="tiny" style={{ marginLeft: "auto", color: "var(--text3)" }}>
                            {c.deliverables.length} deliverable{c.deliverables.length === 1 ? "" : "s"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, marginBottom: 14 }}>
        <div className="dist-card-head">
          <div>
            <div className="card-title">Deal-type mix</div>
            <div className="card-sub">Percentage of the daily pool allocated to each deal type · must total 100%</div>
          </div>
          <div className={`dist-mix-total ${mixOk ? "ok" : "warn"}`}>
            <span className="dot" />
            <span>Total: {mixTotal}%</span>
          </div>
        </div>
        <div style={{ padding: "6px 18px 14px" }}>
          {DEAL_MIX_TYPES.map((t) => {
            const pct = mix[t.key] ?? 0;
            return (
              <div key={t.key} className="dist-mix-row">
                <div>
                  <span className={`dt ${t.badgeCls}`}>{t.label}</span>
                  <div className="tiny" style={{ marginTop: 4 }}>{t.sub}</div>
                </div>
                <div>
                  <input
                    type="range"
                    className="slider"
                    min={0}
                    max={100}
                    step={5}
                    value={pct}
                    onChange={(e) => setMix({ ...mix, [t.key]: parseInt(e.target.value, 10) })}
                  />
                </div>
                <div className="dist-mix-pct">
                  <span className="mono" style={{ color: t.color }}>{pct}%</span>
                </div>
                <div className="dist-mix-deals">
                  <div className="mono" style={{ fontWeight: 500, fontSize: 14 }}>
                    {Math.round(total * (pct / 100))}
                  </div>
                  <div className="tiny">deals/day</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="dist-card-head">
          <div>
            <div className="card-title">Per-agent allocation</div>
            <div className="card-sub">
              Drag slider to adjust daily deal count (0–35) · numbers cascade into the mix above
            </div>
          </div>
          <span className="tiny">{AGENTS_DATA.length} active agents</span>
        </div>
        <div style={{ padding: "8px 6px" }}>
          {AGENTS_DATA.map((a, i) => (
            <div
              key={a.name}
              style={{
                display: "grid",
                gridTemplateColumns: "1.4fr 2.5fr 60px 90px",
                gap: 18,
                alignItems: "center",
                padding: "12px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className="av" style={{ background: avatarColor(a.name) }}>
                  {initials(a.name)}
                </div>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 13 }}>{a.name}</div>
                  <div className="tiny">Success rate {Math.round(a.rate * 100)}%</div>
                </div>
              </div>
              <div>
                <input
                  type="range"
                  className="slider"
                  min={0}
                  max={35}
                  value={agentDeals[i]}
                  onChange={(e) => {
                    const next = [...agentDeals];
                    next[i] = parseInt(e.target.value, 10);
                    setAgentDeals(next);
                  }}
                />
              </div>
              <div className="mono" style={{ fontWeight: 500, fontSize: 15, textAlign: "right" }}>
                {agentDeals[i]}
              </div>
              <div className="tiny" style={{ textAlign: "right" }}>deals/day</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
