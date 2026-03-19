import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

export default function SellerReviews() {
  const { authFetch } = useAuth();
  const navigate      = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/api/reviews/seller")
      .then(r => r.json())
      .then(d => { if (d.success) setData(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authFetch]);

  const stars = (n, size = 13) =>
    [1,2,3,4,5].map(i => (
      <span key={i} style={{ color: i <= Math.round(n) ? "#f5a623" : "#2a2a3a", fontSize: size }}>★</span>
    ));

  if (loading) {
    return (
      <div className="panel" style={{ padding: 20 }}>
        <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 10, borderRadius: 2 }} />
        <div className="skeleton" style={{ height: 36, width: "40%", marginBottom: 8, borderRadius: 2 }} />
        <div className="skeleton" style={{ height: 10, width: "80%", borderRadius: 2 }} />
      </div>
    );
  }

  if (!data || data.stats.total === 0) {
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="panel-title">Buyer Reviews</span>
        </div>
        <div style={{ padding: "28px 20px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>⭐</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "var(--ink)", marginBottom: 6 }}>
            No reviews yet
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.04em", lineHeight: 1.6 }}>
            When buyers confirm receipt and leave a review, you'll see your rating here.
          </div>
        </div>
      </div>
    );
  }

  const { stats, reviews } = data;

  return (
    <div className="panel">
      <div className="panel-head">
        <span className="panel-title">Buyer Reviews</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.04em" }}>
          {stats.total} review{stats.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Rating summary */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mist)", display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 38, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.05em", lineHeight: 1 }}>
            {stats.avgRating.toFixed(1)}
          </div>
          <div style={{ display: "flex", gap: 1, justifyContent: "center", margin: "4px 0" }}>
            {stars(stats.avgRating, 14)}
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.08em" }}>
            out of 5
          </div>
        </div>

        {/* Distribution bars */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {stats.distribution.map(d => (
            <div key={d.star} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", width: 8, textAlign: "right" }}>
                {d.star}
              </span>
              <span style={{ color: "#f5a623", fontSize: 10 }}>★</span>
              <div style={{ flex: 1, height: 5, background: "var(--mist)", position: "relative" }}>
                <div style={{
                  position: "absolute", top: 0, left: 0, height: "100%",
                  width: `${d.pct}%`,
                  background: d.star >= 4 ? "#f5a623" : d.star === 3 ? "#b07d2a" : "#c84b2f",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", width: 24, textAlign: "right" }}>
                {d.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Would buy again */}
      <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--mist)", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 14 }}>👍</span>
        <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.04em" }}>
          <strong style={{ color: "var(--success)", fontFamily: "'Syne',sans-serif" }}>{stats.wouldBuyAgainPct}%</strong>
          {" "}of buyers would buy again
        </span>
      </div>

      {/* Recent reviews */}
      {reviews.slice(0, 3).map((r, i) => (
        <div key={r._id} style={{
          padding: "12px 20px",
          borderBottom: i < Math.min(reviews.length, 3) - 1 ? "1px solid var(--mist)" : "none",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
            <div style={{ display: "flex", gap: 1 }}>{stars(r.rating, 12)}</div>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.04em" }}>
              {r.trackingId}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6, marginBottom: r.comment ? 5 : 0, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#3a3f5c", background: "#eef1fb", padding: "2px 7px", letterSpacing: "0.06em" }}>
              {r.itemCondition}
            </span>
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#3a3f5c", background: "#eef1fb", padding: "2px 7px", letterSpacing: "0.06em" }}>
              {r.deliverySpeed}
            </span>
          </div>
          {r.comment && (
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--warm-gray)", letterSpacing: "0.03em", lineHeight: 1.6, fontStyle: "italic" }}>
              "{r.comment}"
            </div>
          )}
        </div>
      ))}

      {reviews.length > 3 && (
        <div style={{ padding: "10px 20px" }}>
          <button className="panel-link"
            onClick={() => navigate("/reviews")}
            style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--rust)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em" }}>
            View all {reviews.length} reviews →
          </button>
        </div>
      )}
    </div>
  );
}
