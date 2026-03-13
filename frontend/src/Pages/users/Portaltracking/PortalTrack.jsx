import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PortalTrack.css";

const MOCK_DATA = {
  "SP-9401": {
    status: "transit", carrier: "DHL Express", weight: "2.4 kg", service: "Express International",
    origin: "Lagos, Nigeria", dest: "London, United Kingdom", eta: "14 Mar 2026",
    events: [
      { event: "Shipment picked up",           loc: "Lagos, Ikeja",       time: "12 Mar · 08:14",  done: true,  active: false },
      { event: "Departed Lagos hub",            loc: "Lagos, Murtala Mohammed Airport", time: "12 Mar · 14:30", done: true,  active: false },
      { event: "In transit — customs clearance", loc: "Heathrow, UK",      time: "13 Mar · 09:00",  done: false, active: true  },
      { event: "Out for delivery",              loc: "London SE1",         time: "Expected 14 Mar", done: false, active: false },
      { event: "Delivered",                     loc: "London, UK",         time: "Expected 14 Mar", done: false, active: false },
    ]
  },
  "SP-9388": {
    status: "delivered", carrier: "FedEx International", weight: "1.1 kg", service: "Priority Overnight",
    origin: "Lagos, Nigeria", dest: "New York, USA", eta: "10 Mar 2026",
    events: [
      { event: "Shipment picked up",   loc: "Lagos",        time: "8 Mar · 10:00",  done: true, active: false },
      { event: "Departed Lagos hub",   loc: "Lagos Airport",time: "8 Mar · 22:45",  done: true, active: false },
      { event: "Arrived JFK sorting",  loc: "New York",     time: "9 Mar · 07:30",  done: true, active: false },
      { event: "Out for delivery",     loc: "Manhattan",    time: "10 Mar · 09:15", done: true, active: false },
      { event: "Delivered — Signed by RECEPTIONIST", loc: "New York, NY", time: "10 Mar · 13:44", done: true, active: true },
    ]
  },
  "SP-9352": {
    status: "pending", carrier: "UPS Worldwide", weight: "5.0 kg", service: "Saver International",
    origin: "Abuja, Nigeria", dest: "Dubai, UAE", eta: "16 Mar 2026",
    events: [
      { event: "Label created",        loc: "Abuja",       time: "9 Mar · 16:00",  done: true, active: false },
      { event: "Awaiting pickup",      loc: "Abuja CBD",   time: "Scheduled 13 Mar", done: false, active: true },
      { event: "In transit",           loc: "—",           time: "—", done: false, active: false },
      { event: "Customs clearance",    loc: "Dubai",       time: "—", done: false, active: false },
      { event: "Delivered",            loc: "Dubai, UAE",  time: "Expected 16 Mar", done: false, active: false },
    ]
  },
  "SP-9320": {
    status: "exception", carrier: "DHL Express", weight: "0.8 kg", service: "Express International",
    origin: "Lagos, Nigeria", dest: "Berlin, Germany", eta: "TBD",
    events: [
      { event: "Shipment picked up",   loc: "Lagos",        time: "7 Mar · 11:00", done: true, active: false },
      { event: "Departed Lagos hub",   loc: "Lagos Airport",time: "7 Mar · 20:00", done: true, active: false },
      { event: "⚠ Address query — held at sorting facility", loc: "Frankfurt Hub", time: "9 Mar · 06:30", done: false, active: true },
      { event: "Out for delivery",     loc: "Berlin",       time: "—", done: false, active: false },
      { event: "Delivered",            loc: "Berlin, Germany", time: "—", done: false, active: false },
    ]
  },
};

const RECENT = ["SP-9401", "SP-9388", "SP-9352"];

export default function PortalTrack() {
  const navigate  = useNavigate();
  const { search } = useLocation();
  const params    = new URLSearchParams(search);

  const [trackId, setTrackId] = useState(params.get("id") || "");
  const [result,  setResult]  = useState(params.get("id") ? MOCK_DATA[params.get("id")] || null : undefined);
  const [searched, setSearched] = useState(!!params.get("id"));

  const doTrack = (id) => {
    const q = (id || trackId).trim().toUpperCase();
    setSearched(true);
    setResult(MOCK_DATA[q] || null);
    setTrackId(q);
  };

  return (
    <div className="portal-page">

      {/* Search hero */}
      <div className="pt-search-hero">
        <div className="pt-hero-label">Live Tracking</div>
        <div className="pt-hero-title">Where is my package?</div>
        <div className="pt-search-row">
          <input className="pt-search-input" placeholder="Enter tracking ID e.g. SP-9401"
            value={trackId} onChange={e => setTrackId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doTrack()} />
          <button className="pt-search-btn" onClick={() => doTrack()}> <span>Track</span>→</button>
        </div>
        <div className="pt-recents">
          <span className="pt-recent-label">Recent:</span>
          {RECENT.map(r => (
            <span key={r} className="pt-chip" onClick={() => doTrack(r)}>{r}</span>
          ))}
        </div>
      </div>

      {/* Results */}
      {!searched && (
        <div className="pt-no-result">Enter a tracking ID above to see the status of your shipment.</div>
      )}

      {searched && !result && (
        <div className="pt-no-result">⚠ No shipment found for "{trackId}". Check the ID and try again.</div>
      )}

      {searched && result && (
        <>
          {result.status === "exception" && (
            <div className="pt-exception">
              <div className="pt-exception-icon">⚠</div>
              <div>Action required — your shipment has been held. Please contact support with your tracking ID.</div>
            </div>
          )}

          <div className="pt-result-grid">
            {/* Timeline */}
            <div className="pt-timeline-card">
              <div className="pd-card-head" style={{ padding: "18px 24px", borderBottom: "1px solid #e8e6e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="pd-card-title">Tracking Timeline</div>
                <span className={`pt-detail-status ${result.status}`}>{result.status.toUpperCase()}</span>
              </div>
              <div className="pt-timeline">
                {result.events.map((ev, i) => (
                  <div key={i} className="pt-tl-item">
                    <div className="pt-tl-left">
                      <div className={`pt-tl-dot${ev.active ? " active" : ev.done ? " done" : ""}`} />
                      {i < result.events.length - 1 && <div className={`pt-tl-line${ev.done ? " done" : ""}`} />}
                    </div>
                    <div className="pt-tl-right">
                      <div className={`pt-tl-event${!ev.done && !ev.active ? " muted" : ""}`}>{ev.event}</div>
                      <div className="pt-tl-loc">{ev.loc}</div>
                      <div className="pt-tl-time">{ev.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details sidebar */}
            <div>
              <div className="pt-detail-card">
                <div className="pt-detail-head">
                  <div className="pt-detail-id">{trackId}</div>
                  <div className="pt-detail-status" style={{ marginTop: 4 }}
                    className={`pt-detail-status ${result.status}`}>{result.status.toUpperCase()}</div>
                </div>
                {[
                  ["Carrier",  result.carrier],
                  ["Service",  result.service],
                  ["Origin",   result.origin],
                  ["Destination", result.dest],
                  ["Weight",   result.weight],
                  ["Est. Delivery", result.eta],
                ].map(([k, v]) => (
                  <div key={k} className="pt-detail-row">
                    <div className="pt-detail-key">{k}</div>
                    <div className="pt-detail-val">{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16 }}>
                <button className="pd-action-btn" style={{ width: "100%", padding: "12px 16px", background: "#fff", border: "1.5px solid #e8e6e0", fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#0a0a0f", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s ease" }}
                  onClick={() => navigate("/portal/new")}>
                  📦 Book a new shipment
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
