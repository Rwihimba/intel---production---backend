import { BarChart } from "@/components/bar-chart";
import { LineChart } from "@/components/line-chart";

const WEEKLY = [22, 28, 24, 30, 26, 21, 18];
const MONTHLY_PCT = [52, 58, 61, 64];

const CARDS = [
  { label: "Deals Assigned", value: "340", sub: "This month" },
  { label: "Attempted", value: "258", sub: "76% attempt rate" },
  { label: "Successful", value: "157", sub: "61% success rate" },
  { label: "Total Value", value: "RWF 47,500", sub: "Lifetime earned" },
];

export function AgentPerf() {
  return (
    <div className="page">
      <div className="page-h">
        <div>
          <h1>Performance Summary</h1>
          <div className="sub">Month-to-date · Kalisa Eric</div>
        </div>
      </div>
      <div className="four-col" style={{ marginBottom: 16 }}>
        {CARDS.map((c) => (
          <div key={c.label} className="kpi">
            <div className="label">{c.label}</div>
            <div className="value">{c.value}</div>
            <div className="tiny" style={{ marginTop: 6 }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Deals attempted · this week</div>
              <div className="card-sub">Target line at 30 / day</div>
            </div>
          </div>
          <BarChart
            values={WEEKLY}
            labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
            target={30}
            yMax={40}
          />
        </div>
        <div className="card">
          <div className="card-h">
            <div>
              <div className="card-title">Success rate · last 4 weeks</div>
              <div className="card-sub">Trending upward</div>
            </div>
          </div>
          <LineChart
            series={[{ label: "Success rate", color: "var(--teal)", values: MONTHLY_PCT }]}
            labels={["W17", "W18", "W19", "W20"]}
            yMax={80}
          />
        </div>
      </div>
    </div>
  );
}
