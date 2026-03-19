import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import SellerReviews from "./SellerReviews";
import "./DashBoard.css";

// ── Constants ──────────────────────────────────────────────────────────────

const STATUS_META = {
  Delivered: { bg: "#e8f5ee", text: "#2d7a4f", dot: "#2d7a4f" },
  "On the Way": { bg: "#eef1fb", text: "#3a3f5c", dot: "#3a3f5c" },
  Dispatched: { bg: "#fdf6e3", text: "#b07d2a", dot: "#b07d2a" },
  "Out for Delivery": { bg: "#fff3e0", text: "#e65100", dot: "#e65100" },
  "Issue Raised": { bg: "#fdf0ed", text: "#c84b2f", dot: "#c84b2f" },
};

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Orders", icon: "◈", path: "/shipments" },
  { label: "Disputes", icon: "⚠", path: "/disputes" },
  { label: "Reports", icon: "◧", path: "/analytics" },
  { label: "Settings", icon: "⊕", path: "/settings" },
];

const FILTER_LABELS = [
  "All",
  "On the Way",
  "Delivered",
  "Dispatched",
  "Out for Delivery",
  "Issue Raised",
];
const LIMIT = 6;

// ── Helpers ────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getFirstName(fullName = "") {
  return fullName.split(" ")[0] || "Seller";
}

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DashBoard() {
  const navigate = useNavigate();
  const { authFetch, seller, logout } = useAuth();

  // UI state
  const [sideNav, setSideNav] = useState("Dashboard");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);

  // Data state
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [activity, setActivity] = useState([]);
  const [openDisputes, setOpenDisputes] = useState(0); // unread dispute count
  const [loadingPath, setLoadingPath] = useState(null);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Fetch paginated orders for the table ─────────────────────────────────
  const fetchOrders = useCallback(
    async (currentFilter, currentPage) => {
      setLoading(true);
      setError("");
      try {
        const status =
          currentFilter !== "All"
            ? `&status=${encodeURIComponent(currentFilter)}`
            : "";
        const res = await authFetch(
          `/api/dispatches?page=${currentPage}&limit=${LIMIT}${status}`,
        );
        const data = await res.json();
        if (!data.success)
          throw new Error(data.message || "Failed to load orders.");
        setOrders(data.dispatches || []);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      } catch (err) {
        setError(
          err.message || "Could not load orders. Check your connection.",
        );
      } finally {
        setLoading(false);
      }
    },
    [authFetch],
  );

  // ── Fetch stats (all orders + disputes) ──────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      // Orders stats
      const ordRes = await authFetch(`/api/dispatches?limit=1000`);
      const ordData = await ordRes.json();
      if (!ordData.success) return;

      const all = ordData.dispatches || [];
      const active = all.filter((d) => d.status !== "Delivered").length;
      const delivered = all.filter((d) => d.status === "Delivered").length;
      const awaiting = all.filter((d) => d.status === "Dispatched").length;
      const issues = all.filter((d) => d.status === "Issue Raised").length;
      const noProof = all.filter((d) => !d.waybillUrl).length;
      const onWay = all.filter((d) => d.status === "On the Way").length;
      const outDel = all.filter((d) => d.status === "Out for Delivery").length;
      const ttl = all.length || 1;

      setStats({
        active,
        delivered,
        awaiting,
        issues,
        noProof,
        total: all.length,
        donut: [
          {
            label: "On the Way",
            val: onWay,
            pct: ((onWay / ttl) * 100).toFixed(1),
            color: "#3a3f5c",
          },
          {
            label: "Delivered",
            val: delivered,
            pct: ((delivered / ttl) * 100).toFixed(1),
            color: "#2d7a4f",
          },
          {
            label: "Dispatched",
            val: awaiting,
            pct: ((awaiting / ttl) * 100).toFixed(1),
            color: "#b07d2a",
          },
          {
            label: "Issue Raised",
            val: issues,
            pct: ((issues / ttl) * 100).toFixed(1),
            color: "#c84b2f",
          },
        ],
      });

      // Build rich activity feed
      const recentOrders = [...all]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 8);

      setActivity(
        recentOrders.map((d) => ({
          time: timeAgo(d.createdAt),
          msg: `${d.trackingId} — ${d.status} · ${d.buyer?.name}`,
          type:
            d.status === "Delivered"
              ? "success"
              : d.status === "Issue Raised"
                ? "error"
                : "info",
        })),
      );

      // Disputes unread count
      try {
        const dspRes = await authFetch(`/api/disputes`);
        const dspData = await dspRes.json();
        if (dspData.success) setOpenDisputes(dspData.unread || 0);
      } catch (_) {}
    } catch (_) {
      /* stats non-critical */
    }
  }, [authFetch]);

  // ── Load on mount ─────────────────────────────────────────────────────────
  useEffect(() => {
    fetchOrders(filter, page);
    fetchStats();
  }, []); // eslint-disable-line

  // ── Re-fetch when filter / page changes ──────────────────────────────────
  useEffect(() => {
    fetchOrders(filter, page);
  }, [filter, page]); // eslint-disable-line

  const handleFilter = (f) => {
    setFilter(f);
    setPage(1);
  };
  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  // ── Donut math ────────────────────────────────────────────────────────────
  const buildDonutSegments = (segs) => {
    let cumulative = 0;
    return segs.map((s) => {
      const pct = parseFloat(s.pct);
      const offset = 25 - cumulative;
      cumulative += pct;
      return { ...s, dashOffset: offset, pct };
    });
  };
  const donutSegments = stats ? buildDonutSegments(stats.donut) : [];

  // ── Trust banner ──────────────────────────────────────────────────────────
  const banner = (() => {
    if (!stats)
      return {
        icon: "🛡️",
        msg: "Loading your order summary…",
        good: false,
        action: null,
      };

    if (stats.noProof > 0)
      return {
        icon: "⚠️",
        msg: (
          <>
            <strong>
              {stats.noProof} order{stats.noProof > 1 ? "s" : ""} missing
              dispatch proof.
            </strong>{" "}
            Upload waybill photos so buyers can track their orders.
          </>
        ),
        good: false,
        action: { label: "View Orders →", path: "/shipments" },
      };

    if (openDisputes > 0)
      return {
        icon: "🔔",
        msg: (
          <>
            <strong>
              {openDisputes} open dispute{openDisputes > 1 ? "s" : ""} need your
              response.
            </strong>{" "}
            Reply quickly to maintain your seller reputation.
          </>
        ),
        good: false,
        action: { label: "View Disputes →", path: "/disputes" },
      };

    if (stats.issues > 0)
      return {
        icon: "🔔",
        msg: (
          <>
            <strong>
              {stats.issues} order{stats.issues > 1 ? "s have" : " has"} an
              issue raised.
            </strong>{" "}
            Update the status so buyers stay informed.
          </>
        ),
        good: false,
        action: { label: "Update Status →", path: "/update-status" },
      };

    return {
      icon: "✅",
      msg: (
        <>
          <strong>All orders have proof. No open disputes.</strong> Your buyers
          can track every order.
        </>
      ),
      good: true,
      action: { label: "Create Dispatch →", path: "/create-dispatch" },
    };
  })();

  // ── Stat cards config ─────────────────────────────────────────────────────
  const statCards = [
    {
      label: "Total Orders",
      value: stats?.total ?? "—",
      icon: "◈",
      color: "#c84b2f",
      sub: stats ? `${stats.noProof} missing proof` : "Updated live",
      onClick: () => navigate("/shipments"),
    },
    {
      label: "Confirmed Received",
      value: stats?.delivered ?? "—",
      icon: "✓",
      color: "#2d7a4f",
      sub: "Updated live",
      onClick: () => navigate("/shipments?status=Delivered"),
    },
    {
      label: "Awaiting Dispatch",
      value: stats?.awaiting ?? "—",
      icon: "◎",
      color: "#b07d2a",
      sub: "Updated live",
      onClick: () => navigate("/update-status"),
    },
    {
      label: "Open Disputes",
      value: openDisputes > 0 ? openDisputes : (stats?.issues ?? "—"),
      icon: "⚠",
      color: openDisputes > 0 ? "#c84b2f" : "#3a3f5c",
      sub: openDisputes > 0 ? "Needs your response" : "Updated live",
      onClick: () => navigate("/disputes"),
    },
  ];

  // ── Today's date ──────────────────────────────────────────────────────────
  const todayStr = new Date().toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="db-shell">
      {/* ── SIDEBAR ── */}
      <aside className="db-sidebar">
        {NAV_ICONS.map((n) => (
          <div
            key={n.label}
            title={n.label}
            className={`sb-icon${sideNav === n.label ? " active" : ""}`}
            style={{ position: "relative" }}
            onClick={() => {
              setSideNav(n.label);
              navigate(n.path);
            }}
          >
            {n.icon}
            {/* Unread badge on Disputes icon */}
            {n.label === "Disputes" && openDisputes > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#c84b2f",
                  border: "1.5px solid #0a0a0f",
                }}
              />
            )}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out" onClick={handleSignOut}>
            ↩
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="db-main">
        {/* ── PAGE HEADER ── */}
        <div className="ph-row">
          <div>
            <div className="ph-greeting">
              {greeting()}, <span>{getFirstName(seller?.fullName)}</span> 👋
            </div>
            <div className="ph-date">{todayStr} — Seller Dashboard</div>
          </div>
          <div className="ph-actions">
            <button
              className="btn-outline"
              onClick={() => navigate("/shipments")}
            >
              ◧ All Orders
            </button>
            <button
              className="btn-create-dispatch"
              onClick={() => navigate("/create-dispatch")}
            >
              <span className="btn-create-dispatch-icon">+</span>
              Create Dispatch
            </button>
          </div>
        </div>

        {/* ── API ERROR ── */}
        {error && (
          <div className="db-error">
            <span>⚠</span>
            <span>{error}</span>
            <button
              className="db-error-retry"
              onClick={() => fetchOrders(filter, page)}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── TRUST BANNER ── */}
        <div className={`trust-banner${banner.good ? " all-good" : ""}`}>
          <div className="trust-banner-icon">{banner.icon}</div>
          <div className="trust-banner-text">{banner.msg}</div>
          {banner.action && (
            <button
              className="trust-banner-action"
              onClick={() => navigate(banner.action.path)}
            >
              {banner.action.label}
            </button>
          )}
          <div className="trust-banner-badge">
            <span className="trust-live-dot" />
            Live
          </div>
        </div>

        {/* ── QUICK ACTIONS ── */}
        <div className="quick-actions">
          {[
            {
              icon: "📦",
              label: "Create Dispatch",
              sub: "New order proof",
              path: "/create-dispatch",
              primary: true,
            },
            {
              icon: "🔄",
              label: "Update Status",
              sub: `${stats?.active ?? "—"} active orders`,
              path: "/update-status",
            },
            {
              icon: "⚠",
              label: "Disputes",
              sub:
                openDisputes > 0
                  ? `${openDisputes} need response`
                  : "No open disputes",
              path: "/disputes",
              badge: openDisputes > 0,
            },
            {
              icon: "◧",
              label: "View Reports",
              sub: "Delivery analytics",
              path: "/analytics",
            },
          ].map((a) => (
            <button
              key={a.label}
              className={`quick-action-btn${a.primary ? " primary" : ""}`}
              onClick={() => {
                setLoadingPath(a.path);

                setTimeout(() => {
                  navigate(a.path);
                  setLoadingPath(null);
                }, 700); // adjust timing (300–800ms feels good)
              }}
            >
              <div className="qa-icon">
                {loadingPath === a.path ? (
                  <span className="spinner" />
                ) : (
                  <>
                    {a.icon}
                    {a.badge && <span className="qa-badge" />}
                  </>
                )}
              </div>
              <div>
                <div className="qa-label">{a.label}</div>
                <div className="qa-sub">{a.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {/* ── STAT CARDS ── */}
        <div className="stats-grid">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className="stat-card"
              style={{
                "--accent": s.color,
                animationDelay: `${0.05 + i * 0.05}s`,
              }}
              onClick={s.onClick}
            >
              {loading && !stats ? (
                <>
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-value" />
                </>
              ) : (
                <>
                  <div className="stat-top">
                    <span className="stat-label">{s.label}</span>
                    <span className="stat-icon" style={{ color: s.color }}>
                      {s.icon}
                    </span>
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div
                    className="stat-delta up"
                    style={{ color: s.color, opacity: 0.75 }}
                  >
                    {s.sub}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="main-grid">
          {/* ── ORDERS TABLE ── */}
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Recent Orders</span>
              <button
                className="panel-link"
                onClick={() => navigate("/shipments")}
              >
                View all →
              </button>
            </div>

            {/* Filter tabs */}
            <div className="filter-bar">
              {FILTER_LABELS.map((f) => (
                <button
                  key={f}
                  className={`ftab${filter === f ? " active" : ""}`}
                  onClick={() => handleFilter(f)}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Table body */}
            <div className="tbl-wrap">
              {loading ? (
                <div style={{ padding: "32px 20px" }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 16,
                        marginBottom: 16,
                        alignItems: "center",
                      }}
                    >
                      <div
                        className="skeleton"
                        style={{ height: 12, width: 110 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 12, width: 140 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 12, width: 90 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 12, width: 80 }}
                      />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="tbl-empty">
                  <div className="tbl-empty-icon">📭</div>
                  <div className="tbl-empty-title">
                    {filter === "All"
                      ? "No orders yet"
                      : `No "${filter}" orders`}
                  </div>
                  <div className="tbl-empty-sub">
                    {filter === "All"
                      ? "Create your first dispatch to generate a tracking ID for your buyer."
                      : "No orders match this filter right now."}
                  </div>
                  {filter === "All" && (
                    <button
                      className="tbl-empty-btn"
                      onClick={() => navigate("/create-dispatch")}
                    >
                      + Create First Dispatch
                    </button>
                  )}
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Tracking ID</th>
                      <th>Buyer</th>
                      <th>Courier</th>
                      <th>Proof</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => {
                      const sc =
                        STATUS_META[o.status] || STATUS_META["Dispatched"];
                      return (
                        <tr
                          key={o.trackingId}
                          onClick={() => navigate(`/shipments/${o.trackingId}`)}
                        >
                          <td>
                            <span className="order-id">{o.trackingId}</span>
                          </td>
                          <td>
                            <div className="buyer-name">{o.buyer?.name}</div>
                            <div className="buyer-location">
                              {o.buyer?.phone}
                            </div>
                          </td>
                          <td>
                            <span className="courier-pill">
                              {o.courier?.name}
                            </span>
                          </td>
                          <td>
                            {o.waybillUrl ? (
                              <span className="proof-badge has-proof">
                                ✓ Saved
                              </span>
                            ) : (
                              <span className="proof-badge no-proof">
                                ⚠ Missing
                              </span>
                            )}
                          </td>
                          <td
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 12,
                              color: "var(--warm-gray)",
                            }}
                          >
                            {formatDate(o.createdAt)}
                          </td>
                          <td>
                            <span
                              className="status-chip"
                              style={{ background: sc.bg, color: sc.text }}
                            >
                              <span
                                className="chip-dot"
                                style={{ background: sc.dot }}
                              />
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && orders.length > 0 && (
              <div className="tbl-footer">
                <span>
                  Showing {orders.length} of {total} orders
                </span>
                <div className="tbl-footer-btns">
                  <button
                    className="tbl-page-btn"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  {Array.from(
                    { length: Math.min(pages, 5) },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      className={`tbl-page-btn${page === p ? " active" : ""}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="tbl-page-btn"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div className="right-col">
            {/* Order breakdown donut */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Order Breakdown</span>
                <button
                  className="panel-link"
                  onClick={() => navigate("/analytics")}
                >
                  Details
                </button>
              </div>
              <div className="donut-body">
                {!stats ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 0",
                    }}
                  >
                    <div
                      className="skeleton"
                      style={{ width: 144, height: 144, borderRadius: "50%" }}
                    />
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: "80%" }}
                    />
                    <div
                      className="skeleton skeleton-text"
                      style={{ width: "60%" }}
                    />
                  </div>
                ) : (
                  <>
                    <svg className="donut-svg" viewBox="0 0 36 36">
                      {donutSegments.map((seg, i) => (
                        <circle
                          key={i}
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="4"
                          strokeDasharray={`${seg.pct} ${100 - seg.pct}`}
                          strokeDashoffset={`${seg.dashOffset}`}
                        />
                      ))}
                      <text
                        x="18"
                        y="17"
                        textAnchor="middle"
                        style={{
                          fontFamily: "'Syne',sans-serif",
                          fontSize: "5px",
                          fontWeight: 800,
                          fill: "#0a0a0f",
                        }}
                      >
                        {stats.total}
                      </text>
                      <text
                        x="18"
                        y="22"
                        textAnchor="middle"
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "2.4px",
                          fill: "#8a8478",
                          letterSpacing: "0.2px",
                        }}
                      >
                        ORDERS
                      </text>
                    </svg>
                    <div className="donut-legend">
                      {stats.donut.map((l) => (
                        <div
                          key={l.label}
                          className="leg-row"
                          style={{ cursor: "pointer" }}
                          onClick={() => handleFilter(l.label)}
                        >
                          <div className="leg-left">
                            <span
                              className="leg-dot"
                              style={{ background: l.color }}
                            />
                            {l.label}
                          </div>
                          <span className="leg-val">{l.val}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Activity feed */}
            <div className="panel">
              <div className="panel-head">
                <span className="panel-title">Recent Activity</span>
                <div className="live-badge">
                  <span className="live-dot" />
                  <span className="panel-link" style={{ cursor: "default" }}>
                    Live
                  </span>
                </div>
              </div>

              {loading && activity.length === 0 ? (
                <div style={{ padding: "16px 20px" }}>
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 10, marginBottom: 16 }}
                    >
                      <div
                        className="skeleton"
                        style={{ width: 44, height: 10 }}
                      />
                      <div
                        className="skeleton"
                        style={{ flex: 1, height: 10 }}
                      />
                    </div>
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div
                  style={{
                    padding: "24px 20px",
                    fontFamily: "'DM Mono',monospace",
                    fontSize: 11,
                    color: "var(--warm-gray)",
                    letterSpacing: "0.06em",
                    textAlign: "center",
                  }}
                >
                  No activity yet. Create your first dispatch!
                </div>
              ) : (
                activity.map((a, i) => (
                  <div key={i} className="act-item">
                    <span className="act-time">{a.time}</span>
                    <span className={`act-dot ${a.type}`} />
                    <span className="act-msg">{a.msg}</span>
                  </div>
                ))
              )}

              {/* Dispute notice in activity if open disputes exist */}
              {openDisputes > 0 && (
                <div
                  className="act-item"
                  style={{
                    cursor: "pointer",
                    borderTop: "1px solid var(--mist)",
                  }}
                  onClick={() => navigate("/disputes")}
                >
                  <span className="act-time">Now</span>
                  <span className="act-dot error" />
                  <span
                    className="act-msg"
                    style={{ color: "var(--rust)", fontWeight: 700 }}
                  >
                    {openDisputes} open dispute{openDisputes > 1 ? "s" : ""} —
                    tap to respond →
                  </span>
                </div>
              )}
            </div>

            {/* Buyer reviews summary */}
            <SellerReviews />
          </div>
        </div>
      </main>
    </div>
  );
}
