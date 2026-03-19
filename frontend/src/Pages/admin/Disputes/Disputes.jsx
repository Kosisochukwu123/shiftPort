import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Disputes.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const STATUS_FILTERS = ["All", "Open", "Seller Responded", "Under Review", "Resolved", "Closed"];

const RESOLVE_OUTCOMES = [
  "Refund issued",
  "Reshipped",
  "Resolved — item delivered",
  "Rejected",
  "No action required",
];

const NAV_ICONS = [
  { label: "Dashboard",  icon: "⬡", path: "/dashboard"  },
  { label: "Orders",     icon: "◈", path: "/shipments"   },
  { label: "Disputes",   icon: "⚠", path: "/disputes"    },
  { label: "Reports",    icon: "◧", path: "/analytics"   },
  { label: "Settings",   icon: "⊕", path: "/settings"    },
];

function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatDateTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("en-NG", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusClass(s) {
  if (s === "Open")              return "dsp-status-open";
  if (s === "Seller Responded")  return "dsp-status-responded";
  if (s === "Resolved")          return "dsp-status-resolved";
  if (s === "Under Review")      return "dsp-status-review";
  return "dsp-status-closed";
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Disputes() {
  const navigate = useNavigate();
  const { authFetch, seller, logout } = useAuth();

  const [sideNav,      setSideNav]      = useState("Disputes");
  const [filter,       setFilter]       = useState("All");
  const [disputes,     setDisputes]     = useState([]);
  const [unread,       setUnread]       = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [activeId,     setActiveId]     = useState(null);

  // Detail pane
  const [detail,       setDetail]       = useState(null);
  const [detailLoading,setDetailLoading]= useState(false);

  // Reply
  const [replyText,    setReplyText]    = useState("");
  const [replying,     setReplying]     = useState(false);

  // Resolve modal
  const [showResolve,  setShowResolve]  = useState(false);
  const [outcome,      setOutcome]      = useState("");
  const [resNotes,     setResNotes]     = useState("");
  const [resolving,    setResolving]    = useState(false);

  const threadRef = useRef(null);

  // ── Fetch inbox ─────────────────────────────────────────────────────────
  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = filter !== "All" ? `?status=${encodeURIComponent(filter)}` : "";
      const res  = await authFetch(`/api/disputes${params}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDisputes(data.disputes || []);
      setUnread(data.unread || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filter]);

  useEffect(() => { fetchDisputes(); }, [fetchDisputes]);

  // ── Fetch dispute detail ────────────────────────────────────────────────
  const fetchDetail = useCallback(async (id) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res  = await authFetch(`/api/disputes/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDetail(data.dispute);
      // Mark read in local state
      setDisputes(prev => prev.map(d => d.disputeId === id ? { ...d, "isRead.seller": true } : d));
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }, [authFetch]);

  const openDispute = (id) => {
    setActiveId(id);
    fetchDetail(id);
    setReplyText("");
  };

  // Auto-scroll thread to bottom when messages change
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [detail?.messages]);

  // ── Send reply ──────────────────────────────────────────────────────────
  const sendReply = async () => {
    if (!replyText.trim() || !activeId) return;
    setReplying(true);
    try {
      const body = new FormData();
      body.append("text", replyText.trim());

      const res  = await authFetch(`/api/disputes/${activeId}/reply`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setDetail(data.dispute);
      setReplyText("");
      // Update status in list
      setDisputes(prev => prev.map(d =>
        d.disputeId === activeId ? { ...d, status: "Seller Responded" } : d
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setReplying(false);
    }
  };

  // ── Resolve ─────────────────────────────────────────────────────────────
  const resolveDispute = async () => {
    if (!outcome || !activeId) return;
    setResolving(true);
    try {
      const res  = await authFetch(`/api/disputes/${activeId}/resolve`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ outcome, notes: resNotes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setDetail(data.dispute);
      setDisputes(prev => prev.map(d =>
        d.disputeId === activeId ? { ...d, status: "Resolved" } : d
      ));
      setShowResolve(false);
      setOutcome("");
      setResNotes("");
    } catch (err) {
      setError(err.message);
    } finally {
      setResolving(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const isResolved = detail && ["Resolved", "Closed"].includes(detail.status);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="dsp-shell">

      {/* Sidebar */}
      <aside className="db-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${sideNav === n.label ? " active" : ""}`}
            onClick={() => { setSideNav(n.label); navigate(n.path); }}>
            {n.icon}
            {n.label === "Disputes" && unread > 0 && (
              <span style={{ position: "absolute", top: 4, right: 4, width: 8, height: 8, background: "#c84b2f", borderRadius: "50%" }} />
            )}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out" onClick={() => { logout(); navigate("/login"); }}>↩</div>
        </div>
      </aside>

      <div className="dsp-main">

        {/* ── INBOX ── */}
        <div className="dsp-inbox">
          <div className="dsp-inbox-head">
            <div style={{ display: "flex", alignItems: "center" }}>
              <div className="dsp-inbox-title">Disputes</div>
              {unread > 0 && <span className="dsp-unread-badge">{unread} new</span>}
            </div>
            <div className="dsp-inbox-sub">
              {loading ? "Loading…" : `${disputes.length} dispute${disputes.length !== 1 ? "s" : ""}`}
            </div>
          </div>

          {/* Filter tabs */}
          <div className="dsp-filters">
            {STATUS_FILTERS.map(f => (
              <button key={f}
                className={`dsp-ftab${filter === f ? " active" : ""}`}
                onClick={() => setFilter(f)}>
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="dsp-list">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: "1px solid #f0ede8" }}>
                  <div className="skeleton" style={{ height: 11, width: "40%", marginBottom: 8, borderRadius: 2 }} />
                  <div className="skeleton" style={{ height: 14, width: "65%", marginBottom: 6, borderRadius: 2 }} />
                  <div className="skeleton" style={{ height: 11, width: "50%", borderRadius: 2 }} />
                </div>
              ))
            ) : disputes.length === 0 ? (
              <div className="dsp-empty">
                <div className="dsp-empty-icon">🛡️</div>
                <div className="dsp-empty-title">
                  {filter === "All" ? "No disputes yet" : `No "${filter}" disputes`}
                </div>
                <div className="dsp-empty-sub">
                  {filter === "All"
                    ? "When buyers raise issues, they'll appear here. Respond quickly to maintain trust."
                    : "Try a different filter."}
                </div>
              </div>
            ) : disputes.map(d => (
              <div key={d.disputeId}
                className={`dsp-item${activeId === d.disputeId ? " active" : ""}${!d["isRead.seller"] ? " unread" : ""}`}
                onClick={() => openDispute(d.disputeId)}>
                <div className="dsp-item-top">
                  <div className="dsp-item-id">{d.disputeId}</div>
                  <div className="dsp-item-time">{timeAgo(d.createdAt)}</div>
                </div>
                <div className="dsp-item-buyer">{d.buyer?.name}</div>
                <div className="dsp-item-reason">{d.reason} · {d.trackingId}</div>
                <div className={`dsp-item-status ${statusClass(d.status)}`}>{d.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DETAIL PANE ── */}
        <div className="dsp-detail">
          {!activeId ? (
            <div className="dsp-no-sel">
              <div className="dsp-no-sel-icon">⚠</div>
              <div className="dsp-no-sel-title">Select a dispute</div>
              <div className="dsp-no-sel-sub">
                Click any dispute from the left to see the full conversation,<br />
                buyer details, and respond or resolve it.
              </div>
            </div>
          ) : detailLoading ? (
            <div style={{ padding: 40, display: "flex", justifyContent: "center" }}>
              <div style={{ width: 28, height: 28, border: "3px solid var(--mist)", borderTopColor: "var(--rust)", borderRadius: "50%", animation: "dspSpin 0.8s linear infinite" }} />
            </div>
          ) : detail ? (
            <>
              {/* Detail header */}
              <div className="dsp-detail-head">
                <div className="dsp-detail-top">
                  <div>
                    <div className="dsp-detail-id">{detail.disputeId} · {detail.trackingId}</div>
                    <div className="dsp-detail-buyer">{detail.buyer?.name}</div>
                    <div className="dsp-detail-meta">
                      {detail.buyer?.phone}
                      {detail.buyer?.email && ` · ${detail.buyer.email}`}
                      {" · Opened "}{timeAgo(detail.createdAt)}
                    </div>
                  </div>
                  <div className="dsp-detail-actions">
                    <button className="dsp-btn"
                      onClick={() => navigate(`/shipments/${detail.trackingId}`)}>
                      View Order →
                    </button>
                    {!isResolved && (
                      <button className="dsp-btn success"
                        onClick={() => setShowResolve(true)}>
                        ✓ Mark Resolved
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info cards */}
              <div className="dsp-info-row">
                <div className="dsp-info-card">
                  <div className="dsp-info-label">Reason</div>
                  <div className="dsp-info-val rust">{detail.reason}</div>
                </div>
                <div className="dsp-info-card">
                  <div className="dsp-info-label">Status</div>
                  <div className={`dsp-info-val${detail.status === "Resolved" ? " green" : ""}`}>{detail.status}</div>
                </div>
                <div className="dsp-info-card">
                  <div className="dsp-info-label">
                    {detail.status === "Resolved" ? "Resolution" : "Opened"}
                  </div>
                  <div className="dsp-info-val">
                    {detail.status === "Resolved"
                      ? detail.resolution?.outcome || "—"
                      : formatDateTime(detail.createdAt)
                    }
                  </div>
                </div>
              </div>

              {/* Thread */}
              <div className="dsp-thread" ref={threadRef}>

                {/* Original description + evidence */}
                <div style={{ marginBottom: 4 }}>
                  <div className="dsp-desc-card">
                    <div className="dsp-desc-label">Buyer's complaint</div>
                    <div className="dsp-desc-text">{detail.description}</div>
                  </div>
                  {detail.evidence?.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                        Evidence attached
                      </div>
                      <div className="dsp-evidence">
                        {detail.evidence.map((e, i) => (
                          e.endsWith(".pdf") ? (
                            <a key={i} className="dsp-evidence-pdf" href={`${API_BASE}${e}`} target="_blank" rel="noopener noreferrer">
                              <span style={{ fontSize: 24 }}>📄</span>
                              <span>PDF</span>
                            </a>
                          ) : (
                            <a key={i} href={`${API_BASE}${e}`} target="_blank" rel="noopener noreferrer">
                              <img className="dsp-evidence-img" src={`${API_BASE}${e}`} alt={`Evidence ${i + 1}`} />
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                {detail.messages?.map((msg, i) => (
                  <div key={i} className={`dsp-msg ${msg.from}`}>
                    <div className={`dsp-msg-avatar ${msg.from}`}>
                      {msg.from === "buyer"  ? (detail.buyer?.name?.[0] || "B") :
                       msg.from === "seller" ? (seller?.businessName?.[0] || "S") : "⬡"}
                    </div>
                    <div className="dsp-msg-bubble">
                      <div className="dsp-msg-from">
                        {msg.from === "buyer"  ? detail.buyer?.name :
                         msg.from === "seller" ? (seller?.businessName || "You") : "SwiftPort"}
                      </div>
                      <div className="dsp-msg-text">{msg.text}</div>
                      {msg.attachments?.length > 0 && (
                        <div className="dsp-msg-attachments">
                          {msg.attachments.map((a, j) => (
                            <a key={j} className="dsp-attachment"
                              href={`${API_BASE}${a}`} target="_blank" rel="noopener noreferrer">
                              📎 Attachment {j + 1}
                            </a>
                          ))}
                        </div>
                      )}
                      <div className="dsp-msg-time">{formatDateTime(msg.timestamp)}</div>
                    </div>
                  </div>
                ))}

              </div>

              {/* Reply box — hidden if resolved */}
              {!isResolved && (
                <div className="dsp-reply">
                  <div className="dsp-reply-label">Reply to buyer</div>
                  <textarea
                    className="dsp-reply-input"
                    placeholder="Type your response here… Be clear and professional. Your reply will be visible to the buyer."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
                  />
                  <div className="dsp-reply-row">
                    <span className="dsp-reply-char">{replyText.length}/1000 · Ctrl+Enter to send</span>
                    <button className="dsp-btn"
                      style={{ fontSize: 12 }}
                      onClick={() => setShowResolve(true)}>
                      ✓ Resolve
                    </button>
                    <button className="dsp-reply-send"
                      onClick={sendReply}
                      disabled={!replyText.trim() || replying}>
                      {replying ? <><div className="dsp-spinner" /> Sending…</> : "Send Reply →"}
                    </button>
                  </div>
                </div>
              )}

              {/* Resolved banner */}
              {isResolved && (
                <div style={{ background: "#e8f5ee", borderTop: "1.5px solid #a8d9bc", padding: "14px 28px", display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <div>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 800, color: "#0a0a0f" }}>
                      Dispute resolved · {detail.resolution?.outcome}
                    </div>
                    {detail.resolution?.notes && (
                      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#8a8478", marginTop: 3 }}>
                        {detail.resolution.notes}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* ── RESOLVE MODAL ── */}
      {showResolve && (
        <div className="dsp-resolve-overlay" onClick={e => { if (e.target === e.currentTarget) setShowResolve(false); }}>
          <div className="dsp-resolve-modal">
            <div className="dsp-resolve-head">
              <div className="dsp-resolve-title">Resolve Dispute</div>
              <button className="dsp-resolve-close" onClick={() => setShowResolve(false)}>✕</button>
            </div>
            <div className="dsp-resolve-body">
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>
                  What was the outcome?
                </div>
                <div className="dsp-resolve-opts">
                  {RESOLVE_OUTCOMES.map(o => (
                    <button key={o}
                      className={`dsp-resolve-opt${outcome === o ? " chosen" : ""}`}
                      onClick={() => setOutcome(o)}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>
                  Additional notes (optional)
                </div>
                <textarea className="dsp-resolve-notes"
                  placeholder="E.g. Spoke with buyer on phone, confirmed delivery on 14 March."
                  value={resNotes}
                  onChange={e => setResNotes(e.target.value)} />
              </div>
            </div>
            <div className="dsp-resolve-foot">
              <button className="dsp-resolve-cancel" onClick={() => setShowResolve(false)}>Cancel</button>
              <button className="dsp-resolve-confirm"
                onClick={resolveDispute}
                disabled={!outcome || resolving}>
                {resolving ? "Saving…" : "Mark as Resolved →"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
