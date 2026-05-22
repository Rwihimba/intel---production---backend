import { SETTINGS_BASE } from "@/lib/mock-data";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

export function AdminSettings() {
  const s = SETTINGS_BASE;
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Settings</h1>
          <div className="sub">System-wide configuration · Saved settings apply on next dispatch run</div>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 760 }}>
        <div className="card-h">
          <div className="card-title">System Configuration</div>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="field-label">Organization Name</label>
              <input className="input" defaultValue={s.org} />
            </div>
            <div>
              <label className="field-label">Default Program</label>
              <select className="select" defaultValue={s.defaultProgram}>
                <option>FA</option>
                <option>FLA</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">Working Days</label>
            <div className="dow">
              {DAYS.map((d) => (
                <label key={d}>
                  <input type="checkbox" className="chk" defaultChecked={s.workingDays[d]} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label className="field-label">Daily Deal Cap per Agent</label>
              <input className="input" type="number" defaultValue={s.dealCap} min={0} max={100} />
            </div>
            <div>
              <label className="field-label">Max Follow-up Override Cap</label>
              <input className="input" type="number" defaultValue={s.followupCap} min={0} max={100} />
            </div>
            <div>
              <label className="field-label">Metric Alert Threshold (%)</label>
              <input className="input" type="number" defaultValue={s.alertThreshold} min={0} max={100} />
            </div>
          </div>
          <div>
            <label className="field-label">Timezone</label>
            <select className="select" style={{ maxWidth: 300 }} defaultValue={s.timezone}>
              {["Africa/Kigali", "Africa/Lagos", "Africa/Nairobi", "Africa/Cairo", "Europe/London", "UTC"].map(
                (tz) => (
                  <option key={tz}>{tz}</option>
                )
              )}
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 6 }}>
            <button className="btn">Cancel</button>
            <button className="btn primary">Save Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
