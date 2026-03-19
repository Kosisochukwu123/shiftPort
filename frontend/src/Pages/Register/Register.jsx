import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Register.css";

export default function Register() {
  const navigate  = useNavigate();
  const { register, loading } = useAuth();

  const [form, setForm] = useState({
    fullName: "", businessName: "", email: "",
    phone: "", password: "", confirm: "",
  });
  const [showPass,  setShowPass]  = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [errors,    setErrors]    = useState({});
  const [apiError,  setApiError]  = useState("");

  const set = key => e => {
    setForm(f => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors(er => ({ ...er, [key]: null }));
    setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim())     e.fullName     = "Full name is required.";
    if (!form.businessName.trim()) e.businessName = "Business / store name is required.";
    if (!form.email.trim())        e.email        = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password)            e.password     = "Password is required.";
    else if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.password !== form.confirm) e.confirm  = "Passwords do not match.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const result = await register({
      fullName:     form.fullName.trim(),
      businessName: form.businessName.trim(),
      email:        form.email.trim(),
      phone:        form.phone.trim(),
      password:     form.password,
    });

    if (result.success) {
      navigate("/dashboard", { replace: true });
    } else {
      setApiError(result.message || "Registration failed. Please try again.");
    }
  };

  const F = ({ name, label, placeholder, type = "text", hint, required, children }) => (
    <div className="reg-field">
      <label className="reg-label">{label}{required && <span> *</span>}</label>
      {children || (
        <input
          className={`reg-input${errors[name] ? " error" : ""}`}
          type={type} placeholder={placeholder}
          value={form[name]} onChange={set(name)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
      )}
      {errors[name] ? <div className="reg-error-msg">{errors[name]}</div>
                    : hint ? <div className="reg-hint">{hint}</div> : null}
    </div>
  );

  return (
    <div className="reg-shell">

      {/* Left panel */}
      <div className="reg-left">
        <div className="reg-brand" onClick={() => navigate("/")}>
          <div className="reg-brand-mark">
            <svg viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/></svg>
          </div>
          <div className="reg-brand-name">Swift<span>Port</span></div>
        </div>

        <div className="reg-hero">
          <div className="reg-hero-title">Stop losing buyers to <em>"where is my order?"</em></div>
          <div className="reg-hero-sub">
            SwiftPort gives every Nigerian seller a simple tool to prove they shipped — and gives every buyer peace of mind.
          </div>
        </div>

        <div className="reg-perks">
          {[
            ["◎", "Generate a tracking ID the moment you dispatch an order."],
            ["🛡️", "Upload your waybill as timestamped proof of dispatch."],
            ["📱", "Share a tracking link on WhatsApp in one tap."],
            ["✓",  "Buyer confirms delivery — your reputation is protected."],
          ].map(([icon, text]) => (
            <div key={text} className="reg-perk">
              <div className="reg-perk-icon">{icon}</div>
              <div className="reg-perk-text">{text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="reg-right">
        <div className="reg-form-wrap">
          <div className="reg-title">Create your account</div>
          <div className="reg-sub">Free to start · No credit card · Takes 2 minutes</div>

          <div className="reg-form">
            {apiError && <div className="api-error"><span>⚠</span><span>{apiError}</span></div>}

            <div className="reg-grid-2">
              <F name="fullName"     label="Your Full Name"     placeholder="e.g. Emeka Eze"     required />
              <F name="businessName" label="Business / Store Name" placeholder="e.g. Emeka Gadgets" required
                hint="This is what buyers see on their tracking page." />
            </div>

            <F name="email" label="Email Address" type="email" placeholder="you@business.com" required />

            <F name="phone" label="Phone Number" placeholder="+234 801 234 5678"
              hint="Used if buyers need to reach you about an order." />

            <div className="reg-divider" />

            <div className="reg-grid-2">
              <div className="reg-field">
                <label className="reg-label">Password <span>*</span></label>
                <div className="form-input-wrap">
                  <input className={`reg-input${errors.password ? " error" : ""}`}
                    type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
                    value={form.password} onChange={set("password")}
                    style={{ paddingRight: 36 }} />
                  <span className="form-input-icon" onClick={() => setShowPass(v => !v)}>
                    {showPass ? "🙈" : "👁"}
                  </span>
                </div>
                {errors.password && <div className="reg-error-msg">{errors.password}</div>}
              </div>

              <div className="reg-field">
                <label className="reg-label">Confirm Password <span>*</span></label>
                <div className="form-input-wrap">
                  <input className={`reg-input${errors.confirm ? " error" : ""}`}
                    type={showConf ? "text" : "password"} placeholder="Repeat password"
                    value={form.confirm} onChange={set("confirm")}
                    style={{ paddingRight: 36 }} />
                  <span className="form-input-icon" onClick={() => setShowConf(v => !v)}>
                    {showConf ? "🙈" : "👁"}
                  </span>
                </div>
                {errors.confirm && <div className="reg-error-msg">{errors.confirm}</div>}
              </div>
            </div>

            <button className="btn-register" onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating account…" : "Create Seller Account →"}
            </button>
          </div>

          <div className="reg-footer">
            Already have an account?{" "}
            <a onClick={() => navigate("/login")}>Sign in →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
