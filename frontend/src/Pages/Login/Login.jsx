import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { login, loading } = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");

  // Where to go after login — default to dashboard
  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please enter your email and password."); return; }

    const result = await login(email.trim(), password);

    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Invalid email or password.");
    }
  };

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
            <div className="login-brand-tag">Seller Dashboard</div>
          </div>
        </div>

        <div className="login-hero">
          <div className="login-hero-title">
            Prove you shipped.<br />Build <span>trust.</span>
          </div>
          <div className="login-hero-sub">
            The easiest way for Nigerian sellers to show buyers their order is on the way — with real proof, real tracking, zero arguments.
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#2a2a3a", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>
            No account yet?
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#44495e", lineHeight: 1.7 }}>
            Create a free seller account and start generating dispatch proof in minutes.
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="login-right">
        <div className="login-form-title">Welcome back</div>
        <div className="login-form-sub">Sign in to your SwiftPort seller account</div>

        <div className="login-form">
          {error && <div className="form-error">⚠ {error}</div>}

          <div className="form-field">
            <label className="form-label">Email Address</label>
            <input className={`form-input${error ? " error" : ""}`}
              type="email" placeholder="you@business.com"
              value={email} onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              autoFocus />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <input className={`form-input${error ? " error" : ""}`}
                type={showPass ? "text" : "password"} placeholder="Your password"
                value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                style={{ width: "100%", paddingRight: 40 }} />
              <span className="form-input-icon" onClick={() => setShowPass(v => !v)}>
                {showPass ? "🙈" : "👁"}
              </span>
            </div>
          </div>

          <button className={`btn-login${loading ? " loading" : ""}`}
            onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>

          <div className="login-divider">OR</div>

          <button className="btn-sso" onClick={() => navigate("/register")}>
            <span>⬡</span> Create a seller account
          </button>
        </div>

        <div className="login-footer">
          Don't have an account?{" "}
          <a onClick={() => navigate("/register")} style={{ cursor: "pointer" }}>
            Register free →
          </a>
        </div>
      </div>
    </div>
  );
}
