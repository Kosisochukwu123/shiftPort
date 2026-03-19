import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "./Settings.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Navigation config ──────────────────────────────────────────────────────

const NAV_ICONS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Orders",    icon: "◈", path: "/shipments"  },
  { label: "Disputes",  icon: "⚠", path: "/disputes"   },
  { label: "Reports",   icon: "◧", path: "/analytics"  },
  { label: "Settings",  icon: "⊕", path: "/settings"   },
];

const SETTINGS_NAV = [
  { id: "profile",       icon: "◎",  label: "Profile"         },
  { id: "branding",      icon: "🏪", label: "QR Branding"     },
  { id: "trust",         icon: "🛡", label: "Trust & Reviews" },
  { id: "notifications", icon: "🔔", label: "Notifications"   },
  { id: "security",      icon: "⬡",  label: "Security"        },
  { id: "danger",        icon: "⚠",  label: "Danger Zone"     },
];

// ── Shared helpers ─────────────────────────────────────────────────────────

function Toggle({ on, onChange }) {
  return (
    <div className="toggle-wrap" onClick={() => onChange(!on)}>
      <div className={`toggle-track${on ? " on" : ""}`}>
        <div className="toggle-thumb" />
      </div>
    </div>
  );
}

function Spinner() { return <span className="st-spinner" />; }

function initials(name = "") {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("") || "?";
}

// ── PROFILE SECTION ────────────────────────────────────────────────────────

function ProfileSection({ seller, authFetch, onSaved }) {
  const [form,    setForm]    = useState({
    fullName:     "",
    businessName: "",
    email:        "",
    phone:        "",
  });
  const [dirty,   setDirty]   = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  // Populate from seller context whenever it arrives
  useEffect(() => {
    if (seller) {
      setForm({
        fullName:     seller.fullName     || "",
        businessName: seller.businessName || "",
        email:        seller.email        || "",
        phone:        seller.phone        || "",
      });
    }
  }, [seller]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setDirty(true);
    setSuccess("");
    setError("");
  };

  const save = async () => {
    if (!form.fullName.trim()) { setError("Full name is required."); return; }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res  = await authFetch("/api/auth/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          fullName:     form.fullName.trim(),
          businessName: form.businessName.trim(),
          email:        form.email.trim(),
          phone:        form.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess("Profile saved successfully.");
      setDirty(false);
      onSaved?.(data.seller);
    } catch (err) {
      setError(err.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    if (seller) setForm({
      fullName:     seller.fullName     || "",
      businessName: seller.businessName || "",
      email:        seller.email        || "",
      phone:        seller.phone        || "",
    });
    setDirty(false);
    setSuccess("");
    setError("");
  };

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Profile Settings</div>
        <div className="st-section-sub">Your seller identity — name and contact details</div>
      </div>

      {success && <div className="st-api-success">✓ {success}</div>}
      {error   && <div className="st-api-error">⚠ {error}</div>}

      {/* Identity preview */}
      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Store Identity</div>
            <div className="st-card-sub">Shown on buyer tracking pages</div>
          </div>
        </div>
        <div className="avatar-block">
          <div className="avatar-circle">
            {initials(form.businessName || form.fullName)}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
              {form.businessName || form.fullName || "Your Store"}
            </div>
            <div className="avatar-info">{form.email || "—"}</div>
            <div className="avatar-info" style={{ marginTop: 3 }}>Seller · SwiftPort</div>
          </div>
        </div>
      </div>

      {/* Personal info — correct field keys matching the Seller model */}
      <div className="st-card">
        <div className="st-card-head">
          <div><div className="st-card-title">Account Information</div></div>
        </div>
        {[
          { label: "Full Name",     key: "fullName",     type: "text",  placeholder: "Your full legal name",       required: true },
          { label: "Business Name", key: "businessName", type: "text",  placeholder: "Your store / business name",
            sub: "Appears on the buyer tracking page instead of your full name" },
          { label: "Email Address", key: "email",        type: "email", placeholder: "you@example.com" },
          { label: "Phone Number",  key: "phone",        type: "tel",   placeholder: "+234 801 234 5678",
            sub: "Used for account recovery only" },
        ].map(f => (
          <div key={f.key} className="st-row">
            <div>
              <div className="st-row-label">{f.label}{f.required && <span style={{ color: "var(--rust)", marginLeft: 3 }}>*</span>}</div>
              {f.sub && <div className="st-row-sub">{f.sub}</div>}
            </div>
            <div className="st-row-right">
              <input className="st-input" type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={e => set(f.key, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="save-bar">
          <span className="save-bar-msg">Unsaved changes</span>
          <div className="save-bar-actions">
            <button className="btn-discard" onClick={discard} disabled={saving}>Discard</button>
            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? <><Spinner /> Saving…</> : "Save Changes"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── QR BRANDING SECTION ────────────────────────────────────────────────────

function BrandingSection({ seller, authFetch, onSaved }) {
  const fileRef = useRef(null);
  const [form, setForm]             = useState({
    businessPhone: "",
    whatsapp:      "",
    instagram:     "",
    bio:           "",
  });
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [dirty,       setDirty]       = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (seller) {
      setForm({
        businessPhone: seller.businessPhone || seller.phone || "",
        whatsapp:      seller.whatsapp      || seller.phone || "",
        instagram:     seller.instagram     || "",
        bio:           seller.bio           || "",
      });
      if (seller.logo) setLogoPreview(`${API_BASE}${seller.logo}`);
    }
  }, [seller]);

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setDirty(true); setSuccess(""); setError(""); };

  const handleLogoUpload = (file) => {
    if (!file) return;
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) { setError("Only JPG, PNG or WEBP allowed."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Logo must be under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = e => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);
    setLogoFile(file);
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const body = new FormData();
      body.append("businessPhone", form.businessPhone.trim());
      body.append("whatsapp",      form.whatsapp.trim());
      body.append("instagram",     form.instagram.trim());
      body.append("bio",           form.bio.trim());
      if (logoFile) body.append("logo", logoFile);

      // PATCH /api/auth/me accepts multipart when logo is present
      const res  = await authFetch("/api/auth/me", { method: "PATCH", body });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess("QR branding saved.");
      setDirty(false);
      setLogoFile(null);
      onSaved?.(data.seller);
    } catch (err) {
      setError(err.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">QR Branding</div>
        <div className="st-section-sub">
          Your logo, WhatsApp number and Instagram shown in dispatch success screens and QR codes
        </div>
      </div>

      {success && <div className="st-api-success">✓ {success}</div>}
      {error   && <div className="st-api-error">⚠ {error}</div>}

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Business Logo</div>
            <div className="st-card-sub">JPG/PNG/WEBP · Max 2 MB · Shown in dispatch success modal</div>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Logo image</div>
            <div className="st-row-sub">Displayed when a buyer scans a QR code or opens a tracking link</div>
          </div>
          <div className="st-row-right">
            {logoPreview ? (
              <div className="logo-preview-wrap">
                <img className="logo-preview-img" src={logoPreview} alt="Logo preview" />
                <button className="btn-outline" onClick={() => { setLogoPreview(null); setLogoFile(null); setDirty(true); }}>
                  Remove
                </button>
              </div>
            ) : (
              <button className="btn-outline" onClick={() => fileRef.current?.click()}>
                Upload Logo
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={e => handleLogoUpload(e.target.files[0])} />
          </div>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Contact Links</div>
            <div className="st-card-sub">These go into the QR vCard and dispatch success modals</div>
          </div>
        </div>
        {[
          {
            key: "businessPhone", label: "Business Phone", type: "tel",
            placeholder: "+234 801 234 5678",
            sub: "Buyer can save this number when scanning QR",
          },
          {
            key: "whatsapp", label: "WhatsApp Number", type: "tel",
            placeholder: "+234 801 234 5678",
            sub: "International format — creates a direct chat link on scan",
          },
          {
            key: "instagram", label: "Instagram Username", type: "text",
            placeholder: "@yourshopng",
            sub: "@handle — becomes a clickable link in QR scan",
          },
        ].map(f => (
          <div key={f.key} className="st-row">
            <div>
              <div className="st-row-label">{f.label}</div>
              <div className="st-row-sub">{f.sub}</div>
            </div>
            <div className="st-row-right">
              <input className="st-input" type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={e => set(f.key, e.target.value)} />
            </div>
          </div>
        ))}

        {/* Bio — full-width textarea */}
        <div className="st-row" style={{ alignItems: "flex-start" }}>
          <div style={{ paddingTop: 4 }}>
            <div className="st-row-label">Business Bio</div>
            <div className="st-row-sub">Short description printed on the dispatch slip · Max 200 characters</div>
          </div>
          <div className="st-row-right" style={{ flex: 1, maxWidth: 340 }}>
            <textarea
              style={{
                width: "100%", minHeight: 76, border: "1.5px solid var(--mist)",
                background: "var(--white)", padding: "10px 12px", resize: "vertical",
                fontFamily: "'Syne',sans-serif", fontSize: 13, color: "var(--ink)",
                outline: "none", lineHeight: 1.55, transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = "var(--rust)"}
              onBlur={e  => e.target.style.borderColor = "var(--mist)"}
              placeholder="e.g. Premium fashion store based in Lagos. We sell quality clothing, bags & accessories. Fast delivery across Nigeria."
              maxLength={200}
              value={form.bio}
              onChange={e => set("bio", e.target.value)}
            />
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", textAlign: "right", marginTop: 3 }}>
              {form.bio.length}/200
            </div>
          </div>
        </div>
      </div>

      {dirty && (
        <div className="save-bar">
          <span className="save-bar-msg">Unsaved QR branding changes</span>
          <div className="save-bar-actions">
            <button className="btn-discard" onClick={() => { setDirty(false); setSuccess(""); setError(""); }} disabled={saving}>
              Discard
            </button>
            <button className="btn-save" onClick={save} disabled={saving}>
              {saving ? <><Spinner /> Saving…</> : "Save QR Branding"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── TRUST & REVIEWS SECTION ────────────────────────────────────────────────

function TrustSection({ authFetch }) {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      authFetch("/api/reviews/seller").then(r => r.json()).catch(() => null),
      authFetch("/api/dispatches?limit=1000").then(r => r.json()).catch(() => null),
    ]).then(([revData, ordData]) => {
      if (revData?.success)  setStats(revData.stats);
      if (ordData?.success)  setOrders(ordData.dispatches || []);
      setLoading(false);
    });
  }, [authFetch]);

  if (loading) {
    return (
      <div className="st-section-header">
        <div className="st-section-title">Trust &amp; Reviews</div>
        <div className="st-section-sub">Loading your trust score…</div>
      </div>
    );
  }

  const total    = orders.length;
  const delivered = orders.filter(o => o.status === "Delivered").length;
  const withProof = orders.filter(o => o.waybillUrl).length;
  const issues    = orders.filter(o => o.status === "Issue Raised").length;
  const proofPct  = total > 0 ? Math.round(withProof / total * 100) : 0;
  const delivPct  = total > 0 ? Math.round(delivered / total * 100) : 0;

  const score = Math.min(100, Math.round(
    proofPct * 0.35 +
    delivPct * 0.35 +
    (stats?.avgRating ? (stats.avgRating / 5) * 100 * 0.20 : 50 * 0.20) +
    (issues === 0 ? 10 : Math.max(0, 10 - issues * 2))
  ));
  const scoreColor = score >= 80 ? "var(--success)" : score >= 60 ? "#b07d2a" : "var(--rust)";

  const stars = n => [1,2,3,4,5].map(i => (
    <span key={i} style={{ color: i <= Math.round(n) ? "#f5a623" : "var(--mist)", fontSize: 14 }}>★</span>
  ));

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Trust &amp; Reviews</div>
        <div className="st-section-sub">Your credibility score as seen by buyers</div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div><div className="st-card-title">Your Trust Score</div></div>
          <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", letterSpacing: "0.08em" }}>LIVE</span>
        </div>
        <div className="trust-score-card">
          <div className="trust-score-row">
            <div className="trust-score-num" style={{ color: scoreColor }}>{score}</div>
            <div>
              <div className="trust-score-label" style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "var(--ink)", marginBottom: 3 }}>
                {score >= 80 ? "🏆 Excellent seller" : score >= 60 ? "⚡ Good seller" : "⚠ Needs attention"}
              </div>
              <div className="trust-score-label">out of 100 · based on your orders and reviews</div>
            </div>
          </div>
          <div className="trust-bar-track">
            <div className="trust-bar-fill" style={{ width: `${score}%`, background: scoreColor }} />
          </div>
          <div className="trust-items">
            {[
              { label: "Proof upload rate",  val: `${proofPct}%`,  cls: proofPct >= 90 ? "good" : proofPct >= 70 ? "warn" : "bad" },
              { label: "Delivery rate",      val: `${delivPct}%`,  cls: delivPct >= 85 ? "good" : delivPct >= 70 ? "warn" : "bad" },
              { label: "Avg buyer rating",   val: stats?.total > 0 ? `${stats.avgRating.toFixed(1)} ★` : "No reviews yet", cls: (stats?.avgRating ?? 0) >= 4 ? "good" : "warn" },
              { label: "Open disputes",      val: issues === 0 ? "None 🎉" : `${issues} open`, cls: issues === 0 ? "good" : "bad" },
              { label: "Total reviews",      val: stats?.total ?? 0, cls: "" },
              { label: "Would buy again",    val: stats?.wouldBuyAgainPct != null ? `${stats.wouldBuyAgainPct}%` : "—", cls: (stats?.wouldBuyAgainPct ?? 0) >= 80 ? "good" : "warn" },
            ].map(r => (
              <div key={r.label} className="trust-item">
                <span className="trust-item-label">{r.label}</span>
                <span className={`trust-item-val${r.cls ? ` ${r.cls}` : ""}`}>{r.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {stats?.total > 0 && (
        <div className="st-card">
          <div className="st-card-head">
            <div>
              <div className="st-card-title">Buyer Reviews</div>
              <div className="st-card-sub">{stats.total} review{stats.total !== 1 ? "s" : ""} · {stats.avgRating.toFixed(1)} average</div>
            </div>
            <div style={{ display: "flex", gap: 2 }}>{stars(stats.avgRating)}</div>
          </div>
          {stats.distribution.map(d => (
            <div key={d.star} className="st-row" style={{ padding: "10px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", width: 8 }}>{d.star}</span>
                <span style={{ color: "#f5a623", fontSize: 12 }}>★</span>
                <div style={{ flex: 1, height: 6, background: "var(--mist)", position: "relative" }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, height: "100%",
                    width: `${d.pct}%`,
                    background: d.star >= 4 ? "#f5a623" : d.star === 3 ? "#b07d2a" : "var(--rust)",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "var(--warm-gray)", width: 24, textAlign: "right" }}>{d.count}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── NOTIFICATIONS SECTION ──────────────────────────────────────────────────

function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    orderDelivered:  true,
    buyerConfirmed:  true,
    disputeOpened:   true,
    disputeReply:    true,
    reviewReceived:  true,
    missingProof:    true,
    weeklyReport:    false,
    marketingEmails: false,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = k => { setPrefs(p => ({ ...p, [k]: !p[k] })); setDirty(true); setSaved(false); };

  const rows = [
    { key: "orderDelivered",  label: "Order marked as Delivered",    sub: "When you or a buyer confirms an order as received" },
    { key: "buyerConfirmed",  label: "Buyer confirms receipt",        sub: "When a buyer taps 'I received this' on the tracking page" },
    { key: "disputeOpened",   label: "New dispute opened",            sub: "Immediately when a buyer raises an issue — respond quickly" },
    { key: "disputeReply",    label: "Buyer replies to a dispute",    sub: "When a buyer sends a follow-up message on an open dispute" },
    { key: "reviewReceived",  label: "New buyer review",              sub: "When a buyer submits a star rating and comment" },
    { key: "missingProof",    label: "Missing dispatch proof",        sub: "Reminder if an order has no waybill uploaded after 24h" },
    { key: "weeklyReport",    label: "Weekly performance summary",    sub: "Every Monday — delivery rate, reviews, disputes overview" },
    { key: "marketingEmails", label: "Product updates &amp; tips",    sub: "SwiftPort tips on building buyer trust and growing your store" },
  ];

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Notifications</div>
        <div className="st-section-sub">Choose which email alerts you receive</div>
      </div>

      {saved && <div className="st-api-success">✓ Notification preferences saved.</div>}

      <div className="st-card">
        <div className="st-card-head"><div><div className="st-card-title">Email Notifications</div></div></div>
        {rows.map(r => (
          <div key={r.key} className="st-row">
            <div>
              <div className="st-row-label" dangerouslySetInnerHTML={{ __html: r.label }} />
              <div className="st-row-sub">{r.sub}</div>
            </div>
            <div className="st-row-right">
              <Toggle on={prefs[r.key]} onChange={() => toggle(r.key)} />
            </div>
          </div>
        ))}
      </div>

      {dirty && (
        <div className="save-bar">
          <span className="save-bar-msg">Unsaved notification changes</span>
          <div className="save-bar-actions">
            <button className="btn-discard" onClick={() => { setDirty(false); }}>Discard</button>
            <button className="btn-save" onClick={() => { setDirty(false); setSaved(true); }}>
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ── SECURITY SECTION ───────────────────────────────────────────────────────

function SecuritySection({ authFetch }) {
  const [curr,    setCurr]    = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState("");
  const [error,   setError]   = useState("");

  const passwordMatch    = next.length >= 8 && confirm && next === confirm;
  const passwordMismatch = next && confirm && next !== confirm;

  const savePassword = async () => {
    if (!curr.trim())      { setError("Please enter your current password."); return; }
    if (next.length < 8)   { setError("New password must be at least 8 characters."); return; }
    if (!passwordMatch)    { setError("Passwords do not match."); return; }

    setSaving(true); setError(""); setSuccess("");
    try {
      const res  = await authFetch("/api/auth/me", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ currentPassword: curr, newPassword: next }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSuccess("Password updated successfully.");
      setCurr(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Security</div>
        <div className="st-section-sub">Manage your password and account access</div>
      </div>

      {success && <div className="st-api-success">✓ {success}</div>}
      {error   && <div className="st-api-error">⚠ {error}</div>}

      <div className="st-card">
        <div className="st-card-head"><div><div className="st-card-title">Change Password</div></div></div>

        <div className="st-row">
          <div><div className="st-row-label">Current Password</div></div>
          <div className="st-row-right">
            <input className="st-input" type="password" placeholder="••••••••"
              value={curr} onChange={e => { setCurr(e.target.value); setError(""); }} />
          </div>
        </div>

        <div className="st-row">
          <div>
            <div className="st-row-label">New Password</div>
            <div className="st-row-sub">Minimum 8 characters</div>
          </div>
          <div className="st-row-right">
            <input className={`st-input${next && next.length < 8 ? " has-error" : ""}`}
              type="password" placeholder="New password"
              value={next} onChange={e => { setNext(e.target.value); setError(""); }} />
          </div>
        </div>

        <div className="st-row">
          <div>
            <div className="st-row-label">Confirm New Password</div>
            {passwordMismatch && <div className="st-field-hint err">Passwords do not match</div>}
            {passwordMatch    && <div className="st-field-hint ok">✓ Passwords match</div>}
          </div>
          <div className="st-row-right">
            <input className={`st-input${passwordMismatch ? " has-error" : ""}`}
              type="password" placeholder="Repeat new password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setError(""); }} />
          </div>
        </div>

        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end" }}>
          <button className="btn-save"
            style={{ background: passwordMatch && curr ? "var(--rust)" : "#c4c0ba", cursor: passwordMatch && curr ? "pointer" : "not-allowed" }}
            onClick={savePassword}
            disabled={!passwordMatch || !curr || saving}>
            {saving ? <><Spinner /> Updating…</> : "Update Password"}
          </button>
        </div>
      </div>

      <div className="st-card">
        <div className="st-card-head">
          <div>
            <div className="st-card-title">Account Access</div>
            <div className="st-card-sub">Your current SwiftPort session</div>
          </div>
        </div>
        <div className="st-row">
          <div>
            <div className="st-row-label">Active session</div>
            <div className="st-row-sub">You are currently signed in to SwiftPort</div>
          </div>
          <div className="st-row-right">
            <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "var(--success)", letterSpacing: "0.06em" }}>
              ● Active
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

// ── DANGER SECTION ─────────────────────────────────────────────────────────

function DangerSection({ logout }) {
  const [confirming, setConfirming] = useState(null);

  const actions = [
    {
      id: "export",
      label: "Export My Data",
      sub: "Download a full JSON export of all your orders and account data",
      btn: "Export", style: "outline",
      action: () => alert("Data export coming soon — we'll email it to you."),
    },
    {
      id: "clear",
      label: "Clear Order History",
      sub: "Permanently delete all dispatches. This cannot be undone.",
      btn: "Clear History", style: "danger",
      action: () => alert("This feature is disabled for safety. Contact support."),
    },
    {
      id: "delete",
      label: "Delete Account",
      sub: "Permanently close your SwiftPort seller account and erase all data",
      btn: "Delete Account", style: "danger",
      action: () => alert("Contact support@swiftport.io to delete your account."),
    },
  ];

  return (
    <>
      <div className="st-section-header">
        <div className="st-section-title">Danger Zone</div>
        <div className="st-section-sub">Irreversible actions — proceed with caution</div>
      </div>

      <div className="st-card">
        <div className="st-card-head" style={{ borderBottom: "1.5px solid #f5ddd8" }}>
          <div><div className="st-card-title" style={{ color: "var(--rust)" }}>Destructive Actions</div></div>
        </div>
        {actions.map(r => (
          <div key={r.id} className="st-danger-row">
            <div>
              <div className="st-danger-label">{r.label}</div>
              <div className="st-danger-sub">{r.sub}</div>
            </div>
            {confirming === r.id ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-danger" style={{ fontSize: 12 }}
                  onClick={() => { r.action(); setConfirming(null); }}>
                  Confirm
                </button>
                <button className="btn-outline" style={{ fontSize: 12 }}
                  onClick={() => setConfirming(null)}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className={r.style === "danger" ? "btn-danger" : "btn-outline"}
                onClick={() => r.style === "danger" ? setConfirming(r.id) : r.action()}>
                {r.btn}
              </button>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// ── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function Settings() {
  const navigate                        = useNavigate();
  const { seller, setSeller, authFetch, logout } = useAuth();
  const [activeNav,     setActiveNav]   = useState("Settings");
  const [activeSection, setSection]     = useState("profile");

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection seller={seller} authFetch={authFetch}
          onSaved={updated => updated && setSeller(updated)} />;
      case "branding":
        return <BrandingSection seller={seller} authFetch={authFetch}
          onSaved={updated => updated && setSeller(updated)} />;
      case "trust":
        return <TrustSection authFetch={authFetch} />;
      case "notifications":
        return <NotificationsSection />;
      case "security":
        return <SecuritySection authFetch={authFetch} />;
      case "danger":
        return <DangerSection logout={logout} />;
      default:
        return null;
    }
  };

  return (
    <div className="st-shell">

      {/* App sidebar */}
      <aside className="st-sidebar">
        {NAV_ICONS.map(n => (
          <div key={n.label} title={n.label}
            className={`sb-icon${activeNav === n.label ? " active" : ""}`}
            onClick={() => { setActiveNav(n.label); navigate(n.path); }}>
            {n.icon}
          </div>
        ))}
        <div className="sb-sep" />
        <div className="sb-bottom">
          <div className="sb-icon" title="Sign Out"
            onClick={() => { logout(); navigate("/login"); }}>↩</div>
        </div>
      </aside>

      <div className="st-main">
        <div className="st-body">

          {/* Settings left nav */}
          <nav className="st-nav">
            <div className="st-nav-title">Settings</div>
            {SETTINGS_NAV.map((item, i) => (
              <div key={item.id}>
                {/* Separator before Danger Zone */}
                {item.id === "danger" && <div className="st-nav-sep" />}
                <button
                  className={`st-nav-item${activeSection === item.id ? " active" : ""}`}
                  onClick={() => setSection(item.id)}>
                  <span className="st-nav-icon">{item.icon}</span>
                  {item.label}
                </button>
              </div>
            ))}
          </nav>

          {/* Content area */}
          <div className="st-content">
            {renderSection()}
          </div>

        </div>
      </div>
    </div>
  );
}
