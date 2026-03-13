import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./ShipmentDetails.css";

// ── DATA ──────────────────────────────────────────────────────────────────────

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Shipments", icon: "◈", path: "/shipments"  },
  { label: "Tracking",  icon: "◎", path: "/tracking"   },
  { label: "Analytics", icon: "◧", path: "/analytics"  },
  { label: "Settings",  icon: "⊕", path: "/settings"   },
];

const SHIPMENTS = {
  "SP-9401": {
    id: "#SP-9401", ref: "DHL-924-001-5510", status: "In Transit", progress: 62,
    carrier: "DHL Express", service: "Worldwide Express", weight: "3.2 kg",
    dims: "30 × 22 × 18 cm", priority: "Express", cost: "$84.00",
    baseCost: "$72.00", fuelSurcharge: "$8.40", handlingFee: "$3.60",
    dispatched: "Mar 12, 2026", eta: "Mar 14, 2026",
    origin:    { city: "Lagos",   country: "Nigeria",  code: "LOS", name: "Emeka Eze",      address: "15 Broad Street, Lagos Island", zip: "101001" },
    dest:      { city: "London",  country: "UK",       code: "LHR", name: "Sarah Thompson", address: "22 Baker Street, Marylebone",   zip: "W1U 3BW" },
    events: [
      { date: "Mar 12, 14:20", loc: "Frankfurt Hub, DE",       desc: "In transit — European hub",          status: "done"    },
      { date: "Mar 12, 07:10", loc: "Lagos Airport Hub, NG",   desc: "Departed origin country",            status: "done"    },
      { date: "Mar 12, 03:45", loc: "Lagos DHL Hub, NG",       desc: "Cleared export customs",             status: "done"    },
      { date: "Mar 11, 18:00", loc: "Lagos, Nigeria",           desc: "Picked up by DHL courier",          status: "done"    },
      { date: "Mar 13 (est.)", loc: "London Heathrow Hub, UK", desc: "Expected arrival at UK gateway",     status: "pending" },
      { date: "Mar 14 (est.)", loc: "London, UK",              desc: "Out for delivery",                   status: "pending" },
    ],
  },
  "SP-8890": {
    id: "#SP-8890", ref: "FX-664-773-9910", status: "Exception", progress: 40,
    carrier: "FedEx Intl.", service: "International Economy", weight: "3.5 kg",
    dims: "35 × 25 × 15 cm", priority: "Express", cost: "$110.00",
    baseCost: "$94.00", fuelSurcharge: "$11.00", handlingFee: "$5.00",
    dispatched: "Mar 10, 2026", eta: "TBD",
    origin:    { city: "Ibadan",  country: "Nigeria", code: "IBA", name: "Femi Adebayo",    address: "7 Ring Road, Ibadan",          zip: "200001" },
    dest:      { city: "Toronto", country: "Canada",  code: "YYZ", name: "Daniel Kowalski", address: "88 Bloor Street West, Toronto", zip: "M5S 1M8" },
    events: [
      { date: "Mar 12, 06:10", loc: "London Heathrow, UK",      desc: "⚠ Held by customs — docs required", status: "exception" },
      { date: "Mar 11, 21:30", loc: "London Heathrow, UK",      desc: "Arrived at transit hub",             status: "done"      },
      { date: "Mar 11, 08:00", loc: "Lagos Cargo Terminal, NG", desc: "Departed Nigeria",                   status: "done"      },
      { date: "Mar 10, 17:45", loc: "Ibadan, Nigeria",           desc: "Picked up by FedEx courier",       status: "done"      },
      { date: "TBD",           loc: "Toronto Pearson, CA",      desc: "Awaiting customs clearance",        status: "pending"   },
    ],
  },
};

const STATUS_STYLES = {
  "In Transit": { bg: "#eef1fb", text: "#3a3f5c", dot: "#3a3f5c" },
  "Delivered":  { bg: "#e8f5ee", text: "#2d7a4f", dot: "#2d7a4f" },
  "Pending":    { bg: "#fdf6e3", text: "#b07d2a", dot: "#b07d2a" },
  "Exception":  { bg: "#fdf0ed", text: "#c84b2f", dot: "#c84b2f" },
};

const ACTIONS = [
  { icon: "◈", label: "Download Label"      },
  { icon: "↓", label: "Export Invoice"       },
  { icon: "◎", label: "Request Redirect"     },
  { icon: "⚠", label: "Report Issue"         },
  { icon: "✕", label: "Cancel Shipment"      },
];

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function ShipmentDetail() {
  const { id }    = useParams();                     // e.g. "SP-9401"
  const navigate  = useNavigate();
  const [activeNav, setActiveNav] = useState("Shipments");

  // Fall back to SP-9401 for demo if no matching id found
  const shipment = SHIPMENTS[id] || SHIPMENTS["SP-9401"];
  const sc = STATUS_STYLES[shipment.status];

  return (
    <div className="sd-shell">

      {/* Sidebar */}
      <aside className="sd-sidebar">
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

      <main className="sd-main">

        {/* Breadcrumb */}
        <div className="sd-breadcrumb">
          <button className="bc-link" onClick={() => navigate("/shipments")}>Shipments</button>
          <span className="bc-sep">›</span>
          <span className="bc-current">{shipment.id}</span>
        </div>

        {/* Header */}
        <div className="sd-header">
          <div className="sd-header-left">
            <div className="sd-id-row">
              <span className="sd-id">{shipment.id}</span>
              <span className="status-chip" style={{ background: sc.bg, color: sc.text }}>
                <span className="chip-dot" style={{ background: sc.dot }} />
                {shipment.status}
              </span>
            </div>
            <div className="sd-ref">Ref: {shipment.ref}</div>
          </div>
          <div className="sd-header-actions">
            <button className="btn-outline">↓ Download Label</button>
            <button className="btn-primary">◎ Track Live</button>
          </div>
        </div>

        {/* Route progress */}
        <div className="sd-route-bar">
          <div className="route-endpoint">
            <div className="route-city">{shipment.origin.city}</div>
            <div className="route-country">{shipment.origin.country}</div>
            <div className="route-code">{shipment.origin.code}</div>
          </div>
          <div className="route-track">
            <span className="route-plane">✈</span>
            <div className="route-line">
              <div className="route-line-fill" style={{ width: `${shipment.progress}%` }} />
            </div>
            <span className="route-pct">{shipment.progress}% of route complete</span>
          </div>
          <div className="route-endpoint right">
            <div className="route-city">{shipment.dest.city}</div>
            <div className="route-country">{shipment.dest.country}</div>
            <div className="route-code">{shipment.dest.code}</div>
          </div>
        </div>

        {/* Two-column grid */}
        <div className="sd-grid">

          {/* LEFT */}
          <div>
            {/* Shipment details */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Shipment Details</span>
              </div>
              <div className="detail-grid">
                {[
                  { label: "Carrier",       val: shipment.carrier    },
                  { label: "Service",       val: shipment.service    },
                  { label: "Weight",        val: shipment.weight     },
                  { label: "Dimensions",    val: shipment.dims       },
                  { label: "Priority",      val: shipment.priority   },
                  { label: "Est. Delivery", val: shipment.eta        },
                  { label: "Dispatched",    val: shipment.dispatched },
                  { label: "Reference",     val: shipment.ref        },
                ].map(d => (
                  <div key={d.label} className="detail-cell">
                    <div className="detail-label">{d.label}</div>
                    <div className="detail-val">{d.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addresses */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Addresses</span>
              </div>
              <div className="addr-grid">
                {[
                  { type: "Sender",    p: shipment.origin },
                  { type: "Recipient", p: shipment.dest   },
                ].map(a => (
                  <div key={a.type} className="addr-cell">
                    <div className="addr-type">{a.type}</div>
                    <div className="addr-name">{a.p.name}</div>
                    <div className="addr-line">{a.p.address}</div>
                    <div className="addr-line">{a.p.city}, {a.p.country} {a.p.zip}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Tracking Timeline</span>
                <button className="panel-action">↓ Export PDF</button>
              </div>
              <div className="tl-wrap">
                {shipment.events.map((ev, i) => {
                  const isLast      = i === shipment.events.length - 1;
                  const isPending   = ev.status === "pending";
                  const isDone      = ev.status === "done";
                  const isException = ev.status === "exception";
                  return (
                    <div key={i} className={`tl-item${isPending ? " faded" : ""}`}>
                      <div className="tl-spine">
                        <div className={`tl-dot ${isDone ? "done" : isException ? "exception" : "pending"}`}>
                          {isDone ? "✓" : isException ? "!" : "◎"}
                        </div>
                        {!isLast && (
                          <div className={`tl-line${isDone ? " done" : " faded"}`} />
                        )}
                      </div>
                      <div className={`tl-body${isLast ? " last" : ""}`}>
                        <div className="tl-date">{ev.date}</div>
                        <div className={`tl-desc${isException ? " exc" : ""}`}>{ev.desc}</div>
                        <div className="tl-loc">{ev.loc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div>
            {/* Cost breakdown */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Cost Breakdown</span>
              </div>
              <div className="cost-row">
                <span className="cost-label">Base rate</span>
                <span className="cost-amt">{shipment.baseCost}</span>
              </div>
              <div className="cost-row">
                <span className="cost-label">Fuel surcharge</span>
                <span className="cost-amt">{shipment.fuelSurcharge}</span>
              </div>
              <div className="cost-row">
                <span className="cost-label">Handling fee</span>
                <span className="cost-amt">{shipment.handlingFee}</span>
              </div>
              <div className="cost-row total">
                <span className="cost-label">Total</span>
                <span className="cost-amt">{shipment.cost}</span>
              </div>
            </div>

            {/* Package info */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Package Info</span>
              </div>
              {[
                { k: "Weight",     v: shipment.weight    },
                { k: "Dimensions", v: shipment.dims      },
                { k: "Priority",   v: shipment.priority  },
                { k: "Carrier",    v: shipment.carrier   },
                { k: "Service",    v: shipment.service   },
              ].map(r => (
                <div key={r.k} className="info-row">
                  <span className="info-key">{r.k}</span>
                  <span className="info-val">{r.v}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="sd-panel">
              <div className="panel-head">
                <span className="panel-title">Quick Actions</span>
              </div>
              <div className="action-list">
                {ACTIONS.map(a => (
                  <button key={a.label} className="action-btn">
                    <span>{a.icon}</span>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
