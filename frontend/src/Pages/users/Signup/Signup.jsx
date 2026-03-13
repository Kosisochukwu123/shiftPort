import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Signup.css";

const PERKS = [
  { icon: "◎", title: "Real-Time Tracking",     desc: "Follow your shipments live from pickup to delivery on an interactive map." },
  { icon: "◈", title: "Multi-Carrier Rates",     desc: "Compare DHL, FedEx, and UPS side-by-side and pick the best price." },
  { icon: "⬡", title: "Doorstep Pickup",         desc: "Schedule a pickup from anywhere. We come to you." },
  { icon: "🔔", title: "Smart Notifications",    desc: "Instant alerts at every milestone via email and SMS." },
];

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm]       = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirm: "", accountType: "personal" });
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [agreed,   setAgreed]       = useState(false);
  const [loading,  setLoading]      = useState(false);
  const [error,    setError]        = useState("");

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = () => {
    setError("");
    const { firstName, lastName, email, password, confirm } = form;
    if (!firstName || !lastName || !email || !password || !confirm) { setError("Please fill in all required fields."); return; }
    if (password !== confirm)   { setError("Passwords do not match."); return; }
    if (password.length < 6)    { setError("Password must be at least 6 characters."); return; }
    if (!agreed)                { setError("Please accept the Terms of Service to continue."); return; }

    setLoading(true);
    setTimeout(() => {
      sessionStorage.setItem("sp_role", "user");
      sessionStorage.setItem("sp_user", `${firstName} ${lastName}`);
      navigate("/portal/dashboard");
    }, 1000);
  };

  return (
    <div className="signup-shell">

      {/* ── LEFT ── */}
      <div className="signup-left">
        <div className="signup-brand" onClick={() => navigate("/")}>
          <div className="signup-brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
            </svg>
          </div>
          <div>
            <div className="signup-brand-name">Swift<span>Port</span></div>
          </div>
        </div>

        <div className="signup-perks">
          {PERKS.map(p => (
            <div key={p.title} className="signup-perk">
              <div className="signup-perk-icon">{p.icon}</div>
              <div>
                <div className="signup-perk-title">{p.title}</div>
                <div className="signup-perk-desc">{p.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="signup-left-foot">
          ◎ No contracts · No setup fees · Free to start
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div className="signup-right">
        <div className="signup-form-title">Create your account</div>
        <div className="signup-form-sub">Start shipping in under 2 minutes. No credit card required.</div>

        <div className="signup-form">
          {error && <div className="form-error">⚠ {error}</div>}

          <div className="form-row-2">
            <div className="sf-field">
              <label className="sf-label">First Name *</label>
              <input className="sf-input" placeholder="Emeka" value={form.firstName} onChange={set("firstName")} />
            </div>
            <div className="sf-field">
              <label className="sf-label">Last Name *</label>
              <input className="sf-input" placeholder="Eze" value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>

          <div className="sf-field">
            <label className="sf-label">Email Address *</label>
            <input className="sf-input" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
          </div>

          <div className="sf-field">
            <label className="sf-label">Phone Number</label>
            <input className="sf-input" type="tel" placeholder="+234 800 000 0000" value={form.phone} onChange={set("phone")} />
          </div>

          <div className="sf-field">
            <label className="sf-label">Account Type</label>
            <select className="sf-select" value={form.accountType} onChange={set("accountType")}>
              <option value="personal">Personal</option>
              <option value="business">Business</option>
            </select>
          </div>

          <div className="form-row-2">
            <div className="sf-field">
              <label className="sf-label">Password *</label>
              <div className="sf-input-wrap">
                <input className="sf-input" type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
                  value={form.password} onChange={set("password")} style={{ paddingRight: 36 }} />
                <span className="sf-input-icon" onClick={() => setShowPass(v => !v)}>{showPass ? "🙈" : "👁"}</span>
              </div>
            </div>
            <div className="sf-field">
              <label className="sf-label">Confirm Password *</label>
              <div className="sf-input-wrap">
                <input className="sf-input" type={showConf ? "text" : "password"} placeholder="Repeat password"
                  value={form.confirm} onChange={set("confirm")} style={{ paddingRight: 36 }} />
                <span className="sf-input-icon" onClick={() => setShowConf(v => !v)}>{showConf ? "🙈" : "👁"}</span>
              </div>
            </div>
          </div>

          <div className="terms-row">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span>I agree to SwiftPort's <a>Terms of Service</a> and <a>Privacy Policy</a>. I understand my data may be used to improve service quality.</span>
          </div>

          <button className={`btn-signup${loading ? " loading" : ""}`} onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating account…" : "Create Account →"}
          </button>
        </div>

        <div className="signup-footer">
          Already have an account?{" "}
          <a onClick={() => navigate("/login")}>Sign in →</a>
        </div>
      </div>
    </div>
  );
}
