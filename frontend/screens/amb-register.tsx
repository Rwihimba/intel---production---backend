"use client";

const defaultDate = new Date(Date.now() + 14 * 86400 * 1000).toISOString().slice(0, 10);

export function AmbRegister() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Register a new event</h1>
          <div className="sub">
            Add an event so attendees can be tracked toward your reach metrics
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div className="card" style={{ padding: "28px 32px" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <label className="field-label">Event Name</label>
              <input className="input" placeholder="e.g. FLA Open House — Kigali" />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input className="input" placeholder="Norrsken House, Kigali" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label className="field-label">Event Date</label>
                <input className="input" type="date" defaultValue={defaultDate} />
              </div>
              <div>
                <label className="field-label">Expected Attendance</label>
                <input className="input" type="number" defaultValue={50} min={0} />
              </div>
            </div>
            <div>
              <label className="field-label">Attendee Registration Link</label>
              <input className="input" placeholder="https://lu.ma/…" />
            </div>
            <div>
              <label className="field-label">
                Notes <span className="tiny" style={{ color: "var(--text3)" }}>(optional)</span>
              </label>
              <textarea className="textarea" placeholder="Any additional context for the ops team…" />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 8,
              }}
            >
              <button className="btn">Cancel</button>
              <button className="btn primary">Register Event</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
