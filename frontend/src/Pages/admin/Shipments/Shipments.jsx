import { useState } from "react";
import "./Shipments.css";

const ALL_SHIPMENTS = [
  { id: "#SP-9401", origin: "Lagos, NG",        dest: "London, UK",    carrier: "DHL Express",   status: "In Transit", date: "Mar 12", weight: "3.2 kg", cost: "$84.00",  priority: "Express",  statusBg: "#eef1fb", statusText: "#3a3f5c", dotColor: "#3a3f5c", priorityBg: "#fdf0ed", priorityText: "#c84b2f" },
  { id: "#SP-9312", origin: "Lagos, NG",         dest: "Berlin, DE",    carrier: "DHL Express",   status: "Delivered",  date: "Mar 10", weight: "0.9 kg", cost: "$42.50",  priority: "Standard", statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-9241", origin: "Kano, NG",          dest: "Paris, FR",     carrier: "DHL Express",   status: "Pending",    date: "Mar 12", weight: "2.1 kg", cost: "$61.00",  priority: "Standard", statusBg: "#fdf6e3", statusText: "#b07d2a", dotColor: "#b07d2a", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-9103", origin: "Abuja, NG",         dest: "New York, US",  carrier: "FedEx Intl.",   status: "In Transit", date: "Mar 11", weight: "1.8 kg", cost: "$97.20",  priority: "Express",  statusBg: "#eef1fb", statusText: "#3a3f5c", dotColor: "#3a3f5c", priorityBg: "#fdf0ed", priorityText: "#c84b2f" },
  { id: "#SP-8890", origin: "Ibadan, NG",         dest: "Toronto, CA",   carrier: "FedEx Intl.",   status: "Exception",  date: "Mar 10", weight: "3.5 kg", cost: "$110.00", priority: "Express",  statusBg: "#fdf0ed", statusText: "#c84b2f", dotColor: "#c84b2f", priorityBg: "#fdf0ed", priorityText: "#c84b2f" },
  { id: "#SP-8821", origin: "Lagos, NG",          dest: "London, UK",    carrier: "DHL Express",   status: "Delivered",  date: "Mar 12", weight: "4.2 kg", cost: "$88.00",  priority: "Standard", statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-8750", origin: "Port Harcourt, NG",  dest: "Amsterdam, NL", carrier: "UPS Worldwide", status: "Delivered",  date: "Mar 09", weight: "7.1 kg", cost: "$140.00", priority: "Freight",  statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f", priorityBg: "#eef1fb", priorityText: "#3a3f5c" },
  { id: "#SP-8644", origin: "Enugu, NG",          dest: "Milan, IT",     carrier: "UPS Worldwide", status: "In Transit", date: "Mar 09", weight: "2.8 kg", cost: "$78.40",  priority: "Standard", statusBg: "#eef1fb", statusText: "#3a3f5c", dotColor: "#3a3f5c", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-8510", origin: "Lagos, NG",          dest: "Sydney, AU",    carrier: "FedEx Intl.",   status: "In Transit", date: "Mar 08", weight: "1.2 kg", cost: "$132.00", priority: "Express",  statusBg: "#eef1fb", statusText: "#3a3f5c", dotColor: "#3a3f5c", priorityBg: "#fdf0ed", priorityText: "#c84b2f" },
  { id: "#SP-8401", origin: "Abuja, NG",          dest: "Dubai, AE",     carrier: "DHL Express",   status: "Delivered",  date: "Mar 07", weight: "5.6 kg", cost: "$95.80",  priority: "Standard", statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-8320", origin: "Kano, NG",           dest: "Riyadh, SA",    carrier: "UPS Worldwide", status: "Pending",    date: "Mar 12", weight: "1.4 kg", cost: "$54.00",  priority: "Standard", statusBg: "#fdf6e3", statusText: "#b07d2a", dotColor: "#b07d2a", priorityBg: "#f0eee8", priorityText: "#3a3f5c" },
  { id: "#SP-8200", origin: "Lagos, NG",          dest: "Singapore, SG", carrier: "FedEx Intl.",   status: "Delivered",  date: "Mar 06", weight: "0.7 kg", cost: "$118.50", priority: "Express",  statusBg: "#e8f5ee", statusText: "#2d7a4f", dotColor: "#2d7a4f", priorityBg: "#fdf0ed", priorityText: "#c84b2f" },
];

const CARRIERS  = ["All Carriers", "DHL Express", "FedEx Intl.", "UPS Worldwide"];
const STATUSES  = ["All", "In Transit", "Delivered", "Pending", "Exception"];
const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡" }, { label: "Shipments", icon: "◈" },
  { label: "Tracking",  icon: "◎" }, { label: "Analytics", icon: "◧" },
  { label: "Settings",  icon: "⊕" },
];

function NewShipmentModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    senderName: "", senderCity: "", senderAddress: "",
    recipientName: "", recipientCity: "", recipientAddress: "",
    weight: "", dimensions: "", carrier: "DHL Express", priority: "Standard", notes: "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="modal-overlay">

      <div className="modal-box">
        <div className="modal-head">
          <div>
            <div className="modal-title">New Shipment</div>
            <div className="modal-step">STEP {step} OF 2 — {step === 1 ? "ADDRESSES" : "PACKAGE DETAILS"}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-progress">
          <div className={`modal-progress-bar${step >= 1 ? " done" : ""}`} />
          <div className={`modal-progress-bar${step >= 2 ? " done" : ""}`} />
        </div>
        <div className="modal-body">
          {step === 1 ? (
            <div className="modal-grid">
              <div className="full"><span className="modal-section-label">Sender Details</span></div>
              <div><label className="field-label">Full Name</label><input className="field-input" value={form.senderName} onChange={e => set("senderName", e.target.value)} placeholder="e.g. James Okafor" /></div>
              <div><label className="field-label">City / State</label><input className="field-input" value={form.senderCity} onChange={e => set("senderCity", e.target.value)} placeholder="e.g. Lagos, NG" /></div>
              <div className="full"><label className="field-label">Address</label><input className="field-input" value={form.senderAddress} onChange={e => set("senderAddress", e.target.value)} placeholder="Street address" /></div>
              <div className="full"><hr className="modal-divider" /></div>
              <div className="full"><span className="modal-section-label">Recipient Details</span></div>
              <div><label className="field-label">Full Name</label><input className="field-input" value={form.recipientName} onChange={e => set("recipientName", e.target.value)} placeholder="e.g. Sarah Chen" /></div>
              <div><label className="field-label">City / Country</label><input className="field-input" value={form.recipientCity} onChange={e => set("recipientCity", e.target.value)} placeholder="e.g. London, UK" /></div>
              <div className="full"><label className="field-label">Address</label><input className="field-input" value={form.recipientAddress} onChange={e => set("recipientAddress", e.target.value)} placeholder="Street address" /></div>
            </div>
          ) : (
            <div className="modal-grid">
              <div className="full"><span className="modal-section-label">Package Info</span></div>
              <div><label className="field-label">Weight (kg)</label><input className="field-input" value={form.weight} onChange={e => set("weight", e.target.value)} placeholder="e.g. 2.5" /></div>
              <div><label className="field-label">Dimensions (cm)</label><input className="field-input" value={form.dimensions} onChange={e => set("dimensions", e.target.value)} placeholder="L × W × H" /></div>
              <div>
                <label className="field-label">Carrier</label>
                <select className="field-select" value={form.carrier} onChange={e => set("carrier", e.target.value)}>
                  {["DHL Express", "FedEx Intl.", "UPS Worldwide"].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Priority</label>
                <select className="field-select" value={form.priority} onChange={e => set("priority", e.target.value)}>
                  {["Standard", "Express", "Freight"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="full">
                <label className="field-label">Notes (optional)</label>
                <textarea className="field-textarea" rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Special handling instructions..." />
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-ghost" onClick={() => step === 1 ? onClose() : setStep(1)}>{step === 1 ? "Cancel" : "← Back"}</button>
          <button className="btn-confirm" onClick={() => step === 1 ? setStep(2) : onClose()}>{step === 1 ? "Next →" : "Create Shipment ✓"}</button>
        </div>
      </div>
    </div>
  );
}

export default function Shipments() {
  const [activeNav,     setActiveNav]     = useState("Shipments");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [carrierFilter, setCarrierFilter] = useState("All Carriers");
  const [selected,      setSelected]      = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [sortKey,       setSortKey]       = useState("date");
  const [sortDir,       setSortDir]       = useState("desc");

  const filtered = ALL_SHIPMENTS
    .filter(s => statusFilter === "All" || s.status === statusFilter)
    .filter(s => carrierFilter === "All Carriers" || s.carrier === carrierFilter)
    .filter(s => {
      const q = search.toLowerCase();
      return !q || s.id.toLowerCase().includes(q) || s.origin.toLowerCase().includes(q) || s.dest.toLowerCase().includes(q);
    });

  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(s => s.length === filtered.length && filtered.length > 0 ? [] : filtered.map(x => x.id));
  const handleSort   = key => { if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc"); else { setSortKey(key); setSortDir("asc"); } };
  const hasFilters   = statusFilter !== "All" || carrierFilter !== "All Carriers" || search;

  return (
    <>
      <div className="sp-shell">
        <aside className="sp-sidebar">
          {NAV_ICONS.map(n => (
            <div key={n.label} title={n.label} className={`sb-icon${activeNav === n.label ? " active" : ""}`} onClick={() => setActiveNav(n.label)}>{n.icon}</div>
          ))}
          <div className="sb-sep" />
          <div className="sb-bottom"><div className="sb-icon" title="Sign Out">↩</div></div>
        </aside>

        <main className="sp-main">
          <div className="sp-topbar">
            <div>
              <div className="sp-title">All <span>Shipments</span></div>
              <div className="sp-sub">{ALL_SHIPMENTS.length} total records — last updated Mar 12, 2026</div>
            </div>
            <div className="sp-actions">
              <button className="btn-outline">↓ Export CSV</button>
              <button className="btn-primary" onClick={() => setShowModal(true)}>+ New Shipment</button>
            </div>
          </div>

          <div className="filter-row">
            <div className="search-box">
              <span className="search-icon">⌕</span>
              <input placeholder="Search ID, origin, destination…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="filter-select" value={carrierFilter} onChange={e => setCarrierFilter(e.target.value)}>
              {CARRIERS.map(c => <option key={c}>{c}</option>)}
            </select>
            {hasFilters && (
              <button className="btn-clear" onClick={() => { setStatusFilter("All"); setCarrierFilter("All Carriers"); setSearch(""); }}>✕ Clear</button>
            )}
          </div>

          {selected.length > 0 && (
            <div className="bulk-bar">
              <span className="bulk-count">{selected.length} selected</span>
              <div className="bulk-sep" />
              <button className="bulk-btn">◈ Update Status</button>
              <button className="bulk-btn">↓ Download Labels</button>
              <button className="bulk-btn danger">✕ Delete</button>
              <button className="bulk-close" onClick={() => setSelected([])}>✕</button>
            </div>
          )}

          <div className="sp-panel">
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>
                      <div className={`cb${selected.length === filtered.length && filtered.length > 0 ? " checked" : ""}`} onClick={toggleAll}>
                        {selected.length === filtered.length && filtered.length > 0 ? "✓" : ""}
                      </div>
                    </th>
                    {[["id","ID"],["","Route"],["carrier","Carrier"],["weight","Weight"],["","Priority"],["cost","Cost"],["date","Date"],["","Status"],["",""]].map(([k,label],i) => (
                      <th key={i} onClick={() => k && handleSort(k)}>
                        {label}{k && <span className={`sort-icon${sortKey === k ? " active" : ""}`}>{sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "▲"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={10} className="tbl-empty">No shipments match your filters</td></tr>
                  ) : filtered.map(s => (
                    <tr key={s.id} className={selected.includes(s.id) ? "selected-row" : ""}>
                      <td><div className={`cb${selected.includes(s.id) ? " checked" : ""}`} onClick={() => toggleSelect(s.id)}>{selected.includes(s.id) ? "✓" : ""}</div></td>
                      <td><span className="ship-id">{s.id}</span></td>
                      <td><div className="ship-route"><span>{s.origin}</span><span className="route-arrow">→</span><span>{s.dest}</span></div></td>
                      <td><span className="carrier-pill">{s.carrier}</span></td>
                      <td className="td-mono">{s.weight}</td>
                      <td><span className="priority-chip" style={{ background: s.priorityBg, color: s.priorityText }}>{s.priority}</span></td>
                      <td className="td-bold">{s.cost}</td>
                      <td className="td-mono td-muted">{s.date}</td>
                      <td><span className="status-chip" style={{ background: s.statusBg, color: s.statusText }}><span className="chip-dot" style={{ background: s.dotColor }} />{s.status}</span></td>
                      <td><button className="row-action">Track →</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <span className="pg-info">Showing {filtered.length} of {ALL_SHIPMENTS.length} results</span>
              <div className="pg-btns">
                {["‹","1","2","3","›"].map((p,i) => <button key={i} className={`pg-btn${p==="1"?" active":""}`}>{p}</button>)}
              </div>
            </div>
          </div>
        </main>
      </div>
      {showModal && <NewShipmentModal onClose={() => setShowModal(false)} />}
    </>
  );
}
