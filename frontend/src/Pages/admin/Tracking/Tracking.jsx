import { useState } from "react";
import "./Tracking.css";
import ShippingHeader from "../../../components/ShippingHeader/ShippingHeader";

const SHIPMENT_DB = {
  "SP-9103": {
    id: "#SP-9103", status: "In Transit",
    origin: { city: "Abuja",        country: "Nigeria", code: "ABV", coords: [9.07,  7.40]  },
    dest:   { city: "New York",     country: "USA",     code: "JFK", coords: [40.71, -74.01] },
    carrier: "FedEx Intl.", service: "International Priority",
    weight: "1.8 kg", dims: "28 × 18 × 12 cm", ref: "FX-881-002-4410",
    eta: "Mar 14, 2026", dispatched: "Mar 11, 2026", progress: 58, recipient: "Michael Torres",
    statusBg: "#eef1fb", statusText: "#3a3f5c", dotColor: "#3a3f5c",
    events: [
      { date: "Mar 12, 09:31", location: "London Heathrow Hub, UK",    desc: "Departed international gateway",      status: "done",    icon: "✈" },
      { date: "Mar 12, 04:15", location: "London Heathrow Hub, UK",    desc: "Arrived at international gateway",    status: "done",    icon: "◎" },
      { date: "Mar 11, 22:48", location: "Lagos Cargo Terminal, NG",   desc: "Cleared customs & export screening",  status: "done",    icon: "✓" },
      { date: "Mar 11, 18:30", location: "Lagos Cargo Terminal, NG",   desc: "Package received at origin hub",      status: "done",    icon: "◈" },
      { date: "Mar 11, 14:10", location: "Abuja Logistics Centre, NG", desc: "Label created & picked up by FedEx", status: "done",    icon: "◈" },
      { date: "Mar 13 (est.)", location: "Memphis Hub, USA",            desc: "Awaiting arrival at US gateway",     status: "pending", icon: "◎" },
      { date: "Mar 14 (est.)", location: "New York, USA",               desc: "Out for delivery",                   status: "pending", icon: "🏠" },
    ],
  },
  "SP-8821": {
    id: "#SP-8821", status: "Delivered",
    origin: { city: "Lagos",   country: "Nigeria", code: "LOS", coords: [6.52,  3.38]  },
    dest:   { city: "London",  country: "UK",      code: "LHR", coords: [51.51, -0.12] },
    carrier: "DHL Express", service: "Worldwide Express",
    weight: "4.2 kg", dims: "40 × 30 × 20 cm", ref: "DHL-771-904-3321",
    eta: "Delivered Mar 12", dispatched: "Mar 10, 2026", progress: 100, recipient: "Amelia Watson",
    statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f",
    events: [
      { date: "Mar 12, 11:02", location: "London, UK",            desc: "Delivered — signed by A. Watson",  status: "done", icon: "✓" },
      { date: "Mar 12, 07:44", location: "London DHL Hub, UK",    desc: "Out for delivery",                 status: "done", icon: "🚚" },
      { date: "Mar 11, 23:10", location: "London DHL Hub, UK",    desc: "Arrived at destination hub",       status: "done", icon: "◎" },
      { date: "Mar 11, 14:55", location: "Frankfurt Gateway, DE", desc: "Transited European hub",           status: "done", icon: "✈" },
      { date: "Mar 10, 20:30", location: "Lagos Airport Hub, NG", desc: "Departed origin country",          status: "done", icon: "✈" },
      { date: "Mar 10, 15:20", location: "Lagos DHL Hub, NG",     desc: "Shipment picked up",               status: "done", icon: "◈" },
    ],
  },
  "SP-9241": {
    id: "#SP-9241", status: "Pending",
    origin: { city: "Kano",  country: "Nigeria", code: "KAN", coords: [12.00, 8.52] },
    dest:   { city: "Paris", country: "France",  code: "CDG", coords: [48.86, 2.35] },
    carrier: "DHL Express", service: "Worldwide Express",
    weight: "2.1 kg", dims: "22 × 15 × 10 cm", ref: "DHL-902-116-7741",
    eta: "Mar 16, 2026", dispatched: "—", progress: 5, recipient: "Isabelle Morel",
    statusBg: "#fdf6e3", statusText: "#b07d2a", dotColor: "#b07d2a",
    events: [
      { date: "Mar 12, 09:00", location: "Kano, Nigeria",              desc: "Label created — awaiting pickup", status: "done",    icon: "◈" },
      { date: "Mar 12 (est.)", location: "Kano Logistics Centre, NG",  desc: "Scheduled pickup by DHL",         status: "pending", icon: "🚚" },
      { date: "Mar 13 (est.)", location: "Lagos Airport Hub, NG",      desc: "Depart Nigeria",                  status: "pending", icon: "✈" },
      { date: "Mar 15 (est.)", location: "Paris CDG Hub, FR",          desc: "Arrive Paris gateway",            status: "pending", icon: "◎" },
      { date: "Mar 16 (est.)", location: "Paris, France",              desc: "Delivery attempt",                status: "pending", icon: "🏠" },
    ],
  },
  "SP-8890": {
    id: "#SP-8890", status: "Exception",
    origin: { city: "Ibadan",   country: "Nigeria", code: "IBA", coords: [7.38,  3.93]  },
    dest:   { city: "Toronto",  country: "Canada",  code: "YYZ", coords: [43.65, -79.38] },
    carrier: "FedEx Intl.", service: "International Economy",
    weight: "3.5 kg", dims: "35 × 25 × 15 cm", ref: "FX-664-773-9910",
    eta: "TBD — Exception Raised", dispatched: "Mar 10, 2026", progress: 40, recipient: "Daniel Kowalski",
    statusBg: "#fdf0ed", statusText: "#c84b2f", dotColor: "#c84b2f",
    events: [
      { date: "Mar 12, 06:10", location: "London Heathrow, UK",       desc: "⚠ Held by customs — documentation required", status: "exception", icon: "⚠" },
      { date: "Mar 11, 21:30", location: "London Heathrow, UK",       desc: "Arrived at transit hub",                     status: "done",      icon: "◎" },
      { date: "Mar 11, 08:00", location: "Lagos Cargo Terminal, NG",  desc: "Departed Nigeria",                           status: "done",      icon: "✈" },
      { date: "Mar 10, 17:45", location: "Ibadan, Nigeria",           desc: "Picked up by FedEx courier",                 status: "done",      icon: "◈" },
    ],
  },
};

const RECENT_TRACKED = ["SP-9103", "SP-8821", "SP-8890"];

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡" }, { label: "Shipments", icon: "◈" },
  { label: "Tracking",  icon: "◎" }, { label: "Analytics", icon: "◧" },
  { label: "Settings",  icon: "⊕" },
];

const PACKAGE_FIELDS = [
  ["Weight",     "weight"],
  ["Dimensions", "dims"],
  ["Carrier",    "carrier"],
  ["Service",    "service"],
  ["Priority",   null],
  ["Recipient",  "recipient"],
];

// ── ROUTE MAP ─────────────────────────────────────────────────────────────────

function RouteMap({ shipment }) {
  const { origin, dest, progress, status } = shipment;
  const toSVG = ([lat, lng]) => ({ x: ((lng + 180) / 360) * 800, y: ((90 - lat) / 180) * 360 });
  const o  = toSVG(origin.coords);
  const d  = toSVG(dest.coords);
  const mx = (o.x + d.x) / 2;
  const my = Math.min(o.y, d.y) - 60;
  const t  = progress / 100;
  const cx = (1-t)*(1-t)*o.x + 2*(1-t)*t*mx + t*t*d.x;
  const cy = (1-t)*(1-t)*o.y + 2*(1-t)*t*my + t*t*d.y;
  const accent = status === "Exception" ? "#c84b2f" : status === "Delivered" ? "#2d7a4f" : "#3a3f5c";

  return (
    <svg viewBox="0 0 800 360" style={{ width: "100%", height: "100%", display: "block" }}>
      <rect width="800" height="360" fill="#dde8f0" />
      <path d="M370 130 L420 120 L450 140 L460 180 L455 230 L440 270 L420 290 L400 285 L380 260 L370 220 L365 180 Z" fill="#c8c4b8" stroke="#b8b4a8" strokeWidth="0.5"/>
      <path d="M370 60 L420 55 L450 70 L445 100 L420 115 L390 110 L365 95 Z" fill="#c8c4b8" stroke="#b8b4a8" strokeWidth="0.5"/>
      <path d="M80 60 L180 50 L220 70 L230 110 L210 140 L180 155 L140 150 L100 130 L70 100 Z" fill="#c8c4b8" stroke="#b8b4a8" strokeWidth="0.5"/>
      <path d="M150 180 L200 170 L220 190 L225 240 L210 280 L185 295 L160 285 L145 250 L140 210 Z" fill="#c8c4b8" stroke="#b8b4a8" strokeWidth="0.5"/>
      <path d="M450 55 L620 45 L680 80 L690 120 L660 140 L580 145 L510 130 L460 110 Z" fill="#c8c4b8" stroke="#b8b4a8" strokeWidth="0.5"/>
      <path d={`M${o.x},${o.y} Q${mx},${my} ${d.x},${d.y}`} fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.6" />
      {progress > 0 && <path d={`M${o.x},${o.y} Q${mx},${my} ${cx},${cy}`} fill="none" stroke={accent} strokeWidth="2.5" opacity="0.9" />}
      <circle cx={o.x} cy={o.y} r="7" fill={accent} opacity="0.25" />
      <circle cx={o.x} cy={o.y} r="4" fill={accent} />
      <text x={o.x} y={o.y - 12} textAnchor="middle" style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", fill: "#0a0a0f", fontWeight: 600 }}>{origin.code}</text>
      <circle cx={d.x} cy={d.y} r="7" fill="#0a0a0f" opacity="0.15" />
      <circle cx={d.x} cy={d.y} r="4" fill="#0a0a0f" opacity={progress === 100 ? 1 : 0.35} />
      <text x={d.x} y={d.y - 12} textAnchor="middle" style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", fill: "#0a0a0f", fontWeight: 600 }}>{dest.code}</text>
      {progress > 0 && progress < 100 && (
        <>
          <circle cx={cx} cy={cy} r="10" fill={accent} opacity="0.2" />
          <circle cx={cx} cy={cy} r="6"  fill={accent} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: "7px", fill: "white" }}>✈</text>
        </>
      )}
      <rect x="10" y="328" width="90" height="22" fill="white" opacity="0.85"/>
      <text x="55" y="343" textAnchor="middle" style={{ fontFamily: "'DM Mono',monospace", fontSize: "9px", fill: "#0a0a0f", fontWeight: 600 }}>{progress}% complete</text>
    </svg>
  );
}

// ── TIMELINE ──────────────────────────────────────────────────────────────────

function Timeline({ events }) {
  return (
    <div>
      {events.map((ev, i) => {
        const isDone      = ev.status === "done";
        const isException = ev.status === "exception";
        const isPending   = ev.status === "pending";
        return (
          <div key={i} className={`tl-item${isPending ? " pending" : ""}`}>
            <div className="tl-spine">
              <div className={`tl-dot ${isException ? "exception" : isDone ? "done" : "pending"}`}>{ev.icon}</div>
              {i < events.length - 1 && <div className={`tl-line ${isDone ? "done" : "mist"}`} />}
            </div>
            <div className="tl-content">
              <div className="tl-date">{ev.date}</div>
              <div className={`tl-desc${isException ? " exception" : ""}`}>{ev.desc}</div>
              <div className="tl-loc">{ev.location}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function Tracking() {
  const [activeNav, setActiveNav] = useState("Tracking");
  const [query,     setQuery]     = useState("");
  const [shipment,  setShipment]  = useState(null);
  const [notFound,  setNotFound]  = useState(false);

  const doSearch = (raw) => {
    const key   = raw.trim().replace(/^#?SP-/i, "SP-").toUpperCase();
    const found = SHIPMENT_DB[key];
    if (found) { setShipment(found); setNotFound(false); }
    else       { setShipment(null);  setNotFound(true);  }
  };

  const quickTrack = (id) => { setQuery(id); doSearch(id); };

  return (
    <div className="tr-shell">
      {/* Sidebar */}
      <aside className="tr-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${activeNav === n.label ? " active" : ""}`}
            onClick={() => setActiveNav(n.label)}>
            {n.icon}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out">↩</div>
        </div>
      </aside>

      <main className="tr-main">

        {/* Hero */}
        <div className="tr-hero">
          <div className="tr-hero-title">Track a <span>Shipment</span></div>
          <div className="tr-hero-sub">Enter a tracking ID or reference number for real-time updates</div>
          <div className="tr-search">
            <input
              placeholder="e.g. SP-9103 or FX-881-002-4410"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch(query)}
            />
            <button className="tr-search-btn" onClick={() => doSearch(query)}>⌕</button>
          </div>
          <div className="tr-recent">
            <span className="tr-recent-label">Recent:</span>
            {RECENT_TRACKED.map(id => (
              <button key={id} className="tr-chip" onClick={() => quickTrack(id)}>#{id}</button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="tr-content">

          {!shipment && !notFound && (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <div className="empty-title">Enter a tracking number above</div>
              <div className="empty-sub">Try SP-9103, SP-8821, SP-9241 or SP-8890</div>
            </div>
          )}

          {notFound && (
            <div className="not-found">
              <div className="not-found-icon">✕</div>
              <div className="not-found-title">Shipment not found</div>
              <div className="not-found-sub">No record matches "{query}". Check the ID and try again.</div>
            </div>
          )}

          {shipment && (
            <>
              {/* Exception banner */}
              {shipment.status === "Exception" && (
                <div className="exc-banner">
                  <span className="exc-icon">⚠</span>
                  <div>
                    <div className="exc-title">Action Required — Shipment Exception</div>
                    <div className="exc-body">
                      Your shipment is held at London Heathrow customs. Please provide the requested documentation to FedEx within 48 hours to avoid return shipment.
                    </div>
                  </div>
                </div>
              )}

              {/* Ship card */}
              <div className="ship-card">
                <div className="ship-card-top">
                  <div>
                    <div className="ship-card-id">{shipment.id}</div>
                    <div className="ship-card-ref">{shipment.ref}</div>
                  </div>
                  <span className="status-chip" style={{ background: shipment.statusBg, color: shipment.statusText }}>
                    <span className="chip-dot" style={{ background: shipment.dotColor }} />
                    {shipment.status}
                  </span>
                </div>

                <div className="route-bar">
                  <div className="route-city">
                    <div className="route-city-name">{shipment.origin.city}</div>
                    <div className="route-city-sub">{shipment.origin.country} · {shipment.origin.code}</div>
                  </div>
                  <div className="route-mid">
                    <span className="route-plane">✈</span>
                    <div className="route-line">
                      <div className="route-line-fill" style={{ width: `${shipment.progress}%` }} />
                    </div>
                    <span className="route-pct">{shipment.progress}% complete</span>
                  </div>
                  <div className="route-city right">
                    <div className="route-city-name">{shipment.dest.city}</div>
                    <div className="route-city-sub">{shipment.dest.country} · {shipment.dest.code}</div>
                  </div>
                </div>

                <div className="meta-grid">
                  {[
                    { label: "Carrier",       val: shipment.carrier    },
                    { label: "Service",       val: shipment.service    },
                    { label: "Est. Delivery", val: shipment.eta        },
                    { label: "Dispatched",    val: shipment.dispatched },
                  ].map(m => (
                    <div key={m.label} className="meta-item">
                      <div className="meta-label">{m.label}</div>
                      <div className="meta-val">{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result grid */}
              <div className="result-grid">

                {/* Left: map + timeline */}
                <div className="left-col">
                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">Route Map</span>
                      <span className="panel-meta">{shipment.origin.city} → {shipment.dest.city}</span>
                    </div>
                    <div className="map-wrap">
                      <RouteMap shipment={shipment} />
                    </div>
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">Tracking Timeline</span>
                      <button className="panel-link">↓ Download PDF</button>
                    </div>
                    <div className="timeline-wrap">
                      <Timeline events={shipment.events} />
                    </div>
                  </div>
                </div>

                {/* Right: details + help */}
                <div className="right-col">
                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">Package Details</span>
                    </div>
                    {[
                      { k: "Weight",     v: shipment.weight    },
                      { k: "Dimensions", v: shipment.dims      },
                      { k: "Carrier",    v: shipment.carrier   },
                      { k: "Service",    v: shipment.service   },
                      { k: "Recipient",  v: shipment.recipient },
                    ].map(r => (
                      <div key={r.k} className="info-row">
                        <span className="info-key">{r.k}</span>
                        <span className="info-val">{r.v}</span>
                      </div>
                    ))}
                  </div>

                  <div className="panel">
                    <div className="panel-head">
                      <span className="panel-title">Need Help?</span>
                    </div>
                    <div className="help-actions">
                      {[
                        { icon: "◈", label: "Report an issue"  },
                        { icon: "⬡", label: "Contact carrier"  },
                        { icon: "◎", label: "Request redirect" },
                      ].map(a => (
                        <button key={a.label} className="help-btn">
                          <span>{a.icon}</span>{a.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </div>

      </main>
    </div>
  );
}
