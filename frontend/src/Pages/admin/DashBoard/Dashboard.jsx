import { useState } from "react";
import "./DashBoard.css";

const STATS = [
  { label: "Active Shipments", value: "1,284", delta: "+12%", trend: "up",   icon: "◈", color: "#c84b2f" },
  { label: "Delivered Today",  value: "348",   delta: "+5%",  trend: "up",   icon: "✓", color: "#2d7a4f" },
  { label: "Pending Pickup",   value: "97",    delta: "-3%",  trend: "down", icon: "◎", color: "#b07d2a" },
  { label: "Avg. Transit Days",value: "2.4",   delta: "-0.3", trend: "up",   icon: "⬡", color: "#3a3f5c" },
];

const SHIPMENTS = [
  { id: "#SP-8821", origin: "Lagos, NG",        dest: "London, UK",   carrier: "DHL Express",   status: "Delivered",  date: "Mar 12", weight: "4.2 kg" },
  { id: "#SP-9103", origin: "Abuja, NG",         dest: "New York, US", carrier: "FedEx Intl.",   status: "In Transit", date: "Mar 11", weight: "1.8 kg" },
  { id: "#SP-7764", origin: "Port Harcourt, NG", dest: "Dubai, AE",    carrier: "UPS Worldwide", status: "In Transit", date: "Mar 11", weight: "6.0 kg" },
  { id: "#SP-9241", origin: "Kano, NG",          dest: "Paris, FR",    carrier: "DHL Express",   status: "Pending",    date: "Mar 12", weight: "2.1 kg" },
  { id: "#SP-8890", origin: "Ibadan, NG",         dest: "Toronto, CA",  carrier: "FedEx Intl.",   status: "Exception",  date: "Mar 10", weight: "3.5 kg" },
  { id: "#SP-9312", origin: "Lagos, NG",          dest: "Berlin, DE",   carrier: "DHL Express",   status: "Delivered",  date: "Mar 10", weight: "0.9 kg" },
];

const STATUS_META = {
  Delivered:  { bg: "#e8f5ee", text: "#2d7a4f", dot: "#2d7a4f" },
  "In Transit":{ bg: "#eef1fb", text: "#3a3f5c", dot: "#3a3f5c" },
  Pending:    { bg: "#fdf6e3", text: "#b07d2a", dot: "#b07d2a" },
  Exception:  { bg: "#fdf0ed", text: "#c84b2f", dot: "#c84b2f" },
};

const ACTIVITY = [
  { time: "09:31", msg: "Shipment #SP-9312 marked delivered",          type: "success" },
  { time: "09:14", msg: "Label generated for #SP-9401",                type: "info"    },
  { time: "08:52", msg: "Exception raised on #SP-8890 — customs hold", type: "error"   },
  { time: "08:30", msg: "Carrier rate updated: FedEx +2.1%",           type: "info"    },
  { time: "07:58", msg: "#SP-7764 departed Lagos hub",                  type: "success" },
  { time: "07:22", msg: "Bulk import: 14 new orders queued",            type: "info"    },
];

const DONUT_SEGMENTS = [
  { label: "In Transit", val: "836", pct: 65.1, offset: 27.1,  color: "#3a3f5c" },
  { label: "Delivered",  val: "348", pct: 27.1, offset: 0,     color: "#2d7a4f" },
  { label: "Pending",    val: "97",  pct: 7.6,  offset: 92.2,  color: "#b07d2a" },
  { label: "Exception",  val: "3",   pct: 0.2,  offset: 99.8,  color: "#c84b2f" },
];

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡" },
  { label: "Shipments", icon: "◈" },
  { label: "Tracking",  icon: "◎" },
  { label: "Analytics", icon: "◧" },
  { label: "Settings",  icon: "⊕" },
];

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [filter, setFilter]   = useState("All");
  const [sideNav, setSideNav] = useState("Dashboard");

  const filtered = filter === "All"
    ? SHIPMENTS
    : SHIPMENTS.filter(s => s.status === filter);

  return (
    <>
      

      <div className="db-shell">

        {/* ── SIDEBAR ── */}
        <aside className="db-sidebar">
          {NAV_ICONS.map(n => (
            <div
              key={n.label}
              title={n.label}
              className={`sb-icon${sideNav === n.label ? " active" : ""}`}
              onClick={() => setSideNav(n.label)}
            >
              {n.icon}
            </div>
          ))}
          <div className="sb-sep" />
          <div className="sb-bottom">
            <div className="sb-icon" title="Sign Out">↩</div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="db-main">

          {/* Page header */}
          <div className="ph-row">
            <div>
              <div className="ph-greeting">
                Good morning, <span>James</span> 👋
              </div>
              <div className="ph-date">Thursday, March 12, 2026 — Dashboard Overview</div>
            </div>
            <div className="ph-actions">
              <button className="btn-outline">↓ Export</button>
              <button className="btn-primary">+ New Shipment</button>
            </div>
          </div>

          {/* Stat cards */}
          <div className="stats-grid">
            {STATS.map(s => (
              <div
                key={s.label}
                className="stat-card"
                style={{ "--accent": s.color }}
              >
                <div className="stat-top">
                  <span className="stat-label">{s.label}</span>
                  <span className="stat-icon" style={{ color: s.color }}>{s.icon}</span>
                </div>
                <div className="stat-value">{s.value}</div>
                <div className={`stat-delta ${s.trend}`}>
                  {s.trend === "up" ? "▲" : "▼"} {s.delta} vs yesterday
                </div>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="main-grid">

            {/* Shipments table panel */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Recent Shipments</span>
                <button className="panel-link">View all →</button>
              </div>

              <div className="filter-bar">
                {["All", "In Transit", "Delivered", "Pending", "Exception"].map(f => (
                  <button
                    key={f}
                    className={`ftab${filter === f ? " active" : ""}`}
                    onClick={() => setFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="tbl-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Shipment ID</th>
                      <th>Route</th>
                      <th>Carrier</th>
                      <th>Weight</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "var(--warm-gray)", padding: "32px 16px", fontFamily: "'DM Mono',monospace", fontSize: 12 }}>
                          No shipments in this category
                        </td>
                      </tr>
                    ) : filtered.map(s => {
                      const sc = STATUS_META[s.status];
                      return (
                        <tr key={s.id}>
                          <td><span className="ship-id">{s.id}</span></td>
                          <td>
                            <div className="ship-route">
                              <span>{s.origin}</span>
                              <span className="route-arrow">→</span>
                              <span>{s.dest}</span>
                            </div>
                          </td>
                          <td><span className="carrier-pill">{s.carrier}</span></td>
                          <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12 }}>{s.weight}</td>
                          <td style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--warm-gray)" }}>{s.date}</td>
                          <td>
                            <span className="status-chip" style={{ background: sc.bg, color: sc.text }}>
                              <span className="chip-dot" style={{ background: sc.dot }} />
                              {s.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="right-col">

              {/* Donut chart */}
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Status Breakdown</span>
                  <button className="panel-link">Details</button>
                </div>
                <div className="donut-body">
                  <svg className="donut-svg" viewBox="0 0 36 36">
                    {DONUT_SEGMENTS.map((seg, i) => (
                      <circle
                        key={i}
                        cx="18" cy="18" r="15.9155"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="4"
                        strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                        strokeDashoffset={`${25 - seg.offset}`}
                      />
                    ))}
                    <text x="18" y="17" textAnchor="middle"
                      style={{ fontFamily: "'Syne',sans-serif", fontSize: "5px", fontWeight: 800, fill: "#0a0a0f" }}>
                      1,284
                    </text>
                    <text x="18" y="22" textAnchor="middle"
                      style={{ fontFamily: "'DM Mono',monospace", fontSize: "2.4px", fill: "#8a8478", letterSpacing: "0.2px" }}>
                      ACTIVE
                    </text>
                  </svg>

                  <div className="donut-legend">
                    {DONUT_SEGMENTS.map(l => (
                      <div key={l.label} className="leg-row">
                        <div className="leg-left">
                          <span className="leg-dot" style={{ background: l.color }} />
                          {l.label}
                        </div>
                        <span className="leg-val">{l.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Activity feed */}
              <div className="panel">
                <div className="panel-head">
                  <span className="panel-title">Live Activity</span>
                  <div className="live-badge">
                    <span className="live-dot" />
                    <span className="panel-link" style={{ cursor: "default" }}>Live</span>
                  </div>
                </div>
                <div>
                  {ACTIVITY.map((a, i) => (
                    <div key={i} className="act-item">
                      <span className="act-time">{a.time}</span>
                      <span className={`act-dot ${a.type}`} />
                      <span className="act-msg">{a.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
}
