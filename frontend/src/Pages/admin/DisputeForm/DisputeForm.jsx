import { useState, useRef } from "react";
import "./DisputeForm.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const REASONS = [
  { label: "Item not received",  icon: "📭" },
  { label: "Item damaged",       icon: "💔" },
  { label: "Wrong item sent",    icon: "❓" },
  { label: "Partial order",      icon: "📦" },
  { label: "Delayed delivery",   icon: "🕐" },
  { label: "Other",              icon: "💬" },
];

export default function DisputeForm({ dispatch, onClose }) {
  const fileRef = useRef(null);

  const [step,        setStep]        = useState(1); // 1 = form, 2 = success
  const [reason,      setReason]      = useState("");
  const [description, setDescription] = useState("");
  const [buyerName,   setBuyerName]   = useState(dispatch?.buyer?.name  || "");
  const [buyerPhone,  setBuyerPhone]  = useState(dispatch?.buyer?.phone || "");
  const [buyerEmail,  setBuyerEmail]  = useState("");
  const [files,       setFiles]       = useState([]);
  const [errors,      setErrors]      = useState({});
  const [apiError,    setApiError]    = useState("");
  const [loading,     setLoading]     = useState(false);
  const [disputeId,   setDisputeId]   = useState("");

  const validate = () => {
    const e = {};
    if (!reason)              e.reason      = "Please select a reason.";
    if (!description.trim())  e.description = "Please describe the issue.";
    if (!buyerName.trim())    e.buyerName   = "Your name is required.";
    if (!buyerPhone.trim())   e.buyerPhone  = "Your phone number is required.";
    return e;
  };

  const handleFiles = (newFiles) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    const valid   = [...newFiles].filter(f => allowed.includes(f.type) && f.size < 5 * 1024 * 1024);
    setFiles(prev => [...prev, ...valid].slice(0, 3));
  };

  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setApiError("");

    try {
      const body = new FormData();
      body.append("trackingId",   dispatch.trackingId);
      body.append("buyerName",    buyerName.trim());
      body.append("buyerPhone",   buyerPhone.trim());
      body.append("buyerEmail",   buyerEmail.trim());
      body.append("reason",       reason);
      body.append("description",  description.trim());
      files.forEach(f => body.append("evidence", f));

      const res  = await fetch(`${API_BASE}/api/disputes`, { method: "POST", body });
      const data = await res.json();

      if (!res.ok || !data.success) throw new Error(data.message || "Failed to submit dispute.");

      setDisputeId(data.disputeId);
      setStep(2);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (setter, key) => e => {
    setter(e.target.value);
    if (errors[key]) setErrors(er => ({ ...er, [key]: null }));
    setApiError("");
  };

  if (step === 2) {
    return (
      <div className="df-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="df-modal">
          <div className="df-head">
            <div className="df-head-left">
              <div className="df-head-eyebrow">Dispute submitted</div>
              <div className="df-head-title">We've received your report</div>
            </div>
            <button className="df-close" onClick={onClose}>✕</button>
          </div>
          <div className="df-success">
            <div className="df-success-icon">🛡️</div>
            <div className="df-success-title">Dispute filed successfully</div>
            <div className="df-success-id">{disputeId}</div>
            <div className="df-success-sub">
              Your dispute reference is above — save it. The seller has been notified
              and will respond shortly. You can track updates using your tracking ID.
            </div>
            <button className="df-success-close" onClick={onClose}>
              Back to tracking →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="df-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="df-modal">

        {/* Header */}
        <div className="df-head">
          <div className="df-head-left">
            <div className="df-head-eyebrow">Order {dispatch?.trackingId}</div>
            <div className="df-head-title">Report an Issue</div>
            <div className="df-head-sub">Tell us what went wrong — the seller will be notified.</div>
          </div>
          <button className="df-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="df-body">

          {apiError && (
            <div className="df-api-error"><span>⚠</span><span>{apiError}</span></div>
          )}

          {/* Reason */}
          <div className="df-field">
            <label className="df-label">What's the issue? <span>*</span></label>
            <div className="df-reasons">
              {REASONS.map(r => (
                <button key={r.label}
                  className={`df-reason-btn${reason === r.label ? " selected" : ""}`}
                  onClick={() => { setReason(r.label); setErrors(er => ({ ...er, reason: null })); }}>
                  <span className="df-reason-icon">{r.icon}</span>
                  {r.label}
                </button>
              ))}
            </div>
            {errors.reason && <div className="df-error-msg">{errors.reason}</div>}
          </div>

          {/* Description */}
          <div className="df-field">
            <label className="df-label">Describe the problem <span>*</span></label>
            <textarea className={`df-textarea${errors.description ? " error" : ""}`}
              placeholder="E.g. I ordered a pair of shoes size 42 but received size 40. The parcel was sealed when I got it."
              value={description}
              onChange={setField(setDescription, "description")} />
            {errors.description && <div className="df-error-msg">{errors.description}</div>}
          </div>

          {/* Buyer info */}
          <div className="df-field">
            <label className="df-label">Your Name <span>*</span></label>
            <input className={`df-input${errors.buyerName ? " error" : ""}`}
              placeholder="Your full name"
              value={buyerName}
              onChange={setField(setBuyerName, "buyerName")} />
            {errors.buyerName && <div className="df-error-msg">{errors.buyerName}</div>}
          </div>

          <div className="df-field">
            <label className="df-label">Phone Number <span>*</span></label>
            <input className={`df-input${errors.buyerPhone ? " error" : ""}`}
              type="tel" placeholder="Must match the number on your order"
              value={buyerPhone}
              onChange={setField(setBuyerPhone, "buyerPhone")} />
            {errors.buyerPhone
              ? <div className="df-error-msg">{errors.buyerPhone}</div>
              : <div className="df-hint">Must match the phone number your seller used when booking your order.</div>
            }
          </div>

          <div className="df-field">
            <label className="df-label">Email (optional)</label>
            <input className="df-input" type="email"
              placeholder="For updates on your dispute"
              value={buyerEmail}
              onChange={e => setBuyerEmail(e.target.value)} />
          </div>

          {/* Evidence upload */}
          <div className="df-field">
            <label className="df-label">Upload Evidence (optional)</label>
            {files.length < 3 && (
              <div className="df-upload-zone"
                onClick={() => fileRef.current?.click()}>
                <input ref={fileRef} type="file" accept="image/*,application/pdf"
                  multiple style={{ display: "none" }}
                  onChange={e => handleFiles(e.target.files)} />
                <div className="df-upload-icon">📎</div>
                <div className="df-upload-title">Attach photos or receipts</div>
                <div className="df-upload-sub">
                  <span>Click to browse</span> · JPG, PNG, PDF · Max 5 MB each · Up to 3 files
                </div>
              </div>
            )}
            {files.length > 0 && (
              <div className="df-files">
                {files.map((f, i) => (
                  <div key={i} className="df-file-row">
                    <span>✓ {f.name}</span>
                    <button className="df-file-remove" onClick={() => removeFile(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="df-foot">
          <button className="df-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="df-btn-submit" onClick={handleSubmit} disabled={loading}>
            {loading ? <><div className="df-spinner" /> Submitting…</> : "🛡️ Submit Dispute →"}
          </button>
        </div>

      </div>
    </div>
  );
}
