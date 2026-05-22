import { BarChart } from "@/components/bar-chart";
import { EVENTS_BASE } from "@/lib/mock-data";

const WEEKLY = [4, 6, 5, 7];

export function AmbPerf() {
  const completed = EVENTS_BASE.filter((e) => e.actual != null) as Array<typeof EVENTS_BASE[number] & { actual: number }>;
  const total = completed.reduce((s, e) => s + e.actual, 0);
  const avg = completed.length ? Math.round(total / completed.length) : 0;

  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Performance Summary</h1>
          <div className="sub">Diane Mutesi · Month-to-date</div>
        </div>
      </div>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">Deals Attempted</div>
          <div className="value">22</div>
          <div className="tiny" style={{ marginTop: 6 }}>of 30 assigned</div>
        </div>
        <div className="kpi">
          <div className="label">Successful</div>
          <div className="value">9</div>
          <div className="tiny" style={{ marginTop: 6 }}>41% conversion</div>
        </div>
        <div className="kpi">
          <div className="label">Attempt Rate</div>
          <div className="value">73%</div>
          <div className="tiny" style={{ marginTop: 6 }}>Goal: 80%</div>
        </div>
        <div className="kpi">
          <div className="label">Events Organised</div>
          <div className="value">3</div>
          <div className="tiny" style={{ marginTop: 6 }}>This quarter</div>
        </div>
      </div>
      <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 16 }}>
        <div className="kpi">
          <div className="label">Total Attendance</div>
          <div className="value">{total}</div>
          <div className="tiny" style={{ marginTop: 6 }}>across completed events</div>
        </div>
        <div className="kpi">
          <div className="label">Avg Attendance / Event</div>
          <div className="value">{avg}</div>
          <div className="tiny" style={{ marginTop: 6 }}>per event</div>
        </div>
        <div className="kpi">
          <div className="label">Learners Reached</div>
          <div className="value">140</div>
          <div className="tiny" style={{ marginTop: 6 }}>Total network</div>
        </div>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Deals per week · last 4 weeks</div>
              <div className="card-sub">Trending upward</div>
            </div>
          </div>
          <BarChart values={WEEKLY} labels={["W17", "W18", "W19", "W20"]} yMax={10} />
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Events timeline</div>
              <div className="card-sub">Attendance dot size reflects turnout</div>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "18px 0",
              overflowX: "auto",
            }}
          >
            {[...EVENTS_BASE].reverse().map((ev) => {
              const v = ev.actual ?? ev.expected;
              const size = Math.max(12, Math.min(40, v / 3));
              const color =
                ev.status === "Upcoming"
                  ? "var(--blue)"
                  : ev.actual != null && ev.actual >= ev.expected
                  ? "var(--green)"
                  : "var(--amber)";
              return (
                <div
                  key={ev.name}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 6,
                    minWidth: 90,
                  }}
                >
                  <div
                    style={{
                      width: size,
                      height: size,
                      borderRadius: "50%",
                      background: color,
                      opacity: 0.85,
                    }}
                    title={`${ev.name} · ${v}`}
                  />
                  <div
                    className="tiny"
                    style={{ textAlign: "center", lineHeight: 1.3 }}
                  >
                    {ev.date.slice(5)}
                    <br />
                    <span style={{ color: "var(--text)" }}>{v}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
