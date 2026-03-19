import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Shipments.css";

const STATUS_META = {
  "Delivered":        { bg: "#e8f5ee", text: "#2d7a4f", dot: "#2d7a4f" },
  "On the Way":       { bg: "#eef1fb", text: "#3a3f5c", dot: "#3a3f5c" },
  "Dispatched":       { bg: "#fdf6e3", text: "#b07d2a", dot: "#b07d2a" },
  "Out for Delivery": { bg: "#fff3e0", text: "#e65100", dot: "#e65100" },
  "Issue Raised":     { bg: "#fdf0ed", text: "#c84b2f", dot: "#c84b2f" },
};

const STATUSES  = ["All", "Dispatched", "On the Way", "Out for Delivery", "Delivered", "Issue Raised"];
const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard"  },
  { label: "Orders",    icon: "◈", path: "/shipments"   },
  { label: "Tracking",  icon: "◎", path: "/tracking"    },
  { label: "Reports",   icon: "◧", path: "/analytics"   },
  { label: "Settings",  icon: "⊕", path: "/settings"    },
];

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

export default function Shipments() {
  const navigate = useNavigate();
  const { authFetch, logout } = useAuth();

  // UI state
  const [activeNav,     setActiveNav]     = useState("Orders");
  const [search,        setSearch]        = useState("");
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [selected,      setSelected]      = useState([]);
  const [sortKey,       setSortKey]       = useState("createdAt");
  const [sortDir,       setSortDir]       = useState("desc");
  const [page,          setPage]          = useState(1);
  const [searchInput,   setSearchInput]   = useState("");

  // Data state
  const [orders,   setOrders]  = useState([]);
  const [total,    setTotal]   = useState(0);
  const [pages,    setPages]   = useState(1);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState("");

  const LIMIT = 12;

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(statusFilter !== "All" && { status: statusFilter }),
        ...(search && { search }),
      });
      const res  = await authFetch(`/api/dispatches?${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to load orders.");
      setOrders(data.dispatches || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
      setSelected([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Search debounce ───────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── Filter change ─────────────────────────────────────────────────────
  const handleFilter = f => { setStatusFilter(f); setPage(1); };

  // ── Sort ──────────────────────────────────────────────────────────────
  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  // Client-side sort on fetched page
  const sorted = [...orders].sort((a, b) => {
    let av = a[sortKey] || "", bv = b[sortKey] || "";
    if (sortKey === "buyer") { av = a.buyer?.name || ""; bv = b.buyer?.name || ""; }
    if (sortKey === "courier") { av = a.courier?.name || ""; bv = b.courier?.name || ""; }
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // ── Select ────────────────────────────────────────────────────────────
  const toggleSelect = id => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll    = () => setSelected(s => s.length === sorted.length ? [] : sorted.map(x => x.trackingId));

  const hasFilters = statusFilter !== "All" || search;

  const SortIcon = ({ k }) => (
    <span className={`sort-icon${sortKey === k ? " active" : ""}`}>
      {sortKey === k ? (sortDir === "asc" ? "▲" : "▼") : "▲"}
    </span>
  );

  // ── Skeleton rows ─────────────────────────────────────────────────────
  const SkeletonRow = () => (
    <tr>
      {[44, 100, 140, 100, 80, 80, 80, 90, 70].map((w, i) => (
        <td key={i}><div className="skeleton" style={{ height: 12, width: w, borderRadius: 2 }} /></td>
      ))}
    </tr>
  );

  return (
    <div className="sp-shell">
      <aside className="sp-sidebar">
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

      <main className="sp-main">
        {/* Topbar */}
        <div className="sp-topbar">
          <div>
            <div className="sp-title">All <span>Orders</span></div>
            <div className="sp-sub">
              {loading ? "Loading…" : `${total} total order${total !== 1 ? "s" : ""}`}
            </div>
          </div>
          <div className="sp-actions">
            <button className="btn-outline" onClick={fetchOrders}>↺ Refresh</button>
            <button className="btn-primary" onClick={() => navigate("/create-dispatch")}>
              + Create Dispatch
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="sp-error">
            <span>⚠</span><span>{error}</span>
            <button className="sp-error-retry" onClick={fetchOrders}>Retry</button>
          </div>
        )}

        {/* Filters */}
        <div className="filter-row">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              placeholder="Search tracking ID, buyer name, phone…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
          </div>
          <select className="filter-select" value={statusFilter} onChange={e => handleFilter(e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button className="btn-clear" onClick={() => { setStatusFilter("All"); setSearchInput(""); setSearch(""); setPage(1); }}>
              ✕ Clear
            </button>
          )}
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && (
          <div className="bulk-bar">
            <span className="bulk-count">{selected.length} selected</span>
            <div className="bulk-sep" />
            <button className="bulk-btn">◈ Update Status</button>
            <button className="bulk-btn">↓ Export</button>
            <button className="bulk-btn danger">✕ Delete</button>
            <button className="bulk-close" onClick={() => setSelected([])}>✕</button>
          </div>
        )}

        {/* Table */}
        <div className="sp-panel">
          <div className="tbl-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <div
                      className={`cb${selected.length === sorted.length && sorted.length > 0 ? " checked" : ""}`}
                      onClick={toggleAll}>
                      {selected.length === sorted.length && sorted.length > 0 ? "✓" : ""}
                    </div>
                  </th>
                  <th onClick={() => handleSort("trackingId")}>Tracking ID <SortIcon k="trackingId" /></th>
                  <th onClick={() => handleSort("buyer")}>Buyer <SortIcon k="buyer" /></th>
                  <th onClick={() => handleSort("courier")}>Courier <SortIcon k="courier" /></th>
                  <th>Proof</th>
                  <th onClick={() => handleSort("status")}>Status <SortIcon k="status" /></th>
                  <th onClick={() => handleSort("createdAt")}>Date <SortIcon k="createdAt" /></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="tbl-empty-wrap">
                        <div className="tbl-empty-icon">📭</div>
                        <div className="tbl-empty-title">
                          {hasFilters ? "No orders match your filters" : "No orders yet"}
                        </div>
                        <div className="tbl-empty-sub">
                          {hasFilters
                            ? "Try adjusting your search or filter."
                            : "Create your first dispatch and get a tracking ID for your buyer."
                          }
                        </div>
                        {!hasFilters && (
                          <button className="tbl-empty-btn" onClick={() => navigate("/create-dispatch")}>
                            + Create First Dispatch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : sorted.map(o => {
                  const sc = STATUS_META[o.status] || STATUS_META["Dispatched"];
                  return (
                    <tr key={o.trackingId}
                      className={selected.includes(o.trackingId) ? "selected-row" : ""}
                      onClick={() => navigate(`/shipments/${o.trackingId}`)}>
                      <td onClick={e => { e.stopPropagation(); toggleSelect(o.trackingId); }}>
                        <div className={`cb${selected.includes(o.trackingId) ? " checked" : ""}`}>
                          {selected.includes(o.trackingId) ? "✓" : ""}
                        </div>
                      </td>
                      <td><span className="order-id">{o.trackingId}</span></td>
                      <td>
                        <div className="buyer-name">{o.buyer?.name}</div>
                        <div className="buyer-phone">{o.buyer?.phone}</div>
                      </td>
                      <td><span className="courier-pill">{o.courier?.name}</span></td>
                      <td>
                        {o.waybillUrl
                          ? <span className="proof-badge has-proof">✓ Saved</span>
                          : <span className="proof-badge no-proof">⚠ Missing</span>
                        }
                      </td>
                      <td>
                        <span className="status-chip" style={{ background: sc.bg, color: sc.text }}>
                          <span className="chip-dot" style={{ background: sc.dot }} />
                          {o.status}
                        </span>
                      </td>
                      <td className="td-mono td-muted">{formatDate(o.createdAt)}</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="row-action"
                          onClick={() => window.open(`/track/${o.trackingId}`, "_blank")}>
                          Track →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && total > 0 && (
            <div className="pagination">
              <span className="pg-info">
                Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
              </span>
              <div className="pg-btns">
                <button className="pg-btn" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                  const p = Math.max(1, page - 2) + i;
                  if (p > pages) return null;
                  return (
                    <button key={p} className={`pg-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                <button className="pg-btn" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>›</button>
                <button className="pg-btn" disabled={page >= pages} onClick={() => setPage(pages)}>»</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
