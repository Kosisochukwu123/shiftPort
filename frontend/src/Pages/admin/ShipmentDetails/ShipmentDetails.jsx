import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./ShipmentDetails.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_META = {
  "Delivered":        { bg: "#e8f5ee", text: "#2d7a4f", dot: "#2d7a4f" },
  "On the Way":       { bg: "#eef1fb", text: "#3a3f5c", dot: "#3a3f5c" },
  "Dispatched":       { bg: "#fdf6e3", text: "#b07d2a", dot: "#b07d2a" },
  "Out for Delivery": { bg: "#fff3e0", text: "#e65100", dot: "#e65100" },
  "Issue Raised":     { bg: "#fdf0ed", text: "#c84b2f", dot: "#c84b2f" },
};

const STATUS_OPTIONS = [
  { label: "Dispatched",       dot: "#b07d2a" },
  { label: "On the Way",       dot: "#3a3f5c" },
  { label: "Out for Delivery", dot: "#e65100" },
  { label: "Delivered",        dot: "#2d7a4f" },
  { label: "Issue Raised",     dot: "#c84b2f" },
];

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard"  },
  { label: "Orders",    icon: "◈", path: "/shipments"   },
  { label: "Tracking",  icon: "◎", path: "/tracking"    },
  { label: "Reports",   icon: "◧", path: "/analytics"   },
  { label: "Settings",  icon: "⊕", path: "/settings"    },
];

// Progress % per status
const PROGRESS = {
  "Dispatched": 15, "On the Way": 50, "Out for Delivery": 80, "Delivered": 100, "Issue Raised": 40,
};

function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function ShipmentDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { authFetch, logout } = useAuth();

  const [activeNav,  setActiveNav]  = useState("Orders");
  const [dispatch,   setDispatch]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  // Status update modal
  const [showUpdate,   setShowUpdate]   = useState(false);
  const [newStatus,    setNewStatus]    = useState("");
  const [updateNote,   setUpdateNote]   = useState("");
  const [updateLoc,    setUpdateLoc]    = useState("");
  const [updating,     setUpdating]     = useState(false);
  const [toast,        setToast]        = useState("");

  // Copy link
  const [copied,       setCopied]       = useState(false);

  // ── Fetch dispatch ──────────────────────────────────────────────────────
  const fetchDispatch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await authFetch(`/api/dispatches/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Order not found.");
      setDispatch(data.dispatch);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, id]);

  useEffect(() => { fetchDispatch(); }, [fetchDispatch]);

  // ── Update status ───────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    setUpdating(true);
    try {
      const res  = await authFetch(`/api/dispatches/${id}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:      newStatus,
          description: updateNote.trim() || undefined,
          location:    updateLoc.trim()  || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDispatch(data.dispatch);
      setShowUpdate(false);
      setNewStatus(""); setUpdateNote(""); setUpdateLoc("");
      showToast(`✓ Status updated to "${newStatus}"`);
    } catch (err) {
      showToast(`⚠ ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Copy tracking link ──────────────────────────────────────────────────
  const copyLink = () => {
    const url = `${window.location.origin}/track/${dispatch.trackingId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── WhatsApp share ──────────────────────────────────────────────────────
  const waShare = () => {
    if (!dispatch) return "#";
    const url  = `${window.location.origin}/track/${dispatch.trackingId}`;
    const text = encodeURIComponent(
      `Hi ${dispatch.buyer?.name}! 📦 Update on your order.\n\n` +
      `Status: *${dispatch.status}*\nTracking ID: *${dispatch.trackingId}*\n\n` +
      `Track here 👇\n${url}`
    );
    return `https://wa.me/?text=${text}`;
  };

  // ── Progress % ──────────────────────────────────────────────────────────
  const progress = dispatch ? (PROGRESS[dispatch.status] || 20) : 0;

  // ── Waybill URL ─────────────────────────────────────────────────────────
  const waybillUrl = dispatch?.waybillUrl ? `${API_BASE}${dispatch.waybillUrl}` : null;
  const waybillIsPdf = dispatch?.waybillFilename?.toLowerCase().endsWith(".pdf");

  // ─────────────────────────────────────────────────────────────────────────
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
          <div className="sb-icon" title="Sign Out" onClick={() => { logout(); navigate("/login"); }}>↩</div>
        </div>
      </aside>

      <main className="sd-main">

        {/* Breadcrumb */}
        <div className="sd-breadcrumb">
          <button className="bc-link" onClick={() => navigate("/shipments")}>Orders</button>
          <span className="bc-sep">›</span>
          <span className="bc-current">{id}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div className="sd-loading">
            <div className="sd-spinner" />
            <div className="sd-loading-text">Loading order…</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="sd-error">
            <div className="sd-error-title">Order not found</div>
            <div className="sd-error-msg">{error}</div>
            <button className="sd-error-btn" onClick={fetchDispatch}>Try again</button>
          </div>
        )}

        {/* Content */}
        {!loading && dispatch && (() => {
          const sc = STATUS_META[dispatch.status] || STATUS_META["Dispatched"];
          return (
            <>
              {/* Header */}
              <div className="sd-header">
                <div className="sd-header-left">
                  <div className="sd-id-row">
                    <span className="sd-id">{dispatch.trackingId}</span>
                    <span className="status-chip" style={{ background: sc.bg, color: sc.text }}>
                      <span className="chip-dot" style={{ background: sc.dot }} />
                      {dispatch.status}
                    </span>
                  </div>
                  <div className="sd-ref">
                    {dispatch.courier?.name}
                    {dispatch.courier?.trackingNumber && ` · ${dispatch.courier.trackingNumber}`}
                  </div>
                </div>
                <div className="sd-header-actions">
                  <button className="btn-outline"
                    onClick={() => window.open(`/track/${dispatch.trackingId}`, "_blank")}>
                    ◎ Buyer View
                  </button>
                  <button className="btn-primary" onClick={() => { setNewStatus(dispatch.status); setShowUpdate(true); }}>
                    ◈ Update Status
                  </button>
                </div>
              </div>

              {/* Route progress */}
              <div className="sd-route-bar">
                <div className="route-endpoint">
                  <div className="route-city">{dispatch.sellerName || "Seller"}</div>
                  <div className="route-country">Origin</div>
                  <div className="route-code">NGN</div>
                </div>
                <div className="route-track">
                  <span className="route-icon">📦</span>
                  <div className="route-line">
                    <div className="route-line-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="route-pct">{progress}% complete · {dispatch.status}</span>
                </div>
                <div className="route-endpoint right">
                  <div className="route-city">{dispatch.buyer?.name?.split(" ")[0] || "Buyer"}</div>
                  <div className="route-country">Destination</div>
                  <div className="route-code">DEST</div>
                </div>
              </div>

              {/* Main grid */}
              <div className="sd-grid">

                {/* LEFT column */}
                <div>

                  {/* Order details */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Order Details</span>
                    </div>
                    <div className="detail-grid">
                      {[
                        { label: "Tracking ID",    val: dispatch.trackingId },
                        { label: "Status",         val: dispatch.status },
                        { label: "Courier",        val: dispatch.courier?.name },
                        { label: "Courier Ref.",   val: dispatch.courier?.trackingNumber || "—" },
                        { label: "Dispatched On",  val: formatDate(dispatch.createdAt) },
                        { label: "Last Updated",   val: formatDateTime(dispatch.updatedAt) },
                        { label: "Waybill",        val: dispatch.waybillFilename || "Uploaded" },
                        { label: "Notes",          val: dispatch.notes || "—" },
                      ].map(d => (
                        <div key={d.label} className="detail-cell">
                          <div className="detail-label">{d.label}</div>
                          <div className="detail-val">{d.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buyer info */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Buyer Information</span>
                    </div>
                    <div className="buyer-section">
                      <div className="buyer-badge">Customer</div>
                      <div className="buyer-full-name">{dispatch.buyer?.name}</div>
                      <div className="buyer-detail-row">📞 {dispatch.buyer?.phone || "—"}</div>
                      {dispatch.buyer?.email && (
                        <div className="buyer-detail-row">✉ {dispatch.buyer.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Tracking timeline */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Tracking Timeline</span>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.08em" }}>
                        {dispatch.timeline?.length || 0} events
                      </span>
                    </div>
                    <div className="tl-wrap">
                      {(!dispatch.timeline || dispatch.timeline.length === 0) ? (
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.04em", textAlign: "center", padding: "20px 0" }}>
                          No timeline events yet.
                        </div>
                      ) : [...dispatch.timeline].reverse().map((ev, i, arr) => {
                        const isFirst = i === 0;
                        const isLast  = i === arr.length - 1;
                        const isDone  = !isFirst;
                        const isExc   = ev.status === "Issue Raised";
                        return (
                          <div key={i} className="tl-item">
                            <div className="tl-spine">
                              <div className={`tl-dot ${isFirst ? "active" : isDone ? "done" : "pending"}${isExc ? " exception" : ""}`}>
                                {isExc ? "!" : isFirst ? "●" : "✓"}
                              </div>
                              {!isLast && <div className={`tl-line${isDone ? " done" : " faded"}`} />}
                            </div>
                            <div className={`tl-body${isLast ? " last" : ""}`}>
                              <div className="tl-date">{formatDateTime(ev.timestamp)}</div>
                              <div className={`tl-desc${isExc ? " exc" : ""}`}>{ev.description}</div>
                              {ev.location && <div className="tl-loc">{ev.location}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* RIGHT sidebar */}
                <div>

                  {/* Share tracking */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Share Tracking Link</span>
                    </div>
                    <div style={{ padding: "14px 20px" }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.06em", marginBottom: 12, lineHeight: 1.6 }}>
                        Send this link to your buyer so they can track the order.
                      </div>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--rust)", letterSpacing: "0.06em", background: "var(--rust-pale)", padding: "8px 12px", marginBottom: 12, wordBreak: "break-all" }}>
                        /track/{dispatch.trackingId}
                      </div>
                    </div>
                    <div className="sd-share-row">
                      <a className="sd-wa-btn" href={waShare()} target="_blank" rel="noopener noreferrer">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WhatsApp
                      </a>
                      <button className={`sd-copy-btn${copied ? " copied" : ""}`} onClick={copyLink}>
                        {copied ? "✓ Copied" : "⊕ Copy"}
                      </button>
                    </div>
                  </div>

                  {/* Waybill proof */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Dispatch Proof</span>
                      {waybillUrl && (
                        <a className="panel-action" href={waybillUrl} target="_blank" rel="noopener noreferrer">
                          View full ↗
                        </a>
                      )}
                    </div>
                    <div className="waybill-section">
                      {waybillUrl ? (
                        waybillIsPdf ? (
                          <div className="waybill-pdf">
                            <div className="waybill-pdf-icon">📄</div>
                            <div className="waybill-pdf-label">PDF Waybill uploaded</div>
                          </div>
                        ) : (
                          <img src={waybillUrl} alt="Waybill" className="waybill-img" />
                        )
                      ) : (
                        <div className="no-waybill">
                          <div className="no-waybill-icon">⚠️</div>
                          <div className="no-waybill-text">No waybill uploaded for this order yet.</div>
                        </div>
                      )}
                      {waybillUrl && (
                        <div className="waybill-footer">
                          <span className="waybill-footer-label">🛡️ Proof verified</span>
                          <a className="waybill-footer-link" href={waybillUrl} target="_blank" rel="noopener noreferrer">
                            Download →
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick actions */}
                  <div className="sd-panel">
                    <div className="panel-head">
                      <span className="panel-title">Quick Actions</span>
                    </div>
                    <div className="action-list">
                      <button className="action-btn primary-action"
                        onClick={() => { setNewStatus(dispatch.status); setShowUpdate(true); }}>
                        <span>◈</span> Update Order Status
                      </button>
                      <button className="action-btn"
                        onClick={() => window.open(`/track/${dispatch.trackingId}`, "_blank")}>
                        <span>◎</span> Open Buyer Tracking Page
                      </button>
                      <button className="action-btn" onClick={copyLink}>
                        <span>⊕</span> Copy Tracking Link
                      </button>
                      <button className="action-btn" onClick={() => navigate("/create-dispatch")}>
                        <span>+</span> Create New Dispatch
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </>
          );
        })()}
      </main>

      {/* ── STATUS UPDATE MODAL ── */}
      {showUpdate && (
        <div className="su-overlay" onClick={e => { if (e.target === e.currentTarget) setShowUpdate(false); }}>
          <div className="su-modal">
            <div className="su-head">
              <div className="su-title">Update Order Status</div>
              <button className="su-close" onClick={() => setShowUpdate(false)}>✕</button>
            </div>
            <div className="su-body">
              <div>
                <span className="su-label">New Status</span>
                <div className="su-statuses">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.label}
                      className={`su-status-btn${newStatus === s.label ? " selected" : ""}`}
                      onClick={() => setNewStatus(s.label)}>
                      <span className="su-status-dot" style={{ background: s.dot }} />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="su-label">Location (optional)</span>
                <input className="su-input" placeholder="e.g. Lagos Sorting Hub"
                  value={updateLoc} onChange={e => setUpdateLoc(e.target.value)} />
              </div>
              <div>
                <span className="su-label">Note to buyer (optional)</span>
                <input className="su-input"
                  placeholder="e.g. Package cleared customs, en route to delivery"
                  value={updateNote} onChange={e => setUpdateNote(e.target.value)} />
              </div>
            </div>
            <div className="su-foot">
              <button className="su-btn-cancel" onClick={() => setShowUpdate(false)}>Cancel</button>
              <button className="su-btn-confirm" onClick={handleUpdateStatus}
                disabled={!newStatus || updating}>
                {updating ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} /></> : null}
                {updating ? " Saving…" : "Save Update →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="sd-toast">{toast}</div>
      )}

    </div>
  );
}
