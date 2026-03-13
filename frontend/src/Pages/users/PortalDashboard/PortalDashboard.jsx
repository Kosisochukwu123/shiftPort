import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PortalDashboard.css";

const SHIPMENTS = [
  { id: "SP-9401", dest: "London, UK",       carrier: "DHL Express",        status: "transit",   date: "12 Mar 2026", eta: "14 Mar" },
  { id: "SP-9388", dest: "New York, USA",    carrier: "FedEx International", status: "delivered", date: "10 Mar 2026", eta: "—"       },
  { id: "SP-9352", dest: "Dubai, UAE",       carrier: "UPS Worldwide",       status: "pending",   date: "9 Mar 2026",  eta: "16 Mar"  },
  { id: "SP-9320", dest: "Berlin, Germany",  carrier: "DHL Express",         status: "exception", date: "7 Mar 2026",  eta: "TBD"     },
  { id: "SP-9301", dest: "Accra, Ghana",     carrier: "FedEx International", status: "delivered", date: "5 Mar 2026",  eta: "—"       },
];

const ACTIVITY = [
  { dot: "rust",  text: "SP-9401 departed Lagos sorting facility",       time: "2 hrs ago"  },
  { dot: "steel", text: "SP-9352 picked up — awaiting customs clearance", time: "5 hrs ago"  },
  { dot: "green", text: "SP-9388 delivered to recipient in New York",    time: "Yesterday"  },
  { dot: "amber", text: "SP-9320 delayed — address query raised",         time: "2 days ago" },
  { dot: "green", text: "SP-9301 delivered to Accra recipient",           time: "5 days ago" },
];

const STATS = [
  { label: "Active Shipments",   val: "3",    cls: "rust",  badge: null },
  { label: "In Transit",         val: "1",    cls: "",      badge: "transit"   },
  { label: "Delivered (30 days)",val: "2",    cls: "green", badge: "delivered" },
  { label: "Exceptions",         val: "1",    cls: "rust",  badge: "exception" },
];

export default function PortalDashboard() {
  const navigate    = useNavigate();
  const [trackId, setTrackId] = useState("");
  const userName    = sessionStorage.getItem("sp_user") || "User";
  const firstName   = userName.split(" ")[0];

  const handleTrack = () => {
    if (trackId.trim()) navigate("/portal/track?id=" + trackId.trim());
    else navigate("/portal/track");
  };

  return (
    <div className="portal-page">
      <div className="portal-page-title">Good morning, {firstName} 👋</div>
      <div className="portal-page-sub">Here's what's happening with your shipments today.</div>

      {/* Stats */}
      <div className="pd-stats">
        {STATS.map(s => (
          <div key={s.label} className="pd-stat">
            <div className="pd-stat-label">{s.label}</div>
            <div className={`pd-stat-val${s.cls ? " " + s.cls : ""}`}>{s.val}</div>
            {s.badge && <div className={`pd-stat-badge ${s.badge}`}>{s.badge.toUpperCase()}</div>}
          </div>
        ))}
      </div>

      {/* Quick track */}
      <div className="pd-track-bar">
        <div className="pd-track-label">Quick Track</div>
        <input className="pd-track-input" placeholder="Enter tracking ID e.g. SP-9401"
          value={trackId} onChange={e => setTrackId(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleTrack()} />
        <button className="pd-track-btn" onClick={handleTrack}><span>Track</span> →</button>
      </div>

      {/* Main grid */}
      <div className="pd-grid">

        {/* Recent shipments */}
        <div className="pd-card">

          <div className="pd-card-head">
            <div className="pd-card-title">Recent Shipments</div>
            <button className="pd-card-link" onClick={() => navigate("/portal/orders")}>View all →</button>
          </div>

          <table className="pd-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Destination</th>
                <th>Carrier</th>
                <th>Status</th>
                <th>Date</th>
                <th>ETA</th>
              </tr>
            </thead>
            <tbody>
              {SHIPMENTS.map(s => (
                <tr key={s.id}>
                  <td><span className="pd-id" onClick={() => navigate(`/portal/orders/${s.id}`)}>{s.id}</span></td>
                  <td><div className="pd-dest">{s.dest}</div></td>
                  <td><div className="pd-carrier">{s.carrier}</div></td>
                  <td><span className={`pd-badge ${s.status}`}>{s.status.toUpperCase()}</span></td>
                  <td><div className="pd-date">{s.date}</div></td>
                  <td><div className="pd-date">{s.eta}</div></td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>

        {/* Sidebar */}
        <div className="pd-side">
          {/* Activity */}
          <div className="pd-card pd-activity">
            <div className="pd-card-head">
              <div className="pd-card-title">Activity Feed</div>
            </div>
            {ACTIVITY.map((a, i) => (
              <div key={i} className="pd-act-item">
                <div className={`pd-act-dot ${a.dot}`} />
                <div>
                  <div className="pd-act-text">{a.text}</div>
                  <div className="pd-act-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="pd-actions">
            <div className="pd-card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
            <button className="pd-action-btn" onClick={() => navigate("/portal/new")}>
              <span>📦</span> Book New Shipment
            </button>
            <button className="pd-action-btn" onClick={() => navigate("/portal/track")}>
              <span>◎</span> Track a Package
            </button>
            <button className="pd-action-btn" onClick={() => navigate("/portal/orders")}>
              <span>◧</span> View All Orders
            </button>
            <button className="pd-action-btn" onClick={() => navigate("/portal/profile")}>
              <span>⬡</span> Manage Profile
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
