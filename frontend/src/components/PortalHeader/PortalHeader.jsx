import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./PortalHeader.css";

const NAV = [
  { label: "Dashboard", path: "/portal/dashboard" },
  { label: "My Shipments", path: "/portal/orders" },
  { label: "Track", path: "/portal/track" },
  { label: "New Shipment", path: "/portal/new" },
  { label: "Notifications", path: "/portal/notifications" },
];

export default function PortalHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // mobile menu

  const userName = sessionStorage.getItem("sp_user") || "User";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const logout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false); // close menu on click
  };

  return (
    <header className="portal-header">
      {/* Brand */}
      <div className="ph-brand" onClick={() => navigate("/portal/dashboard")}>
        <div className="ph-brand-mark">
          <svg viewBox="0 0 24 24">
            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
          </svg>
        </div>
        <div className="ph-brand-name">
          Swift<span>Port</span>
        </div>
      </div>

      <div className="iii">
        {/* Hamburger */}
        <button
          className={`ph-hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Nav */}
        <nav className={`ph-nav ${menuOpen ? "show" : ""}`}>
          {NAV.map((n) => (
            <button
              key={n.path}
              className={`ph-nav-link ${
                pathname.startsWith(n.path) ? "active" : ""
              }`}
              onClick={() => handleNavigate(n.path)}
            >
              {n.label}
            </button>
          ))}
        </nav>

        {/* Right side */}
        <div className="ph-right">
          <button
            className="ph-new-btn"
            onClick={() => navigate("/portal/new")}
          >
            + Ship Now
          </button>

          <button
            className="ph-notif-btn"
            onClick={() => navigate("/portal/notifications")}
          >
            🔔
            <span className="ph-notif-dot" />
          </button>

          <div className="ph-avatar" onClick={() => setAvatarOpen((v) => !v)}>
            {initials}

            {avatarOpen && (
              <div className="ph-dropdown">
                <div className="ph-dropdown-name">
                  {userName}
                  <div className="ph-dropdown-role">Customer</div>
                </div>

                <button
                  className="ph-dropdown-item"
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate("/portal/profile");
                  }}
                >
                  My Profile
                </button>

                <button
                  className="ph-dropdown-item"
                  onClick={() => {
                    setAvatarOpen(false);
                    navigate("/portal/orders");
                  }}
                >
                  My Shipments
                </button>

                <button className="ph-dropdown-item danger" onClick={logout}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
