import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DisputeForm from "../DisputeForm/DisputeForm";
import "./TrackOrder.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Config ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  Dispatched: { cls: "dispatched", label: "Dispatched", icon: "📦" },
  "On the Way": { cls: "on-the-way", label: "On the Way", icon: "🚚" },
  "Out for Delivery": {
    cls: "out-delivery",
    label: "Out for Delivery",
    icon: "🛵",
  },
  Delivered: { cls: "delivered", label: "Delivered", icon: "✅" },
  "Issue Raised": { cls: "issue", label: "Issue Raised", icon: "⚠️" },
};

const JOURNEY_STEPS = [
  {
    key: "Dispatched",
    label: "Order Dispatched",
    desc: "Seller has handed your order to the courier.",
  },
  {
    key: "On the Way",
    label: "On the Way",
    desc: "Your order is in transit to you.",
  },
  {
    key: "Out for Delivery",
    label: "Out for Delivery",
    desc: "Your order is with a delivery agent nearby.",
  },
  {
    key: "Delivered",
    label: "Delivered",
    desc: "Your order has been delivered successfully.",
  },
];

const ORDER_STEP_INDEX = {
  Dispatched: 0,
  "On the Way": 1,
  "Out for Delivery": 2,
  Delivered: 3,
  "Issue Raised": -1,
};

const STAR_LABELS = [
  "",
  "Poor",
  "Below average",
  "Average",
  "Good",
  "Excellent",
];

const CONDITION_OPTIONS = [
  { value: "Perfect condition", icon: "✅", tone: "good" },
  { value: "Minor damage", icon: "⚠️", tone: "" },
  { value: "Significant damage", icon: "💔", tone: "bad" },
  { value: "Wrong item", icon: "❓", tone: "bad" },
  { value: "Item missing", icon: "📭", tone: "bad" },
];

const SPEED_OPTIONS = [
  { value: "Faster than expected", icon: "⚡", tone: "good" },
  { value: "On time", icon: "✓", tone: "good" },
  { value: "Slightly delayed", icon: "🕐", tone: "" },
  { value: "Very delayed", icon: "🐌", tone: "bad" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function TrackOrder() {
  const { trackingId: paramId } = useParams();
  const navigate = useNavigate();

  // Core state
  const [searchId, setSearchId] = useState(paramId || "");
  const [dispatch, setDispatch] = useState(null);
  const [loading, setLoading] = useState(!!paramId);
  const [error, setError] = useState("");

  // Dispute form
  const [showDispute, setShowDispute] = useState(false);

  // Confirm receipt
  const [phone, setPhone] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState("");
  const [justConfirmed, setJustConfirmed] = useState(false);

  // Review form
  const [existingReview, setExistingReview] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [itemCondition, setItemCondition] = useState("");
  const [deliverySpeed, setDeliverySpeed] = useState("");
  const [comment, setComment] = useState("");
  const [wouldBuyAgain, setWouldBuyAgain] = useState(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewError, setReviewError] = useState("");

  // ── Fetch dispatch ──────────────────────────────────────────────────────
  useEffect(() => {
    if (paramId) fetchDispatch(paramId);
  }, [paramId]);

  const fetchDispatch = async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError("");
    setDispatch(null);
    setExistingReview(null);
    try {
      const res = await fetch(
        `${API_BASE}/api/dispatches/track/${id.trim().toUpperCase()}`,
      );
      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Order not found.");
      setDispatch(data.dispatch);

      // Fetch existing review for this order
      const revRes = await fetch(
        `${API_BASE}/api/reviews/order/${id.trim().toUpperCase()}`,
      );
      const revData = await revRes.json();
      if (revData.success && revData.review) {
        setExistingReview(revData.review);
        setReviewDone(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchId.trim()) {
      navigate(`/track/${searchId.trim().toUpperCase()}`);
      fetchDispatch(searchId.trim());
    }
  };

  // ── Confirm receipt ──────────────────────────────────────────────────────
  const handleConfirm = async () => {
    setConfirmError("");
    if (!phone.trim()) {
      setConfirmError("Please enter your phone number.");
      return;
    }
    setConfirming(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/reviews/confirm/${dispatch.trackingId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buyerPhone: phone.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setJustConfirmed(true);
      setDispatch((prev) => ({
        ...prev,
        status: "Delivered",
        timeline: [
          ...(prev.timeline || []),
          {
            status: "Delivered",
            description: `You confirmed receipt of this order.`,
            timestamp: new Date().toISOString(),
          },
        ],
      }));
      setShowReview(true);
    } catch (err) {
      setConfirmError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  // ── Submit review ────────────────────────────────────────────────────────
  const handleReviewSubmit = async () => {
    setReviewError("");
    if (!rating) {
      setReviewError("Please give a star rating.");
      return;
    }
    if (!itemCondition) {
      setReviewError("Please select the item condition.");
      return;
    }
    if (!deliverySpeed) {
      setReviewError("Please rate the delivery speed.");
      return;
    }
    if (wouldBuyAgain === null) {
      setReviewError("Please answer the 'would buy again' question.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingId: dispatch.trackingId,
          buyerPhone: phone || dispatch.buyer?.phone || "",
          rating,
          itemCondition,
          deliverySpeed,
          comment,
          wouldBuyAgain,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setReviewDone(true);
      setExistingReview(data.review);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── WhatsApp share ───────────────────────────────────────────────────────
  const makeWaShare = () => {
    if (!dispatch) return "#";
    const url = window.location.href;
    const text = encodeURIComponent(
      `Track your order with SwiftPort 📦\n\nTracking ID: *${dispatch.trackingId}*\nStatus: ${dispatch.status}\n\n${url}`,
    );
    return `https://wa.me/?text=${text}`;
  };

  // ── Timeline builder ─────────────────────────────────────────────────────
  const buildTimeline = () => {
    if (!dispatch) return [];
    const currentIdx = ORDER_STEP_INDEX[dispatch.status] ?? 0;
    const isIssue = dispatch.status === "Issue Raised";
    const eventMap = {};
    (dispatch.timeline || []).forEach((e) => {
      eventMap[e.status] = e;
    });

    if (isIssue) {
      return (dispatch.timeline || []).map((ev, i, arr) => ({
        label: ev.status,
        desc: ev.description,
        time: ev.timestamp,
        isDone: true,
        isActive: i === arr.length - 1,
        isFuture: false,
      }));
    }

    return JOURNEY_STEPS.map((step, i) => {
      const real = eventMap[step.key];
      return {
        label: step.label,
        desc: real?.description || step.desc,
        time: real?.timestamp || null,
        isDone: i <= currentIdx,
        isActive: i === currentIdx,
        isFuture: i > currentIdx,
      };
    });
  };

  const timeline = buildTimeline();
  const statusCfg = dispatch
    ? STATUS_CONFIG[dispatch.status] || STATUS_CONFIG["Dispatched"]
    : null;
  const waybillFull = dispatch?.waybillUrl
    ? `${API_BASE}${dispatch.waybillUrl}`
    : null;

  const isDelivered = dispatch?.status === "Delivered";
  const canConfirm =
    dispatch && !isDelivered && dispatch.status !== "Issue Raised";
  const showReviewPrompt = (isDelivered || justConfirmed) && !reviewDone;
  const displayRating = hoverRating || rating;

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="to-shell">
      {/* Nav */}
      <nav className="to-nav">
        <div className="to-brand" onClick={() => navigate("/")}>
          <div className="to-brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
            </svg>
          </div>
          <div className="to-brand-name">
            Swift<span>Port</span>
          </div>
        </div>
        <div className="to-nav-tag">Order Tracking</div>
      </nav>

      {/* Search bar */}
      <div className="to-search-bar">
        <input
          className="to-search-input"
          placeholder="Enter tracking ID — e.g. TRK-2603-A7F3K2"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button className="to-search-btn" onClick={handleSearch}>
          Track →
        </button>
      </div>

      {/* Main */}
      <main className="to-main">
        {loading && (
          <div className="to-loading">
            <div className="to-loading-spinner" />
            <div className="to-loading-text">Looking up your order…</div>
          </div>
        )}

        {!loading && error && (
          <div className="to-empty">
            <div className="to-empty-icon">📭</div>
            <div className="to-empty-title">Order not found</div>
            <div className="to-empty-sub">
              {error}
              <br />
              <br />
              Check your tracking ID — it should look like{" "}
              <strong style={{ color: "#c84b2f" }}>TRK-2603-A7F3K2</strong>
            </div>
          </div>
        )}

        {!loading && !error && !dispatch && (
          <div className="to-empty">
            <div className="to-empty-icon">🔍</div>
            <div className="to-empty-title">Track your order</div>
            <div className="to-empty-sub">
              Enter the tracking ID your seller shared with you.
              <br />
              Find it in the WhatsApp message or email they sent.
            </div>
          </div>
        )}

        {!loading && dispatch && (
          <>
            {/* Status hero */}
            <div className="to-status-hero">
              <div className="to-status-eyebrow">
                Order {dispatch.trackingId}
              </div>
              <div className="to-status-title">
                {isDelivered || justConfirmed ? (
                  <>
                    Your order has <em>arrived!</em>
                  </>
                ) : dispatch.status === "Issue Raised" ? (
                  <>
                    There's an <em>issue</em> with your order
                  </>
                ) : (
                  <>
                    Your order is <em>{dispatch.status.toLowerCase()}.</em>
                  </>
                )}
              </div>
              <div className={`to-status-pill ${statusCfg.cls}`}>
                <span className="to-status-dot" />
                {statusCfg.icon} {statusCfg.label}
              </div>
            </div>

            <div className="to-grid">
              {/* Timeline */}
              <div className="to-card">
                <div className="to-card-head">
                  <div className="to-card-title">Delivery Timeline</div>
                  <div className="to-card-sub">Updated by seller</div>
                </div>
                <div className="to-timeline">
                  {timeline.map((ev, i) => (
                    <div key={i} className="to-tl-item">
                      <div className="to-tl-left">
                        <div
                          className={`to-tl-dot${ev.isActive ? " active" : ev.isDone ? " done" : " future"}`}
                        />
                        {i < timeline.length - 1 && (
                          <div
                            className={`to-tl-line${ev.isDone && !ev.isActive ? " done" : ""}`}
                          />
                        )}
                      </div>
                      <div className="to-tl-right">
                        <div
                          className={`to-tl-event${ev.isFuture ? " future" : ""}`}
                        >
                          {ev.label}
                        </div>
                        <div className="to-tl-desc">{ev.desc}</div>
                        {ev.time && (
                          <div
                            className={`to-tl-time${ev.isDone ? " done" : ""}`}
                          >
                            {formatDate(ev.time)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right sidebar */}
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
                {/* Order details */}
                <div className="to-card">
                  <div className="to-card-head">
                    <div className="to-card-title">Order Details</div>
                  </div>
                  {[
                    ["Tracking ID", dispatch.trackingId],
                    ["Buyer", dispatch.buyer?.name],
                    ["Courier", dispatch.courier?.name],
                    ["Dispatched", formatDate(dispatch.createdAt)],
                    ["Last Update", formatDate(dispatch.updatedAt)],
                    ...(dispatch.courier?.trackingNumber
                      ? [["Courier No.", dispatch.courier.trackingNumber]]
                      : []),
                  ].map(([k, v]) => (
                    <div key={k} className="to-detail-row">
                      <div className="to-detail-key">{k}</div>
                      <div className="to-detail-val">{v || "—"}</div>
                    </div>
                  ))}
                </div>

                {/* Waybill proof */}
                {waybillFull && (
                  <div className="to-card to-waybill">
                    <div className="to-card-head">
                      <div className="to-card-title">Dispatch Proof</div>
                      <div className="to-card-sub">Uploaded by seller</div>
                    </div>
                    <img src={waybillFull} alt="Waybill" />
                    <div className="to-waybill-label">
                      🛡️ Verified dispatch receipt
                    </div>
                  </div>
                )}

                {/* ── CONFIRM RECEIPT ── */}
                <div className="to-confirm-section">
                  {canConfirm && !justConfirmed && (
                    <div className="to-confirm-card">
                      <div className="to-confirm-head">
                        <div className="to-confirm-head-icon">📬</div>
                        <div>
                          <div className="to-confirm-head-title">
                            Did you receive this order?
                          </div>
                          <div className="to-confirm-head-sub">
                            Confirm receipt to close this order.
                          </div>
                        </div>
                      </div>
                      <div className="to-confirm-body">
                        <div className="to-confirm-note">
                          Enter the phone number your seller used when booking
                          your order to verify it's you.
                        </div>
                        <div className="to-phone-row">
                          <input
                            className={`to-phone-input${confirmError ? " error" : ""}`}
                            placeholder="+234 801 234 5678"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              setConfirmError("");
                            }}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleConfirm()
                            }
                          />
                          <button
                            className="to-confirm-btn"
                            onClick={handleConfirm}
                            disabled={confirming}
                          >
                            {confirming ? (
                              <>
                                <div
                                  className="to-spinner"
                                  style={{ borderTopColor: "white" }}
                                />{" "}
                                Confirming…
                              </>
                            ) : (
                              "✓ Yes, I received it"
                            )}
                          </button>
                        </div>
                        {confirmError && (
                          <div className="to-confirm-error">
                            ⚠ {confirmError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {isDelivered && !justConfirmed && (
                    <div className="to-confirmed-banner">
                      <div className="to-confirmed-icon">✅</div>
                      <div>
                        <div className="to-confirmed-title">
                          Order confirmed as delivered
                        </div>
                        <div className="to-confirmed-sub">
                          This order has been marked as received.
                        </div>
                      </div>
                    </div>
                  )}

                  {justConfirmed && (
                    <div className="to-confirmed-banner">
                      <div className="to-confirmed-icon">🎉</div>
                      <div>
                        <div className="to-confirmed-title">
                          Receipt confirmed — thank you!
                        </div>
                        <div className="to-confirmed-sub">
                          Please take a moment to rate your experience below.
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── REVIEW FORM ── */}
                {(showReviewPrompt || justConfirmed) && !reviewDone && (
                  <div className="to-review-section">
                    <div className="to-review-card">
                      <div className="to-review-head">
                        <div className="to-review-head-icon">⭐</div>
                        <div>
                          <div className="to-review-head-title">
                            Rate your experience
                          </div>
                          <div className="to-review-head-sub">
                            Help other buyers know what to expect.
                          </div>
                        </div>
                      </div>
                      <div className="to-review-body">
                        {/* Stars */}
                        <div>
                          <span className="to-review-label">
                            Overall rating <span>*</span>
                          </span>
                          <div className="to-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <span
                                key={s}
                                className={`to-star${displayRating >= s ? " lit" : ""}`}
                                onClick={() => setRating(s)}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          {displayRating > 0 && (
                            <div className="to-star-label">
                              {STAR_LABELS[displayRating]}
                            </div>
                          )}
                        </div>

                        {/* Item condition */}
                        <div>
                          <span className="to-review-label">
                            Item condition <span>*</span>
                          </span>
                          <div className="to-option-grid">
                            {CONDITION_OPTIONS.map((o) => (
                              <button
                                key={o.value}
                                className={`to-option-btn${itemCondition === o.value ? ` selected ${o.tone}` : ""}`}
                                onClick={() => setItemCondition(o.value)}
                              >
                                <span className="to-option-icon">{o.icon}</span>
                                {o.value}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Delivery speed */}
                        <div>
                          <span className="to-review-label">
                            Delivery speed <span>*</span>
                          </span>
                          <div className="to-option-grid">
                            {SPEED_OPTIONS.map((o) => (
                              <button
                                key={o.value}
                                className={`to-option-btn${deliverySpeed === o.value ? ` selected ${o.tone}` : ""}`}
                                onClick={() => setDeliverySpeed(o.value)}
                              >
                                <span className="to-option-icon">{o.icon}</span>
                                {o.value}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Would buy again */}
                        <div>
                          <span className="to-review-label">
                            Would you buy from this seller again? <span>*</span>
                          </span>
                          <div className="to-wba-row">
                            <button
                              className={`to-wba-btn yes${wouldBuyAgain === true ? " selected" : ""}`}
                              onClick={() => setWouldBuyAgain(true)}
                            >
                              👍 Yes, definitely
                            </button>
                            <button
                              className={`to-wba-btn no${wouldBuyAgain === false ? " selected" : ""}`}
                              onClick={() => setWouldBuyAgain(false)}
                            >
                              👎 No
                            </button>
                          </div>
                        </div>

                        {/* Comment */}
                        <div>
                          <span className="to-review-label">
                            Leave a comment (optional)
                          </span>
                          <textarea
                            className="to-review-textarea"
                            placeholder="Describe your experience — packaging, communication, accuracy of item…"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            maxLength={500}
                          />
                          <div
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: 10,
                              color: "#44495e",
                              marginTop: 4,
                              textAlign: "right",
                            }}
                          >
                            {comment.length}/500
                          </div>
                        </div>
                      </div>

                      <div className="to-review-footer">
                        <button
                          className="to-review-submit"
                          onClick={handleReviewSubmit}
                          disabled={submittingReview}
                        >
                          {submittingReview ? (
                            <>
                              <div
                                className="to-spinner"
                                style={{ borderTopColor: "#0a0a0f" }}
                              />{" "}
                              Submitting…
                            </>
                          ) : (
                            "⭐ Submit Review"
                          )}
                        </button>
                        {reviewError && (
                          <div className="to-review-api-error">
                            ⚠ {reviewError}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── REVIEW SUBMITTED ── */}
                {reviewDone && existingReview && (
                  <div className="to-review-section">
                    <div className="to-review-card">
                      <div className="to-review-done">
                        <div className="to-review-done-stars">
                          {"★".repeat(existingReview.rating)}
                          {"☆".repeat(5 - existingReview.rating)}
                        </div>
                        <div className="to-review-done-title">
                          {existingReview.rating >= 4
                            ? "Thanks for the great review! 🎉"
                            : "Thanks for your feedback."}
                        </div>
                        <div className="to-review-done-sub">
                          You rated this order{" "}
                          <strong style={{ color: "#f5a623" }}>
                            {existingReview.rating} star
                            {existingReview.rating !== 1 ? "s" : ""}
                          </strong>
                          .<br />
                          Condition: {existingReview.itemCondition} · Delivery:{" "}
                          {existingReview.deliverySpeed}
                          <br />
                          {existingReview.comment && (
                            <>
                              <br />"{existingReview.comment}"
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Issue / dispute button */}
                {!isDelivered &&
                  !justConfirmed &&
                  dispatch.status !== "Issue Raised" && (
                    <div className="to-card">
                      <div style={{ padding: "16px 20px" }}>
                        <div
                          style={{
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 13,
                            fontWeight: 800,
                            color: "#0a0a0f",
                            marginBottom: 6,
                          }}
                        >
                          Problem with this order?
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontSize: 11,
                            color: "#8a8478",
                            letterSpacing: "0.04em",
                            lineHeight: 1.6,
                            marginBottom: 14,
                          }}
                        >
                          Item not arrived, damaged, or wrong item sent? Raise a
                          dispute and the seller will be notified immediately.
                        </div>
                        <button
                          onClick={() => setShowDispute(true)}
                          style={{
                            width: "100%",
                            padding: "11px 0",
                            background: "#fdf0ed",
                            color: "#c84b2f",
                            fontFamily: "'Syne',sans-serif",
                            fontSize: 13,
                            fontWeight: 800,
                            border: "1.5px solid #f0c8bf",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#c84b2f";
                            e.target.style.color = "white";
                            e.target.style.borderColor = "#c84b2f";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#fdf0ed";
                            e.target.style.color = "#c84b2f";
                            e.target.style.borderColor = "#f0c8bf";
                          }}
                        >
                          ⚠ Report an Issue
                        </button>
                      </div>
                    </div>
                  )}

                {dispatch.status === "Issue Raised" && (
                  <div className="to-card">
                    <div
                      style={{
                        padding: "14px 20px",
                        background: "#fdf0ed",
                        borderLeft: "3px solid #c84b2f",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 10,
                          color: "#c84b2f",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        Dispute open
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          color: "#8a8478",
                          letterSpacing: "0.04em",
                          lineHeight: 1.6,
                        }}
                      >
                        A dispute has been raised. The seller has been notified
                        and will respond shortly.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* Floating WhatsApp share */}
      {dispatch && (
        <a
          className="to-wa-float"
          href={makeWaShare()}
          target="_blank"
          rel="noopener noreferrer"
        >
          <div className="to-wa-float-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share tracking
          </div>
        </a>
      )}

      <footer className="to-footer">
        <div className="to-footer-copy">
          © 2026 SwiftPort · The easiest way for Nigerian sellers to prove they
          shipped.
        </div>
        <div className="to-footer-copy">Powered by trust 🛡️</div>
      </footer>

      {/* Dispute form modal */}
      {showDispute && dispatch && (
        <DisputeForm
          dispatch={dispatch}
          onClose={() => setShowDispute(false)}
        />
      )}
    </div>
  );
}
