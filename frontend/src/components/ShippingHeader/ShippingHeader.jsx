import { useState, useEffect } from "react";
import "./ShippingHeader.css";
// import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";

const NAV_LINKS = [
  { label: "Dashboard", icon: "⬡", path: "/dashboard" },
  { label: "Shipments", icon: "◈", path: "/shipments" },
  { label: "Tracking", icon: "◎", path: "/tracking" },
  { label: "Analytics", icon: "◧", path: "/analytics" },
  { label: "Settings", icon: "⊕", path: "/settings" },
];

const NOTIFICATIONS = [
  { id: 1, text: "Shipment #8821 delivered", time: "2m ago", type: "success" },
  {
    id: 2,
    text: "Label generation failed for #9103",
    time: "14m ago",
    type: "error",
  },
  { id: 3, text: "New carrier rate available", time: "1h ago", type: "info" },
];

const PROFILE_MENU = [
  { icon: "◎", label: "My Profile",      path: "/settings" },
  { icon: "⊕", label: "Preferences",     path: "/settings" },
  { icon: "◈", label: "Team Management", path: "/team"     },
  { icon: "⬡", label: "Billing & Plans", path: "/settings" },
];

export default function ShippingHeader() {
  const [activeNav, setActiveNav] = useState("/");
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeAll = () => {
    setNotifOpen(false);
    setProfileOpen(false);
  };

  return (
    <>
      <header className={`header-root${scrolled ? " scrolled" : ""}`}>
        {/* Top utility bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <span className="top-bar-status">
              <span className="status-dot" />
              All systems operational
            </span>
            <span>v2.4.1</span>
          </div>
          <div className="top-bar-right">Thu, Mar 12, 2026 — 09:41 WAT</div>
        </div>

        {/* Main header row */}
        <div className="main-header">
          {/* Logo */}
          <NavLink to="/" className="logo">
            <div className="logo-mark">
              <svg viewBox="0 0 24 24">
                <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z" />
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">
                Swift<span>Port</span>
              </span>
              <span className="logo-sub">Logistics Platform</span>
            </div>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="nav">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `nav-link${isActive ? " active" : ""}`
                }
                onClick={closeAll}
              >
                <span className="nav-link-icon">{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions */}
          <div className="actions">
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                className={`icon-btn${notifOpen ? " active" : ""}`}
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setProfileOpen(false);
                }}
                title="Notifications"
              >
                🔔
                <span className="badge" />
              </button>
              {notifOpen && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    Notifications
                    <span className="dropdown-clear">Mark all read</span>
                  </div>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="notif-item">
                      <span className={`notif-dot ${n.type}`} />
                      <div>
                        <div className="notif-text">{n.text}</div>
                        <div className="notif-time">{n.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="icon-btn" title="Help">
              ?
            </button>

            <div className="divider" />

            <div className="divider" />

            {/* Profile */}
            <div style={{ position: "relative" }}>
              <button
                className="profile-btn"
                onClick={() => {
                  setProfileOpen(!profileOpen);
                  setNotifOpen(false);
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div className="profile-name">James Okafor</div>
                  <div className="profile-role">Admin</div>
                </div>
                <div className="profile-avatar">JO</div>
              </button>

              {profileOpen && (
                <div className="dropdown profile-dropdown">
                  <div className="profile-meta">
                    <div className="profile-meta-avatar">JO</div>
                    <div>
                      <div className="profile-meta-name">James Okafor</div>
                      <div className="profile-meta-email">
                        j.okafor@swiftport.io
                      </div>
                    </div>
                  </div>

                  {PROFILE_MENU.map(item => (
                    <button
                      key={item.label}
                      className="profile-menu-item"
                      onClick={() => { closeAll(); navigate(item.path); }}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                  <hr className="profile-menu-divider" />
                  <button
                    className="profile-menu-item danger"
                    onClick={() => { sessionStorage.clear(); navigate("/login"); }}
                  >
                    <span>↩</span> Sign Out
                  </button>

                </div>

              )}
            </div>

            {/* Hamburger (mobile) */}
            <button
              className="hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <div
                className="ham-line"
                style={
                  menuOpen
                    ? { transform: "rotate(45deg) translate(5px, 5px)" }
                    : {}
                }
              />
              <div
                className="ham-line"
                style={menuOpen ? { opacity: 0 } : {}}
              />
              <div
                className="ham-line"
                style={
                  menuOpen
                    ? { transform: "rotate(-45deg) translate(5px, -5px)" }
                    : {}
                }
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="mobile-menu">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.path}
                className={({ isActive }) =>
                  `mobile-nav-link${isActive ? " active" : ""}`
                }
                onClick={() => {
                  setMenuOpen(false);
                  closeAll();
                }}
              >
                <span>{link.icon}</span>
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* Close dropdowns on outside click */}
      {(notifOpen || profileOpen) && (
        <div className="overlay" onClick={closeAll} />
      )}
    </>
  );
}
