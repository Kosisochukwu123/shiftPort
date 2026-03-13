import { useNavigate } from "react-router-dom";
import "./NotFound.css";

const QUICK_LINKS = [
  { label: "Dashboard",  path: "/dashboard"  },
  { label: "Shipments",  path: "/shipments"  },
  { label: "Tracking",   path: "/tracking"   },
  { label: "Analytics",  path: "/analytics"  },
  { label: "Settings",   path: "/settings"   },
];

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="nf-shell">
      <div className="nf-glow" />

      {/* Brand */}
      <div className="nf-brand" onClick={() => navigate("/dashboard")}>
        <div className="nf-brand-mark">
          <svg viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
          </svg>
        </div>
        <div className="nf-brand-name">Swift<span>Port</span></div>
      </div>

      {/* Content */}
      <div className="nf-content">
        <div className="nf-code">404</div>
        <span className="nf-icon">◎</span>
        <div className="nf-title">Page <span>not found</span></div>
        <div className="nf-sub">
          The page you're looking for doesn't exist or has been moved.<br />
          Let's get you back on track.
        </div>

        <div className="nf-actions">
          <button className="btn-home" onClick={() => navigate("/dashboard")}>
            ⬡ Go to Dashboard
          </button>
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>

        <div className="nf-links">
          {QUICK_LINKS.map(l => (
            <button key={l.label} className="nf-link" onClick={() => navigate(l.path)}>
              {l.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
