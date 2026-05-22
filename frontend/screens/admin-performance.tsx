"use client";

import { useState } from "react";
import { Sparkline } from "@/components/sparkline";
import { AGENTS_DATA, AMBASSADORS_DATA, avatarColor, initials } from "@/lib/mock-data";

const Trophy = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--amber)" style={{ verticalAlign: -2 }}>
    <path d="M19 5h-2V3H7v2H5a2 2 0 0 0-2 2v2a4 4 0 0 0 4 4 6 6 0 0 0 4 5v2H8v2h8v-2h-3v-2a6 6 0 0 0 4-5 4 4 0 0 0 4-4V7a2 2 0 0 0-2-2zM5 9V7h2v4a2 2 0 0 1-2-2zm14 0a2 2 0 0 1-2 2V7h2v2z" />
  </svg>
);

export function AdminPerformance() {
  const [tab, setTab] = useState<"agents" | "ambassadors">("agents");

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Performance Dashboard</h1>
          <div className="sub">
            Team leaderboard · {tab === "agents" ? "Conversion agents" : "Campus ambassadors"}
          </div>
        </div>
        <div className="tabbar" style={{ marginBottom: 0 }}>
          <button className={tab === "agents" ? "active" : ""} onClick={() => setTab("agents")}>
            Agents <span className="count">{AGENTS_DATA.length}</span>
          </button>
          <button className={tab === "ambassadors" ? "active" : ""} onClick={() => setTab("ambassadors")}>
            Ambassadors <span className="count">{AMBASSADORS_DATA.length}</span>
          </button>
        </div>
      </div>
      <div className="date-range">
        <span className="dr-lbl">Viewing data from</span>
        <input type="date" defaultValue="2026-04-19" />
        <span className="dr-sep">to</span>
        <input type="date" defaultValue="2026-05-19" />
        <div className="dr-quick">
          {[["7d", "Last 7d"], ["30d", "Last 30d"], ["90d", "Last 90d"], ["ytd", "YTD"]].map(([k, l]) => (
            <button key={k} className={k === "30d" ? "active" : ""}>
              {l}
            </button>
          ))}
        </div>
      </div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              {tab === "agents" ? (
                <>
                  <th style={{ width: 50 }}>Rank</th>
                  <th>Name</th>
                  <th>Deals Attempted</th>
                  <th>Successful</th>
                  <th style={{ minWidth: 140 }}>Success Rate</th>
                  <th>Value Created</th>
                  <th>Trend</th>
                  <th></th>
                </>
              ) : (
                <>
                  <th style={{ width: 50 }}>Rank</th>
                  <th>Name</th>
                  <th>Deals Attempted</th>
                  <th>Successful</th>
                  <th>Events Created</th>
                  <th>Avg Attendance</th>
                  <th>Total Reach</th>
                  <th>Trend</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {tab === "agents"
              ? AGENTS_DATA.map((a, i) => (
                  <tr key={a.name} className={`row-clickable${i === 0 ? " top-row" : ""}`}>
                    <td>
                      <span className="mono" style={{ fontWeight: 500 }}>
                        {i + 1}
                      </span>{" "}
                      {i === 0 ? Trophy : null}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="av" style={{ background: avatarColor(a.name) }}>
                          {initials(a.name)}
                        </div>
                        <div style={{ fontWeight: 500 }}>{a.name}</div>
                      </div>
                    </td>
                    <td className="mono">{a.attempted}</td>
                    <td className="mono">{a.success}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div className="progress thin" style={{ flex: 1, maxWidth: 110 }}>
                          <i
                            style={{
                              width: `${a.rate * 100}%`,
                              background: a.rate >= 0.55 ? "var(--green)" : a.rate >= 0.45 ? "var(--amber)" : "var(--red)",
                            }}
                          />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {Math.round(a.rate * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="mono">RWF {a.value.toLocaleString()}</td>
                    <td>
                      <Sparkline values={a.trend} color="var(--teal)" w={80} h={24} />
                    </td>
                    <td style={{ textAlign: "right", color: "var(--text3)" }}>▾</td>
                  </tr>
                ))
              : AMBASSADORS_DATA.map((a, i) => (
                  <tr key={a.name} className={i === 0 ? "top-row" : ""}>
                    <td>
                      <span className="mono" style={{ fontWeight: 500 }}>
                        {i + 1}
                      </span>{" "}
                      {i === 0 ? Trophy : null}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div className="av" style={{ background: avatarColor(a.name) }}>
                          {initials(a.name)}
                        </div>
                        <div style={{ fontWeight: 500 }}>{a.name}</div>
                      </div>
                    </td>
                    <td className="mono">{a.attempted}</td>
                    <td className="mono">{a.success}</td>
                    <td className="mono">{a.events}</td>
                    <td className="mono">{a.attendance}</td>
                    <td className="mono">{a.reach}</td>
                    <td>
                      <Sparkline values={[1, 2, 2, 3, 2, 3, a.events + 1]} color="var(--blue)" w={80} h={24} />
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
