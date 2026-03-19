import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import QRDispatchCard from "../QRDispatchCard/QRDispatchCard";
import "./CreateDispatch.css";

const COURIERS = [
  "GIG Logistics", "DHL Express", "Kwik Delivery",
  "Aramex Nigeria", "UPS Nigeria", "FedEx Nigeria",
  "Sendbox", "Bolt Rides (Same-Day)", "Other",
];

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard"  },
  { label: "Orders",    icon: "◈", path: "/shipments"   },
  { label: "Tracking",  icon: "◎", path: "/tracking"    },
  { label: "Reports",   icon: "◧", path: "/analytics"   },
  { label: "Settings",  icon: "⊕", path: "/settings"    },
];

// ── Component ─────────────────────────────────────────────────────────────
export default function CreateDispatch() {
  const navigate  = useNavigate();
  const fileRef   = useRef(null);
  const { authFetch, seller } = useAuth();

  const [form, setForm] = useState({
    customerName:         "",
    customerPhone:        "",
    customerEmail:        "",
    courier:              "",
    courierTrackingNumber:"",
    notes:                "",
  });

  const [waybill,    setWaybill]    = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors,     setErrors]     = useState({});
  const [apiError,   setApiError]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(null);
  const lastSuccess = useRef(null); // preserved after success modal closes for QR card
  const [copied,     setCopied]     = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sideNav,    setSideNav]    = useState("Dashboard");
  const [showQR,     setShowQR]     = useState(false);

  // ── Field handler ──
  const setField = key => e => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: null }));
    setApiError("");
  };

  // ── File handling ──
  const handleFile = file => {
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setErrors(er => ({ ...er, waybill: "Only JPG, PNG, WEBP, or PDF allowed." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(er => ({ ...er, waybill: "File too large — max 5 MB." }));
      return;
    }
    const reader = new FileReader();
    reader.onload = e => setWaybill({ file, preview: e.target.result, isPdf: file.type === "application/pdf" });
    reader.readAsDataURL(file);
    setErrors(er => ({ ...er, waybill: null }));
  };

  const onFileChange = e  => handleFile(e.target.files[0]);
  const onDrop       = e  => { e.preventDefault(); setIsDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const onDragOver   = e  => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave  = () => setIsDragOver(false);

  // ── Validation ──
  const validate = () => {
    const e = {};
    if (!form.customerName.trim())  e.customerName  = "Buyer name is required.";
    if (!form.customerPhone.trim()) e.customerPhone = "Phone number is required.";
    if (form.customerEmail && !/\S+@\S+\.\S+/.test(form.customerEmail))
                                    e.customerEmail = "Enter a valid email address.";
    if (!form.courier)              e.courier       = "Please select a courier.";
    if (!waybill)                   e.waybill       = "Please upload the waybill or receipt.";
    return e;
  };

  // ── Submit → real API with JWT ──
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setApiError("");

    try {
      const body = new FormData();
      body.append("customerName",          form.customerName.trim());
      body.append("customerPhone",         form.customerPhone.trim());
      body.append("customerEmail",         form.customerEmail.trim());
      body.append("courier",               form.courier);
      body.append("courierTrackingNumber", form.courierTrackingNumber.trim());
      body.append("notes",                 form.notes.trim());
      body.append("waybill",               waybill.file);

      const res  = await authFetch("/api/dispatches", {
        method: "POST",
        body,
        // Note: do NOT set Content-Type header — browser sets it automatically
        // with the correct multipart boundary for FormData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Something went wrong. Please try again.");
      }

      setSuccess(data);
      lastSuccess.current = data;

    } catch (err) {
      setApiError(err.message || "Could not reach the server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // ── Copy tracking ID ──
  const copyTrackingId = () => {
    if (!success) return;
    navigator.clipboard.writeText(success.trackingId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Copy tracking link ──
  const copyLink = () => {
    if (!success) return;
    navigator.clipboard.writeText(success.trackingUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // ── Reset form for new dispatch ──
  const resetForm = () => {
    setSuccess(null);
    setForm({ customerName: "", customerPhone: "", customerEmail: "", courier: "", courierTrackingNumber: "", notes: "" });
    setWaybill(null);
    setErrors({});
    setApiError("");
  };

  // ── Live preview ──
  const preview = [
    { key: "Buyer",    val: form.customerName    || null },
    { key: "Phone",    val: form.customerPhone   || null },
    { key: "Email",    val: form.customerEmail   || null },
    { key: "Courier",  val: form.courier         || null },
    { key: "Waybill",  val: waybill?.file?.name  || null },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="cd-shell">

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
          <div className="sb-icon" title="Sign Out" onClick={() => navigate("/login")}>↩</div>
        </div>
      </aside>

      <main className="cd-main">

        {/* Header */}
        <div className="cd-header">
          <div className="cd-header-left">
            <button className="cd-back-btn" onClick={() => navigate("/dashboard")}>←</button>
            <div>
              <div className="cd-page-title">Create Dispatch</div>
              <div className="cd-page-sub">Fill in the buyer's details and upload proof of dispatch.</div>
            </div>
          </div>
        </div>

        {/* API error banner */}
        {apiError && (
          <div className="cd-api-error">
            <span>⚠</span>
            <span>{apiError}</span>
          </div>
        )}

        <div className="cd-body">
          <div>

            {/* ── Section 1: Buyer ── */}
            <div className="cd-card">
              <div className="cd-card-head">
                <div className="cd-card-head-icon">👤</div>
                <div>
                  <div className="cd-card-title">Buyer Information</div>
                  <div className="cd-card-sub">Who are you sending this order to?</div>
                </div>
              </div>
              <div className="cd-card-body">
                <div className="cd-field full">
                  <label className="cd-label">Full Name <span>*</span></label>
                  <input className={`cd-input${errors.customerName ? " error" : ""}`}
                    placeholder="e.g. Chisom Nwosu"
                    value={form.customerName} onChange={setField("customerName")} />
                  {errors.customerName && <div className="cd-error-msg">{errors.customerName}</div>}
                </div>
                <div className="cd-grid-2">
                  <div className="cd-field">
                    <label className="cd-label">Phone Number <span>*</span></label>
                    <input className={`cd-input${errors.customerPhone ? " error" : ""}`}
                      placeholder="e.g. 0801 234 5678" type="tel"
                      value={form.customerPhone} onChange={setField("customerPhone")} />
                    {errors.customerPhone && <div className="cd-error-msg">{errors.customerPhone}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Email Address</label>
                    <input className={`cd-input${errors.customerEmail ? " error" : ""}`}
                      placeholder="buyer@example.com (optional)" type="email"
                      value={form.customerEmail} onChange={setField("customerEmail")} />
                    {errors.customerEmail
                      ? <div className="cd-error-msg">{errors.customerEmail}</div>
                      : <div className="cd-hint">Buyer gets their tracking link by email automatically.</div>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: Courier ── */}
            <div className="cd-card">
              <div className="cd-card-head">
                <div className="cd-card-head-icon">🚚</div>
                <div>
                  <div className="cd-card-title">Courier & Tracking</div>
                  <div className="cd-card-sub">Which courier are you using?</div>
                </div>
              </div>
              <div className="cd-card-body">
                <div className="cd-grid-2">
                  <div className="cd-field">
                    <label className="cd-label">Courier Service <span>*</span></label>
                    <select className={`cd-select${errors.courier ? " error" : ""}`}
                      value={form.courier} onChange={setField("courier")}>
                      <option value="">— Select courier —</option>
                      {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.courier && <div className="cd-error-msg">{errors.courier}</div>}
                  </div>
                  <div className="cd-field">
                    <label className="cd-label">Courier Tracking No.</label>
                    <input className="cd-input"
                      placeholder="Optional — e.g. GIG-2026-00384"
                      value={form.courierTrackingNumber} onChange={setField("courierTrackingNumber")} />
                    <div className="cd-hint">Add if the courier gave you their own tracking number.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 3: Waybill ── */}
            <div className="cd-card">
              <div className="cd-card-head">
                <div className="cd-card-head-icon">📄</div>
                <div>
                  <div className="cd-card-title">Waybill / Dispatch Receipt <span style={{ color: "var(--rust)", fontSize: 12 }}>*</span></div>
                  <div className="cd-card-sub">Upload a photo or scan. This is your timestamped proof.</div>
                </div>
              </div>
              <div className="cd-card-body">
                {!waybill ? (
                  <div className={`cd-upload-zone${isDragOver ? " drag-over" : ""}`}
                    onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={onFileChange} style={{ display: "none" }} />
                    <div className="cd-upload-icon">📎</div>
                    <div className="cd-upload-title">Drop your waybill here</div>
                    <div className="cd-upload-sub">
                      or <span>click to browse</span><br />
                      JPG, PNG, WEBP or PDF · Max 5 MB
                    </div>
                  </div>
                ) : (
                  <div className="cd-upload-preview">
                    {waybill.isPdf ? (
                      <div style={{ padding: "28px 20px", textAlign: "center", background: "#fafaf8" }}>
                        <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: "var(--steel)", letterSpacing: "0.04em" }}>PDF uploaded successfully</div>
                      </div>
                    ) : (
                      <img src={waybill.preview} alt="Waybill preview" className="cd-preview-img" />
                    )}
                    <div className="cd-preview-info">
                      <div className="cd-preview-name">{waybill.file.name}</div>
                      <button className="cd-preview-remove" onClick={() => setWaybill(null)}>Remove ×</button>
                    </div>
                  </div>
                )}
                {errors.waybill && <div className="cd-error-msg" style={{ marginTop: 8 }}>{errors.waybill}</div>}
              </div>

              {/* Submit */}
              <div className="cd-submit-row">
                <button className="cd-cancel-btn" onClick={() => navigate("/dashboard")}>Cancel</button>
                <button className={`cd-submit-btn${loading ? " loading" : ""}`}
                  onClick={handleSubmit} disabled={loading}>
                  {loading
                    ? <><div className="cd-spinner" /> Creating dispatch…</>
                    : <>🛡️ Create Dispatch & Generate ID</>
                  }
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="cd-sidebar">
            <div className="cd-preview-card">
              <div className="cd-preview-card-head">Order Preview</div>
              <div className="cd-preview-card-body">
                {preview.map(p => (
                  <div key={p.key} className="cd-preview-row">
                    <div className="cd-preview-key">{p.key}</div>
                    <div className={`cd-preview-val${!p.val ? " empty" : ""}`}>{p.val || "—"}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="cd-info-box">
              <div className="cd-info-box-title">🛡️ Why this matters</div>
              {[
                "A unique tracking ID is generated and saved in your database the moment you submit.",
                "The waybill is stored as timestamped proof you dispatched the order.",
                "Your buyer gets a link to track their order — no more 'where is my goods?' calls.",
                "Share the tracking link on WhatsApp with one tap after creating the dispatch.",
              ].map((t, i) => (
                <div key={i} className="cd-info-item">
                  <div className="cd-info-dot" />
                  <div className="cd-info-text">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── SUCCESS MODAL ── */}
      {success && (
        <div className="cd-success-overlay">
          <div className="cd-success-modal">

            <div className="cd-success-top">
              <div className="cd-success-check">✓</div>
              <div className="cd-success-title">Dispatch Created!</div>
              <div className="cd-success-sub">
                Saved to database · Tracking ID generated<br />
                Share with {success.dispatch?.buyer?.name} now.
              </div>
            </div>

            <div className="cd-success-body">

              {/* Tracking ID */}
              <div className="cd-tracking-block">
                <div className="cd-tracking-label">Tracking ID</div>
                <div className="cd-tracking-id">{success.trackingId}</div>
                <button className={`cd-tracking-copy${copied ? " copied" : ""}`} onClick={copyTrackingId}>
                  {copied ? "✓ Copied!" : "⊕ Copy ID"}
                </button>
              </div>

              {/* WhatsApp + Copy link */}
              <div className="cd-share-row">
                <a
                  className="cd-wa-btn"
                  href={success.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Share on WhatsApp
                </a>
                <button className={`cd-copy-link-btn${linkCopied ? " copied" : ""}`} onClick={copyLink}>
                  {linkCopied ? "✓ Copied!" : "⊕ Copy link"}
                </button>
              </div>

              {/* Email notification status */}
              <div className={`cd-email-badge${success.emailSent ? " sent" : " not-sent"}`}>
                {success.emailSent
                  ? <>✓ Email sent to {success.dispatch?.buyer?.email}</>
                  : <>◎ No email — buyer gets the link above</>
                }
              </div>

              {/* Order summary */}
              <div className="cd-success-details">
                {[
                  ["Buyer",    success.dispatch?.buyer?.name],
                  ["Phone",    success.dispatch?.buyer?.phone],
                  ["Courier",  success.dispatch?.courier?.name],
                  ...(success.dispatch?.courier?.trackingNumber
                    ? [["Courier No.", success.dispatch.courier.trackingNumber]]
                    : []),
                ].map(([k, v]) => (
                  <div key={k} className="cd-success-detail-row">
                    <div className="cd-success-detail-key">{k}</div>
                    <div className="cd-success-detail-val">{v}</div>
                  </div>
                ))}
              </div>

              <div className="cd-success-actions">
                <button className="cd-success-btn-secondary" onClick={resetForm}>
                  + New Dispatch
                </button>
                <button className="cd-success-btn-secondary"
                  style={{ background: "#0a0a0f", color: "#f5f3ee", border: "none" }}
                  onClick={() => { setShowQR(true); setSuccess(null); }}>
                  🖨 Print Dispatch Slip
                </button>
                <button className="cd-success-btn-primary" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard →
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── QR DISPATCH CARD ── */}
      {showQR && lastSuccess.current && (
        <QRDispatchCard
          dispatch={lastSuccess.current.dispatch}
          seller={seller}
          onClose={() => setShowQR(false)}
        />
      )}

    </div>
  );
}
