import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";

// ── DATA ──────────────────────────────────────────────────────────────────────

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Shipments", icon: "◈", path: "/shipments"  },
  { label: "Tracking",  icon: "◎", path: "/tracking"   },
  { label: "Analytics", icon: "◧", path: "/analytics"  },
  { label: "Settings",  icon: "⊕", path: "/settings"   },
];

const KPIS = [
  { label: "Total Shipments",  value: "4,821",  delta: "+18%", trend: "up",   icon: "◈", accent: "#c84b2f" },
  { label: "On-Time Rate",     value: "94.2%",  delta: "+2.1%",trend: "up",   icon: "✓", accent: "#2d7a4f" },
  { label: "Avg. Cost / Ship", value: "$87.40", delta: "-$3.2",trend: "up",   icon: "⬡", accent: "#3a3f5c" },
  { label: "Exception Rate",   value: "1.3%",   delta: "-0.4%",trend: "up",   icon: "⚠", accent: "#b07d2a" },
];

const MONTHLY_BARS = [
  { month: "Sep", delivered: 280, transit: 320, pending: 40 },
  { month: "Oct", delivered: 310, transit: 290, pending: 55 },
  { month: "Nov", delivered: 420, transit: 380, pending: 48 },
  { month: "Dec", delivered: 510, transit: 440, pending: 62 },
  { month: "Jan", delivered: 390, transit: 360, pending: 50 },
  { month: "Feb", delivered: 460, transit: 410, pending: 44 },
  { month: "Mar", delivered: 348, transit: 836, pending: 97 },
];

const CARRIERS = [
  { name: "DHL Express",   pct: 44, count: "2,121", color: "#c84b2f" },
  { name: "FedEx Intl.",   pct: 32, count: "1,543", color: "#3a3f5c" },
  { name: "UPS Worldwide", pct: 24, count: "1,157", color: "#b07d2a" },
];

const TOP_ROUTES = [
  { rank: 1, name: "Lagos → London",    value: "412", pct: 100 },
  { rank: 2, name: "Lagos → New York",  value: "308", pct: 75  },
  { rank: 3, name: "Abuja → Dubai",     value: "241", pct: 58  },
  { rank: 4, name: "Kano → Paris",      value: "198", pct: 48  },
  { rank: 5, name: "PH → Amsterdam",    value: "154", pct: 37  },
];

// 7 weeks × 7 days heatmap data (0–4 intensity)
const HEATMAP = [
  [0,1,2,1,0,0,0],
  [1,2,3,2,1,0,0],
  [2,3,4,3,2,1,0],
  [1,2,3,4,3,2,1],
  [0,1,2,3,2,1,0],
  [0,0,1,2,1,0,0],
  [0,0,0,1,0,0,0],
];

const DAYS = ["M","T","W","T","F","S","S"];

// Line chart: revenue last 12 weeks
const REVENUE_POINTS = [42, 55, 48, 61, 58, 70, 65, 78, 72, 85, 80, 94];

// ── HELPERS ──────────────────────────────────────────────────────────────────

function maxVal(arr, keys) {
  return Math.max(...arr.map(d => keys.reduce((s, k) => s + d[k], 0)));
}

// ── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function BarChart() {
  const mx = maxVal(MONTHLY_BARS, ["delivered", "transit", "pending"]);
  return (
    <div className="panel-body">
      <div className="bar-chart">
        {MONTHLY_BARS.map(d => {
          const total = d.delivered + d.transit + d.pending;
          const h = n => `${(n / mx) * 130}px`;
          return (
            <div key={d.month} className="bar-col">
              <div className="bar-wrap">
                <div className="bar pending"    style={{ height: h(d.pending),   width: "28%" }} title={`Pending: ${d.pending}`} />
                <div className="bar in-transit" style={{ height: h(d.transit),   width: "28%" }} title={`In Transit: ${d.transit}`} />
                <div className="bar delivered"  style={{ height: h(d.delivered), width: "28%" }} title={`Delivered: ${d.delivered}`} />
              </div>
              <span className="bar-label">{d.month}</span>
            </div>
          );
        })}
      </div>
      <div className="bar-legend">
        {[
          { cls: "delivered",  label: "Delivered",  color: "#2d7a4f" },
          { cls: "in-transit", label: "In Transit",  color: "#3a3f5c" },
          { cls: "pending",    label: "Pending",     color: "#b07d2a" },
        ].map(l => (
          <div key={l.cls} className="legend-item">
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart() {
  const segments = [
    { pct: 44, offset: 0,  color: "#c84b2f" },
    { pct: 32, offset: 44, color: "#3a3f5c" },
    { pct: 24, offset: 76, color: "#b07d2a" },
  ];
  return (
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 36 36">
        {segments.map((s, i) => (
          <circle key={i} cx="18" cy="18" r="15.9155"
            fill="transparent"
            stroke={s.color}
            strokeWidth="4"
            strokeDasharray={`${s.pct} ${100 - s.pct}`}
            strokeDashoffset={`${25 - s.offset}`}
          />
        ))}
        <text x="18" y="17" textAnchor="middle"
          style={{ fontFamily: "'Syne',sans-serif", fontSize: "5px", fontWeight: 800, fill: "#0a0a0f" }}>
          4,821
        </text>
        <text x="18" y="22" textAnchor="middle"
          style={{ fontFamily: "'DM Mono',monospace", fontSize: "2.4px", fill: "#8a8478", letterSpacing: "0.2px" }}>
          TOTAL
        </text>
      </svg>
      <div className="donut-rows">
        {CARRIERS.map(c => (
          <div key={c.name} className="donut-row">
            <div className="donut-left">
              <span className="donut-swatch" style={{ background: c.color }} />
              {c.name}
            </div>
            <span className="donut-val">{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineChart() {
  const w = 400, h = 100, pad = 10;
  const max = Math.max(...REVENUE_POINTS);
  const min = Math.min(...REVENUE_POINTS);
  const pts = REVENUE_POINTS.map((v, i) => ({
    x: pad + (i / (REVENUE_POINTS.length - 1)) * (w - pad * 2),
    y: pad + ((max - v) / (max - min)) * (h - pad * 2),
  }));
  const pathD    = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD    = `${pathD} L${pts[pts.length - 1].x},${h} L${pts[0].x},${h} Z`;

  return (
    <div className="line-chart-wrap">
      <svg className="line-svg" viewBox={`0 0 ${w} ${h + 16}`}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(r => (
          <line key={r} className="line-grid"
            x1={pad} y1={pad + r * (h - pad * 2)}
            x2={w - pad} y2={pad + r * (h - pad * 2)} />
        ))}
        {/* Area fill */}
        <path d={areaD} fill="#3a3f5c" className="line-area" />
        {/* Line */}
        <path d={pathD} className="line-path" stroke="#3a3f5c" />
        {/* Dots */}
        {pts.map((p, i) => (
          <circle key={i} className="line-dot" cx={p.x} cy={p.y} r="3"
            fill="#ffffff" stroke="#3a3f5c" strokeWidth="2" />
        ))}
        {/* X axis labels */}
        {["W1","W3","W5","W7","W9","W11"].map((w, i) => (
          <text key={i} className="line-axis-label"
            x={pad + (i / 5) * (400 - pad * 2)} y={h + 14} textAnchor="middle">
            {w}
          </text>
        ))}
      </svg>
    </div>
  );
}

function Heatmap() {
  return (
    <div className="heatmap-wrap">
      <div className="heatmap-day-labels">
        {DAYS.map((d, i) => <div key={i} className="heatmap-day-label">{d}</div>)}
      </div>
      <div className="heatmap-grid">
        {HEATMAP.flat().map((level, i) => (
          <div key={i} className={`heatmap-cell l${level}`} title={`${level * 25}% activity`} />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-cells">
          {[0,1,2,3,4].map(l => (
            <div key={l} className={`heatmap-legend-cell heatmap-cell l${l}`} />
          ))}
        </div>
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const [activeNav, setActiveNav] = useState("Analytics");
  const [range, setRange]         = useState("30D");
  const navigate = useNavigate();

  return (
    <div className="an-shell">

      {/* Sidebar */}
      <aside className="an-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${activeNav === n.label ? " active" : ""}`}
            onClick={() => { setActiveNav(n.label); navigate(n.path); }}>
            {n.icon}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out">↩</div>
        </div>
      </aside>

      <main className="an-main">

        {/* Header */}
        <div className="an-topbar">
          <div>
            <div className="an-title">Analytics <span>&amp; Reports</span></div>
            <div className="an-sub">Performance overview — SwiftPort logistics data</div>
          </div>
          <div className="an-actions">
            <div className="range-tabs">
              {["7D","30D","90D","1Y"].map(r => (
                <button key={r} className={`range-tab${range === r ? " active" : ""}`}
                  onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
            <button className="btn-outline">↓ Export</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          {KPIS.map(k => (
            <div key={k.label} className="kpi-card" style={{ "--kpi-accent": k.accent }}>
              <div className="kpi-top">
                <span className="kpi-label">{k.label}</span>
                <span className="kpi-icon" style={{ color: k.accent }}>{k.icon}</span>
              </div>
              <div className="kpi-value">{k.value}</div>
              <div className={`kpi-delta ${k.trend}`}>
                {k.trend === "up" ? "▲" : "▼"} {k.delta} vs last period
              </div>
            </div>
          ))}
        </div>

        {/* Row 1: bar chart + carrier donut */}
        <div className="chart-grid-top">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Shipment Volume by Month</span>
              <span className="panel-meta">Sep 2025 — Mar 2026</span>
            </div>
            <BarChart />
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Carrier Split</span>
              <button className="panel-action">Details</button>
            </div>
            <DonutChart />
          </div>
        </div>

        {/* Row 2: revenue trend + top routes + heatmap */}
        <div className="chart-grid-bottom">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Revenue Trend</span>
              <span className="panel-meta">Last 12 weeks · $000s</span>
            </div>
            <LineChart />
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Top Routes</span>
              <button className="panel-action">View all</button>
            </div>
            <div className="spark-table">
              {TOP_ROUTES.map(r => (
                <div key={r.rank} className="spark-row">
                  <span className="spark-rank">#{r.rank}</span>
                  <span className="spark-name">{r.name}</span>
                  <div className="spark-bar-wrap">
                    <div className="spark-bar-fill" style={{ width: `${r.pct}%` }} />
                  </div>
                  <span className="spark-val">{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Activity Heatmap</span>
              <span className="panel-meta">Last 7 weeks</span>
            </div>
            <Heatmap />
          </div>
        </div>

      </main>
    </div>
  );
}
