import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./UpdateStatus.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { key: "dispatched",  label: "Dispatched",       cls: "dispatched",  color: "#b07d2a", bg: "#fdf6e3", dot: "#b07d2a" },
  { key: "ontheway",    label: "On the Way",        cls: "ontheway",    color: "#3a3f5c", bg: "#eef1fb", dot: "#3a3f5c" },
  { key: "outdelivery", label: "Out for Delivery",  cls: "outdelivery", color: "#e65100", bg: "#fff3e0", dot: "#e65100" },
  { key: "delivered",   label: "Delivered",         cls: "delivered",   color: "#2d7a4f", bg: "#e8f5ee", dot: "#2d7a4f" },
  { key: "issue",       label: "Issue Raised",      cls: "issue",       color: "#c84b2f", bg: "#fdf0ed", dot: "#c84b2f" },
];

// Map DB status string → option key
const STATUS_TO_KEY = {
  "Dispatched":       "dispatched",
  "On the Way":       "ontheway",
  "Out for Delivery": "outdelivery",
  "Delivered":        "delivered",
  "Issue Raised":     "issue",
};

// Pipeline steps (for the visual bar at the top)
const PIPELINE_STEPS = [
  { label: "Dispatched",      icon: "📦" },
  { label: "On the Way",      icon: "🚚" },
  { label: "Out for Delivery", icon: "🛵" },
  { label: "Delivered",       icon: "✅" },
];
const PIPELINE_INDEX = { "Dispatched": 0, "On the Way": 1, "Out for Delivery": 2, "Delivered": 3, "Issue Raised": -1 };

const FILTER_TABS = ["All Active", "Dispatched", "On the Way", "Out for Delivery", "Issue Raised", "Delivered"];

const NAV_ICONS = [
  { label: "Dashboard",      icon: "⬡", path: "/dashboard"       },
  { label: "Orders",         icon: "◈", path: "/shipments"        },
  { label: "Update Status",  icon: "◎", path: "/update-status"   },
  { label: "Reports",        icon: "◧", path: "/analytics"        },
  { label: "Settings",       icon: "⊕", path: "/settings"         },
];

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function UpdateStatus() {
  const navigate = useNavigate();
  const { authFetch, logout } = useAuth();

  // Data
  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  // UI
  const [filter,    setFilter]    = useState("All Active");
  const [search,    setSearch]    = useState("");
  const [searchRaw, setSearchRaw] = useState("");
  const [selected,  setSelected]  = useState(new Set());
  const [toast,     setToast]     = useState("");
  const [sideNav,   setSideNav]   = useState("Update Status");

  // Per-card state: { [trackingId]: { status, note, saving, saved } }
  const [cardState, setCardState] = useState({});

  const searchTimer = useRef(null);

  // ── Fetch all orders (no pagination — we want everything active) ─────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await authFetch("/api/dispatches?limit=200");
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const all = data.dispatches || [];
      setOrders(all);

      // Initialise card state from current DB status
      const initial = {};
      all.forEach(o => {
        initial[o.trackingId] = {
          status: STATUS_TO_KEY[o.status] || "dispatched",
          note:   "",
          saving: false,
          saved:  false,
        };
      });
      setCardState(initial);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearch(searchRaw), 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchRaw]);

  // ── Card state helpers ──────────────────────────────────────────────────
  const setCardField = (id, field, value) =>
    setCardState(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));

  // ── Save single card ────────────────────────────────────────────────────
  const saveCard = async (order) => {
    const cs = cardState[order.trackingId];
    if (!cs) return;

    const opt = STATUS_OPTIONS.find(s => s.key === cs.status);
    if (!opt) return;

    setCardField(order.trackingId, "saving", true);

    try {
      const res  = await authFetch(`/api/dispatches/${order.trackingId}/status`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:      opt.label,
          description: cs.note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      // Update the local order status
      setOrders(prev => prev.map(o =>
        o.trackingId === order.trackingId ? { ...o, status: opt.label } : o
      ));

      setCardField(order.trackingId, "saving", false);
      setCardField(order.trackingId, "saved",  true);
      setCardField(order.trackingId, "note",   "");

      setTimeout(() => setCardField(order.trackingId, "saved", false), 2200);

    } catch (err) {
      setCardField(order.trackingId, "saving", false);
      showToast(`⚠ ${err.message}`);
    }
  };

  // ── Bulk update ─────────────────────────────────────────────────────────
  const bulkUpdate = async (statusKey) => {
    const opt = STATUS_OPTIONS.find(s => s.key === statusKey);
    if (!opt) return;

    const ids = [...selected];
    let done = 0;

    for (const id of ids) {
      try {
        const res = await authFetch(`/api/dispatches/${id}/status`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ status: opt.label }),
        });
        const data = await res.json();
        if (data.success) {
          done++;
          setOrders(prev => prev.map(o => o.trackingId === id ? { ...o, status: opt.label } : o));
          setCardField(id, "status", statusKey);
        }
      } catch (_) {}
    }

    setSelected(new Set());
    showToast(`✓ Updated ${done} order${done !== 1 ? "s" : ""} to "${opt.label}"`);
  };

  // ── Toast ───────────────────────────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // ── Selection ───────────────────────────────────────────────────────────
  const toggleSelect = (id) =>
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  // ── Filtered list ───────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchSearch = !search ||
      o.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.buyer?.phone?.includes(search);

    const matchFilter =
      filter === "All Active" ? o.status !== "Delivered" :
      filter === "Delivered"  ? o.status === "Delivered"  :
      o.status === filter;

    return matchSearch && matchFilter;
  });

  // ── Counts for summary strip ────────────────────────────────────────────
  const counts = {
    active:      orders.filter(o => o.status !== "Delivered").length,
    dispatched:  orders.filter(o => o.status === "Dispatched").length,
    onWay:       orders.filter(o => o.status === "On the Way").length,
    outDelivery: orders.filter(o => o.status === "Out for Delivery").length,
    issues:      orders.filter(o => o.status === "Issue Raised").length,
  };

  // ── Pipeline dot state for a given status ───────────────────────────────
  const pipelineState = (stepLabel, currentStatus) => {
    const cur = PIPELINE_INDEX[currentStatus] ?? -1;
    const idx = PIPELINE_INDEX[stepLabel]     ?? -1;
    if (cur === -1) return "pending";
    if (idx < cur)  return "done";
    if (idx === cur) return "active";
    return "pending";
  };

  // ── WhatsApp update share ───────────────────────────────────────────────
  const waShare = (order, statusLabel) => {
    const url  = `${window.location.origin}/track/${order.trackingId}`;
    const text = encodeURIComponent(
      `Hi ${order.buyer?.name}! 📦 Update on your order.\n\n` +
      `Status: *${statusLabel}*\nTracking ID: *${order.trackingId}*\n\n` +
      `Track here 👇\n${url}`
    );
    return `https://wa.me/${order.buyer?.phone?.replace(/\D/g, "") || ""}?text=${text}`;
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="us-shell">

      {/* Sidebar */}
      <aside className="db-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${sideNav === n.label ? " active" : ""}`}
            onClick={() => { setSideNav(n.label); navigate(n.path); }}>
            {n.icon}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out" onClick={() => { logout(); navigate("/login"); }}>↩</div>
        </div>
      </aside>

      <main className="us-main">

        {/* Header */}
        <div className="us-header">
          <div>
            <div className="us-title">Update <span>Order Status</span></div>
            <div className="us-sub">
              {loading ? "Loading orders…" : `${counts.active} active order${counts.active !== 1 ? "s" : ""} need attention`}
            </div>
          </div>
          <div className="us-header-actions">
            <button className="us-back-btn" onClick={() => navigate("/dashboard")}>
              ← Dashboard
            </button>
            <button className="us-back-btn" onClick={fetchOrders}>
              ↺ Refresh
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="us-error">
            <span>⚠</span><span>{error}</span>
            <button className="us-error-retry" onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {/* Pipeline visual */}
        {!loading && (
          <div className="us-pipeline">
            <div className="us-pipeline-label">Order journey</div>
            <div className="us-pipeline-steps">
              {PIPELINE_STEPS.map((step, i) => (
                <>
                  <div key={step.label} className="us-step"
                    onClick={() => setFilter(step.label)}>
                    <div className="us-step-dot">{step.icon}</div>
                    <div className="us-step-label">
                      {step.label}<br />
                      <span style={{ fontWeight: 700, color: "var(--ink)" }}>
                        {orders.filter(o => o.status === step.label).length}
                      </span>
                    </div>
                  </div>
                  {i < PIPELINE_STEPS.length - 1 && (
                    <div key={`conn-${i}`}
                      className={`us-step-connector${
                        orders.filter(o => PIPELINE_INDEX[o.status] > i).length > 0 ? " done" : ""
                      }`}
                    />
                  )}
                </>
              ))}
            </div>
          </div>
        )}

        {/* Summary strip */}
        {!loading && (
          <div className="us-summary">
            <div className="us-summary-item urgent" onClick={() => setFilter("All Active")} style={{ cursor: "pointer" }}>
              <div className="us-summary-count">{counts.active}</div>
              <div className="us-summary-label">Active orders</div>
            </div>
            <div className="us-summary-item" onClick={() => setFilter("Dispatched")} style={{ cursor: "pointer" }}>
              <div className="us-summary-count">{counts.dispatched}</div>
              <div className="us-summary-label">Dispatched</div>
            </div>
            <div className="us-summary-item" onClick={() => setFilter("On the Way")} style={{ cursor: "pointer" }}>
              <div className="us-summary-count">{counts.onWay}</div>
              <div className="us-summary-label">On the way</div>
            </div>
            <div className="us-summary-item urgent" onClick={() => setFilter("Issue Raised")} style={{ cursor: "pointer" }}>
              <div className="us-summary-count">{counts.issues}</div>
              <div className="us-summary-label">Issues raised</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="us-filters">
          <div className="us-search">
            <span className="us-search-icon">⌕</span>
            <input placeholder="Search tracking ID, buyer name, phone…"
              value={searchRaw}
              onChange={e => setSearchRaw(e.target.value)} />
          </div>
          {FILTER_TABS.map(f => (
            <button key={f}
              className={`us-filter-btn${filter === f ? " active" : ""}`}
              onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        {loading ? (
          <div className="us-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="us-card">
                <div style={{ height: 3, background: "#e8e6e0" }} />
                <div className="us-card-body">
                  <div className="skeleton" style={{ height: 13, width: "40%", marginBottom: 10, borderRadius: 2 }} />
                  <div className="skeleton" style={{ height: 16, width: "65%", marginBottom: 6, borderRadius: 2 }} />
                  <div className="skeleton" style={{ height: 11, width: "50%", borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="us-empty">
            <div className="us-empty-icon">
              {filter === "All Active" ? "🎉" : "📭"}
            </div>
            <div className="us-empty-title">
              {filter === "All Active" ? "All orders are delivered!" : `No "${filter}" orders`}
            </div>
            <div className="us-empty-sub">
              {filter === "All Active"
                ? "Every active order has been delivered. Great work!"
                : "Try a different filter or create a new dispatch."}
            </div>
          </div>
        ) : (
          <div className="us-grid">
            {filtered.map(order => {
              const cs  = cardState[order.trackingId] || { status: "dispatched", note: "", saving: false, saved: false };
              const opt = STATUS_OPTIONS.find(s => s.key === cs.status) || STATUS_OPTIONS[0];
              const isSelected = selected.has(order.trackingId);
              const currentDbStatusKey = STATUS_TO_KEY[order.status] || "dispatched";
              const isDirty = cs.status !== currentDbStatusKey;

              return (
                <div key={order.trackingId}
                  className={`us-card${isSelected ? " selected" : ""}`}>

                  {/* Top accent bar — colour = current DB status */}
                  <div className="us-card-accent"
                    style={{ background: STATUS_OPTIONS.find(s => s.key === currentDbStatusKey)?.color || "#b07d2a" }} />

                  {/* Saved flash */}
                  {cs.saved && (
                    <div className="us-saved-flash">
                      <div className="us-saved-icon">✓</div>
                      <div className="us-saved-label">Status updated!</div>
                    </div>
                  )}

                  <div className="us-card-body">
                    <div className="us-card-top">
                      {/* Checkbox + ID */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{ width: 16, height: 16, border: `1.5px solid ${isSelected ? "#3a3f5c" : "var(--mist)"}`, background: isSelected ? "#3a3f5c" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "white", flexShrink: 0 }}
                          onClick={() => toggleSelect(order.trackingId)}>
                          {isSelected ? "✓" : ""}
                        </div>
                        <span className="us-card-id"
                          onClick={() => navigate(`/shipments/${order.trackingId}`)}>
                          {order.trackingId}
                        </span>
                      </div>

                      {/* Current status chip */}
                      <span className="us-status-chip"
                        style={{ background: STATUS_OPTIONS.find(s => s.key === currentDbStatusKey)?.bg, color: STATUS_OPTIONS.find(s => s.key === currentDbStatusKey)?.color }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
                        {order.status}
                      </span>
                    </div>

                    <div className="us-card-buyer">{order.buyer?.name}</div>

                    <div className="us-card-meta">
                      <span className="us-card-meta-item">📞 {order.buyer?.phone}</span>
                      <span className="us-card-meta-item">🚚 {order.courier?.name}</span>
                      <span className="us-card-meta-item">🕐 {timeAgo(order.createdAt)}</span>
                    </div>

                    <div>
                      <span className={`us-proof${order.waybillUrl ? " ok" : " missing"}`}>
                        {order.waybillUrl ? "✓ Proof saved" : "⚠ No waybill"}
                      </span>
                    </div>
                  </div>

                  {/* Update controls */}
                  <div className="us-card-footer">

                    {/* Status options */}
                    <div className="us-status-row">
                      {STATUS_OPTIONS.map(s => (
                        <button key={s.key}
                          className={`us-status-opt${cs.status === s.key ? ` chosen ${s.cls}` : ""}`}
                          onClick={() => setCardField(order.trackingId, "status", s.key)}>
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {/* Note input */}
                    <input
                      className="us-note-input"
                      placeholder="Add a note for the buyer (optional)…"
                      value={cs.note}
                      onChange={e => setCardField(order.trackingId, "note", e.target.value)}
                    />

                    {/* Actions */}
                    <div className="us-card-actions">
                      <button
                        className={`us-btn-save${cs.saving ? " saving" : ""}`}
                        onClick={() => saveCard(order)}
                        disabled={cs.saving || !isDirty}>
                        {cs.saving
                          ? <><div className="us-spinner" /> Saving…</>
                          : isDirty ? `Save — ${opt.label}` : "No changes"
                        }
                      </button>

                      {/* WhatsApp share current status */}
                      <a className="us-btn-wa"
                        href={waShare(order, opt.label)}
                        target="_blank" rel="noopener noreferrer"
                        title="Share update on WhatsApp">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </a>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom padding for bulk bar */}
        {selected.size > 0 && <div style={{ height: 72 }} />}
      </main>

      {/* ── BULK UPDATE BAR (appears when cards are selected) ── */}
      {selected.size > 0 && (
        <div className="us-bulk">
          <div className="us-bulk-count">{selected.size} selected</div>
          <div className="us-bulk-sep" />
          <div className="us-bulk-label">Set all to</div>
          <div className="us-bulk-statuses">
            {STATUS_OPTIONS.map(s => (
              <button key={s.key} className="us-bulk-opt"
                onClick={() => bulkUpdate(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
          <button className="us-bulk-close" onClick={() => setSelected(new Set())}>✕</button>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="us-toast">{toast}</div>}

    </div>
  );
}
