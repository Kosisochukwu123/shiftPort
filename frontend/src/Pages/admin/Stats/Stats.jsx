import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Analytics.css";

// ── Static visual data (charts use real proportions but demo labels) ──────

const DAYS = ["M","T","W","T","F","S","S"];

const HEATMAP = [
  [0,1,2,1,0,0,0],
  [1,2,3,2,1,0,0],
  [2,3,4,3,2,1,0],
  [1,2,3,4,3,2,1],
  [0,1,2,3,2,1,0],
  [0,0,1,2,1,0,0],
  [0,0,0,1,0,0,0],
];

const NAV_ICONS = [
  { label: "Dashboard",  icon: "⬡", path: "/dashboard"    },
  { label: "Orders",     icon: "◈", path: "/shipments"     },
  { label: "Disputes",   icon: "⚠", path: "/disputes"      },
  { label: "Reports",    icon: "◧", path: "/analytics"     },
  { label: "Settings",   icon: "⊕", path: "/settings"      },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function Stars({ rating, size = 16 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} className={`rating-star${i <= Math.round(rating) ? "" : " empty"}`}
          style={{ fontSize: size }}>★</span>
      ))}
    </div>
  );
}

// ── Bar Chart — uses real order counts ─────────────────────────────────────

function BarChart({ orders }) {
  // Group by month from real orders
  const monthMap = {};
  orders.forEach(o => {
    const d   = new Date(o.createdAt);
    const key = d.toLocaleDateString("en-NG", { month: "short" });
    if (!monthMap[key]) monthMap[key] = { delivered: 0, onWay: 0, dispatched: 0, issues: 0 };
    if (o.status === "Delivered")    monthMap[key].delivered++;
    else if (o.status === "On the Way" || o.status === "Out for Delivery") monthMap[key].onWay++;
    else if (o.status === "Issue Raised") monthMap[key].issues++;
    else monthMap[key].dispatched++;
  });

  // Fall back to demo data if no orders
  const months = Object.keys(monthMap).length > 0
    ? Object.entries(monthMap).slice(-7).map(([month, d]) => ({ month, ...d }))
    : [
        { month: "Sep", delivered: 12, onWay: 8,  dispatched: 3, issues: 0 },
        { month: "Oct", delivered: 18, onWay: 11, dispatched: 4, issues: 1 },
        { month: "Nov", delivered: 24, onWay: 16, dispatched: 5, issues: 1 },
        { month: "Dec", delivered: 31, onWay: 22, dispatched: 6, issues: 2 },
        { month: "Jan", delivered: 22, onWay: 18, dispatched: 4, issues: 1 },
        { month: "Feb", delivered: 28, onWay: 20, dispatched: 5, issues: 1 },
        { month: "Mar", delivered: 19, onWay: 14, dispatched: 4, issues: 0 },
      ];

  const mx = Math.max(...months.map(d => d.delivered + d.onWay + d.dispatched + d.issues)) || 1;
  const h  = n => `${(n / mx) * 130}px`;

  return (
    <div className="panel-body">
      <div className="bar-chart">
        {months.map(d => (
          <div key={d.month} className="bar-col">
            <div className="bar-wrap">
              <div className="bar issues"     style={{ height: h(d.issues),    width: "22%" }} title={`Issues: ${d.issues}`} />
              <div className="bar dispatched" style={{ height: h(d.dispatched),width: "22%" }} title={`Dispatched: ${d.dispatched}`} />
              <div className="bar on-way"     style={{ height: h(d.onWay),     width: "22%" }} title={`On the Way: ${d.onWay}`} />
              <div className="bar delivered"  style={{ height: h(d.delivered), width: "22%" }} title={`Delivered: ${d.delivered}`} />
            </div>
            <span className="bar-label">{d.month}</span>
          </div>
        ))}
      </div>
      <div className="bar-legend">
        {[
          { cls: "delivered",  label: "Delivered",   color: "#2d7a4f" },
          { cls: "on-way",     label: "On the Way",  color: "#3a3f5c" },
          { cls: "dispatched", label: "Dispatched",  color: "#b07d2a" },
          { cls: "issues",     label: "Issues",      color: "#c84b2f" },
        ].map(l => (
          <div key={l.cls} className="legend-item">
            <span className="legend-dot" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rating Overview — replaces carrier donut ──────────────────────────────

function RatingOverview({ reviewStats }) {
  if (!reviewStats || reviewStats.total === 0) {
    return (
      <div className="rating-overview" style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⭐</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 800, color: "var(--ink)", marginBottom: 8 }}>
          No reviews yet
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.04em", lineHeight: 1.7 }}>
          Reviews appear here once buyers confirm receipt and rate their experience.
        </div>
      </div>
    );
  }

  const { avgRating, total, distribution, wouldBuyAgainPct } = reviewStats;

  return (
    <div className="rating-overview">
      <div className="rating-big">
        <div className="rating-number">{avgRating.toFixed(1)}</div>
        <Stars rating={avgRating} size={20} />
        <div className="rating-count">{total} review{total !== 1 ? "s" : ""}</div>
      </div>

      <div className="rating-bars">
        {distribution.map(d => (
          <div key={d.star} className="rating-bar-row">
            <span className="rating-bar-star">{d.star}</span>
            <span className="rating-bar-star-icon">★</span>
            <div className="rating-bar-track">
              <div className="rating-bar-fill" style={{
                width: `${d.pct}%`,
                background: d.star >= 4 ? "#f5a623" : d.star === 3 ? "#b07d2a" : "#c84b2f",
              }} />
            </div>
            <span className="rating-bar-count">{d.count}</span>
          </div>
        ))}
      </div>

      <div className="rating-wba">
        <span className="rating-wba-pct">{wouldBuyAgainPct}%</span>
        <span className="rating-wba-label">would buy<br />from you again</span>
      </div>
    </div>
  );
}

// ── Status distribution ───────────────────────────────────────────────────

function StatusDist({ orders }) {
  const total = orders.length || 1;
  const statuses = [
    { label: "Delivered",        color: "#2d7a4f", count: orders.filter(o => o.status === "Delivered").length        },
    { label: "On the Way",       color: "#3a3f5c", count: orders.filter(o => o.status === "On the Way").length       },
    { label: "Out for Delivery", color: "#e65100", count: orders.filter(o => o.status === "Out for Delivery").length },
    { label: "Dispatched",       color: "#b07d2a", count: orders.filter(o => o.status === "Dispatched").length       },
    { label: "Issue Raised",     color: "#c84b2f", count: orders.filter(o => o.status === "Issue Raised").length     },
  ];
  const mx = Math.max(...statuses.map(s => s.count)) || 1;

  return (
    <div className="status-dist">
      {statuses.map(s => (
        <div key={s.label} className="status-dist-row">
          <span className="status-dist-label">{s.label}</span>
          <div className="status-dist-bar">
            <div className="status-dist-fill" style={{ width: `${(s.count / mx) * 100}%`, background: s.color }} />
          </div>
          <span className="status-dist-val">{s.count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Dispatch proof rate ───────────────────────────────────────────────────

function ProofRate({ orders }) {
  const total      = orders.length;
  const withProof  = orders.filter(o => o.waybillUrl).length;
  const pct        = total > 0 ? Math.round(withProof / total * 100) : 0;
  const pctCls     = pct >= 90 ? "good" : pct >= 70 ? "warn" : "bad";

  return (
    <div className="proof-stat">
      <div className="proof-big">
        <div className={`proof-pct ${pctCls}`}>{pct}%</div>
        <div className="proof-label">orders have<br />dispatch proof</div>
      </div>
      <div className="proof-track">
        <div className="proof-fill" style={{ width: `${pct}%`, background: pct >= 90 ? "#2d7a4f" : pct >= 70 ? "#b07d2a" : "#c84b2f" }} />
      </div>
      <div className="proof-breakdown">
        {[
          { label: "With waybill",    val: withProof,       color: "#2d7a4f" },
          { label: "Missing waybill", val: total - withProof, color: "#c84b2f" },
          { label: "Total orders",    val: total,           color: "var(--ink)" },
        ].map(r => (
          <div key={r.label} className="proof-row">
            <span className="proof-row-label">{r.label}</span>
            <span className="proof-row-val" style={{ color: r.color }}>{r.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dispatch trend line chart ─────────────────────────────────────────────

function TrendLine({ orders }) {
  // Group orders by week for last 12 weeks
  const now     = Date.now();
  const weeks   = Array.from({ length: 12 }, (_, i) => {
    const start = now - (11 - i) * 7 * 24 * 3600 * 1000;
    const end   = start + 7 * 24 * 3600 * 1000;
    return { label: `W${i + 1}`, count: orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= start && t < end;
    }).length };
  });

  const pts     = weeks.map(w => w.count);
  const hasData = pts.some(v => v > 0);
  const points  = hasData ? pts : [2,3,2,4,3,5,4,6,5,7,6,8]; // demo

  const W = 400, H = 100, pad = 10;
  const mx = Math.max(...points, 1);
  const mn = 0;
  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (W - pad * 2),
    y: pad + ((mx - v) / (mx - mn + 1)) * (H - pad * 2),
  }));
  const pathD = coords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaD = `${pathD} L${coords[coords.length - 1].x},${H} L${coords[0].x},${H} Z`;

  return (
    <div className="line-chart-wrap">
      <svg className="line-svg" viewBox={`0 0 ${W} ${H + 16}`}>
        {[0.25, 0.5, 0.75].map(r => (
          <line key={r} className="line-grid"
            x1={pad} y1={pad + r * (H - pad * 2)}
            x2={W - pad} y2={pad + r * (H - pad * 2)} />
        ))}
        <path d={areaD} fill="#3a3f5c" className="line-area" />
        <path d={pathD} className="line-path" stroke="#3a3f5c" />
        {coords.map((p, i) => (
          <circle key={i} className="line-dot" cx={p.x} cy={p.y} r="3"
            fill="#ffffff" stroke="#3a3f5c" strokeWidth="2" />
        ))}
        {["W1","W3","W5","W7","W9","W11"].map((w, i) => (
          <text key={i} className="line-axis-label"
            x={pad + (i / 5) * (W - pad * 2)} y={H + 14} textAnchor="middle">{w}</text>
        ))}
      </svg>
    </div>
  );
}

// ── Heatmap ───────────────────────────────────────────────────────────────

function Heatmap({ orders }) {
  // Build activity heatmap from real orders (last 7 weeks × 7 days)
  const now   = Date.now();
  const cells = Array.from({ length: 49 }, (_, idx) => {
    const week = Math.floor(idx / 7);
    const day  = idx % 7;
    const dayStart = now - (48 - idx) * 24 * 3600 * 1000;
    const dayEnd   = dayStart + 24 * 3600 * 1000;
    const count = orders.filter(o => {
      const t = new Date(o.createdAt).getTime();
      return t >= dayStart && t < dayEnd;
    }).length;
    return Math.min(count > 3 ? 4 : count > 1 ? 3 : count > 0 ? 2 : 1, 4);
  });

  const hasData = orders.some(o => o.createdAt);
  const display = hasData ? cells : HEATMAP.flat();

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-day-labels">
        {DAYS.map((d, i) => <div key={i} className="heatmap-day-label">{d}</div>)}
      </div>
      <div className="heatmap-grid">
        {display.map((level, i) => (
          <div key={i} className={`heatmap-cell l${level}`} />
        ))}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Less</span>
        <div className="heatmap-legend-cells">
          {[0,1,2,3,4].map(l => <div key={l} className={`heatmap-legend-cell heatmap-cell l${l}`} />)}
        </div>
        <span className="heatmap-legend-label">More</span>
      </div>
    </div>
  );
}

// ── Top couriers from real data ───────────────────────────────────────────

function TopCouriers({ orders }) {
  const courierMap = {};
  orders.forEach(o => {
    const name = o.courier?.name || "Unknown";
    if (!courierMap[name]) courierMap[name] = { total: 0, delivered: 0 };
    courierMap[name].total++;
    if (o.status === "Delivered") courierMap[name].delivered++;
  });

  const list = Object.entries(courierMap)
    .map(([name, d]) => ({
      name,
      total:   d.total,
      rate:    d.total > 0 ? Math.round(d.delivered / d.total * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const mx = list[0]?.total || 1;

  if (list.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--warm-gray)", letterSpacing: "0.06em" }}>
        No orders yet
      </div>
    );
  }

  return (
    <div className="spark-table">
      {list.map((c, i) => (
        <div key={c.name} className="spark-row">
          <span className="spark-rank">#{i + 1}</span>
          <div style={{ flex: 1 }}>
            <div className="spark-name">{c.name}</div>
            <div className="spark-sub">{c.rate}% delivery rate</div>
          </div>
          <div className="spark-bar-wrap">
            <div className="spark-bar-fill" style={{ width: `${(c.total / mx) * 100}%` }} />
          </div>
          <span className="spark-val">{c.total}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function Analytics() {
  const navigate              = useNavigate();
  const { authFetch, logout } = useAuth();

  const [activeNav,    setActiveNav]    = useState("Reports");
  const [range,        setRange]        = useState("30D");
  const [orders,       setOrders]       = useState([]);
  const [reviewStats,  setReviewStats]  = useState(null);
  const [loading,      setLoading]      = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // All orders
      const ordRes  = await authFetch(`/api/dispatches?limit=1000`);
      const ordData = await ordRes.json();
      if (ordData.success) setOrders(ordData.dispatches || []);

      // Reviews
      try {
        const revRes  = await authFetch(`/api/reviews/seller`);
        const revData = await revRes.json();
        if (revData.success) setReviewStats(revData.stats);
      } catch (_) {}

    } catch (_) {}
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Computed KPIs from real data ─────────────────────────────────────────
  const total      = orders.length;
  const delivered  = orders.filter(o => o.status === "Delivered").length;
  const onTime     = total > 0 ? ((delivered / total) * 100).toFixed(1) : "—";
  const withProof  = orders.filter(o => o.waybillUrl).length;
  const proofRate  = total > 0 ? ((withProof / total) * 100).toFixed(1) : "—";
  const issues     = orders.filter(o => o.status === "Issue Raised").length;
  const issueRate  = total > 0 ? ((issues / total) * 100).toFixed(1) : "—";

  const kpis = [
    {
      label: "Total Orders",       value: total || "—",
      delta: "All time",           trend: "neutral",
      icon: "◈", accent: "#c84b2f",
      onClick: () => navigate("/shipments"),
    },
    {
      label: "Confirmed Received", value: total > 0 ? `${onTime}%` : "—",
      delta: `${delivered} orders`,  trend: "up",
      icon: "✓", accent: "#2d7a4f",
      onClick: () => navigate("/shipments"),
    },
    {
      label: "Proof Upload Rate",  value: total > 0 ? `${proofRate}%` : "—",
      delta: `${withProof} with waybill`, trend: parseFloat(proofRate) >= 90 ? "up" : "down",
      icon: "🛡", accent: "#3a3f5c",
      onClick: () => navigate("/shipments"),
    },
    {
      label: "Issue / Dispute Rate", value: total > 0 ? `${issueRate}%` : "—",
      delta: `${issues} raised`,    trend: issues === 0 ? "up" : "down",
      icon: "⚠", accent: "#b07d2a",
      onClick: () => navigate("/disputes"),
    },
  ];

  const Skeleton = () => (
    <div style={{ padding: "24px 20px" }}>
      {[1,2,3].map(i => (
        <div key={i} className="skeleton" style={{ height: 12, marginBottom: 12, width: `${70 + i * 8}%` }} />
      ))}
    </div>
  );

  return (
    <div className="an-shell">

      {/* Sidebar */}
      <aside className="an-sidebar">
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

      <main className="an-main">

        {/* Header */}
        <div className="an-topbar">
          <div>
            <div className="an-title">Reports <span>&amp; Analytics</span></div>
            <div className="an-sub">
              {loading ? "Loading…" : `${total} total orders · your seller performance overview`}
            </div>
          </div>
          <div className="an-actions">
            <div className="range-tabs">
              {["7D","30D","90D","All"].map(r => (
                <button key={r} className={`range-tab${range === r ? " active" : ""}`}
                  onClick={() => setRange(r)}>{r}</button>
              ))}
            </div>
            <button className="btn-outline" onClick={fetchData}>↺ Refresh</button>
          </div>
        </div>

        {/* KPIs */}
        <div className="kpi-grid">
          {kpis.map((k, i) => (
            <div key={k.label} className="kpi-card"
              style={{ "--kpi-accent": k.accent, cursor: "pointer", animationDelay: `${0.05 * i}s` }}
              onClick={k.onClick}>
              {loading ? (
                <>
                  <div className="skeleton" style={{ height: 10, width: "60%", marginBottom: 12 }} />
                  <div className="skeleton" style={{ height: 30, width: "50%", marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 10, width: "70%" }} />
                </>
              ) : (
                <>
                  <div className="kpi-top">
                    <span className="kpi-label">{k.label}</span>
                    <span className="kpi-icon" style={{ color: k.accent }}>{k.icon}</span>
                  </div>
                  <div className="kpi-value">{k.value}</div>
                  <div className={`kpi-delta ${k.trend}`}>
                    {k.trend === "up" ? "▲" : k.trend === "down" ? "▼" : "◎"} {k.delta}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Row 1: order volume bar chart + star rating overview */}
        <div className="chart-grid-top">
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Order Volume by Month</span>
              <span className="panel-meta">Last 7 months</span>
            </div>
            {loading ? <Skeleton /> : <BarChart orders={orders} />}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Buyer Ratings</span>
              <span className="panel-meta">{reviewStats?.total || 0} reviews</span>
            </div>
            {loading ? <Skeleton /> : <RatingOverview reviewStats={reviewStats} />}
          </div>
        </div>

        {/* Row 2: dispatch trend + top couriers + status distribution */}
        <div className="chart-grid-bottom">

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Dispatch Trend</span>
              <span className="panel-meta">Orders per week</span>
            </div>
            {loading ? <Skeleton /> : <TrendLine orders={orders} />}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Top Couriers</span>
              <span className="panel-meta">By order count</span>
            </div>
            {loading ? <Skeleton /> : <TopCouriers orders={orders} />}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Dispatch Proof Rate</span>
              <button className="panel-action" onClick={() => navigate("/shipments")}>
                Fix missing →
              </button>
            </div>
            {loading ? <Skeleton /> : <ProofRate orders={orders} />}
          </div>

        </div>

        {/* Row 3: order status distribution + activity heatmap */}
        <div className="chart-grid-top" style={{ marginTop: 20 }}>
          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Order Status Breakdown</span>
              <button className="panel-action" onClick={() => navigate("/update-status")}>
                Update status →
              </button>
            </div>
            {loading ? <Skeleton /> : <StatusDist orders={orders} />}
          </div>

          <div className="panel">
            <div className="panel-head">
              <span className="panel-title">Activity Heatmap</span>
              <span className="panel-meta">Last 7 weeks</span>
            </div>
            {loading ? <Skeleton /> : <Heatmap orders={orders} />}
          </div>
        </div>

      </main>
    </div>
  );
}
