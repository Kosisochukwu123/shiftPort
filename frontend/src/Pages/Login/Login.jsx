import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const ACCOUNTS = [
  { email: "admin@swiftport.io", password: "admin123", role: "admin", name: "James Okafor" },
  { email: "user@swiftport.io",  password: "user123",  role: "user",  name: "Emeka Eze"    },
  { email: "user2@swiftport.io", password: "user123",  role: "user",  name: "Amaka Nwosu"  },
];

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setTimeout(() => {
      const account = ACCOUNTS.find(
        a => a.email === email.trim().toLowerCase() && a.password === password
      );
      if (account) {
        sessionStorage.setItem("sp_role", account.role);
        sessionStorage.setItem("sp_user", account.name);
        navigate(account.role === "admin" ? "/dashboard" : "/portal/dashboard");
      } else {
        setError("Invalid email or password.");
        setLoading(false);
      }
    }, 800);
  };

  const fillDemo = a => { setEmail(a.email); setPassword(a.password); setError(""); };
  const handleKey = e => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div className="login-shell">

      {/* Left brand panel */}
      <div className="login-left">
        <div className="login-brand" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
          <div className="login-brand-mark">
            <svg viewBox="0 0 24 24">
              <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
            </svg>
          </div>
          <div>
            <div className="login-brand-name">Swift<span>Port</span></div>
            <div className="login-brand-tag">Logistics Platform</div>
          </div>
        </div>

        <div className="login-hero">
          <div className="login-hero-title">Ship smarter.<br />Track <span>everything.</span></div>
          <div className="login-hero-sub">
            The complete logistics platform for businesses and individuals.
            Real-time tracking, multi-carrier support, and doorstep pickup.
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#2a2a3a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
            Demo credentials
          </div>
          {ACCOUNTS.map(a => (
            <div key={a.email}
              onClick={() => fillDemo(a)}
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#44495e", cursor: "pointer", marginBottom: 6, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#6ee7a0"}
              onMouseLeave={e => e.currentTarget.style.color = "#44495e"}
            >
              {a.role === "admin" ? "⬡ ADMIN" : "◎ USER "} · {a.email} / {a.password}
            </div>
          ))}
        </div>
      </div>

      {/* Right form */}
      <div className="login-right">
        <div className="login-form-title">Welcome back</div>
        <div className="login-form-sub">Sign in to your SwiftPort account</div>

        <div className="login-form">
          {error && <div className="form-error">⚠ {error}</div>}

          <div className="form-field">
            <label className="form-label">Email Address</label>
            <input className={`form-input${error ? " error" : ""}`}
              type="email" placeholder="you@company.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={handleKey} autoFocus />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <input className={`form-input${error ? " error" : ""}`}
                type={showPass ? "text" : "password"} placeholder="Enter your password"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKey} style={{ width: "100%", paddingRight: 40 }} />
              <span className="form-input-icon" onClick={() => setShowPass(v => !v)}>
                {showPass ? "🙈" : "👁"}
              </span>
            </div>
          </div>

          <div className="form-row">
            <label className="form-remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button className="form-forgot">Forgot password?</button>
          </div>

          <button className={`btn-login${loading ? " loading" : ""}`}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div className="login-divider">OR</div>
          <button className="btn-sso"><span>⬡</span> Continue with SSO</button>
        </div>

        <div className="login-footer">
          Don't have an account?{" "}
          <a onClick={() => navigate("/portal/signup")} style={{ cursor: "pointer" }}>Create one free</a>
          <br /><br />
          <a style={{ cursor: "pointer" }}>Privacy Policy</a> · <a style={{ cursor: "pointer" }}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
